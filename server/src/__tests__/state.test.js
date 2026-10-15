const test = require('node:test');
const assert = require('node:assert');
const { StateManager, SessionStatus } = require('../state');

test('state module tests', async (t) => {
  await t.test('getOrCreateSession initializes a new session', () => {
    const state = new StateManager();
    const session = state.getOrCreateSession('test-id');
    assert.strictEqual(session.id, 'test-id');
    assert.strictEqual(session.status, SessionStatus.IDLE);
  });

  await t.test('processHookEvent handles pre-invocation event', () => {
    const state = new StateManager();
    state.processHookEvent({ conversationId: 'test-id', eventType: 'pre-invocation' });
    const session = state.getOrCreateSession('test-id');
    assert.strictEqual(session.status, SessionStatus.WORKING);
  });

  await t.test('addTranscriptEntry adds a new entry to the session', () => {
    const state = new StateManager();
    state.addTranscriptEntry('test-id', { type: 'test', content: 'test content' });
    const session = state.getOrCreateSession('test-id');
    assert.strictEqual(session.events.length, 1);
    assert.strictEqual(session.events[0].type, 'transcript');
    assert.strictEqual(session.events[0].content, 'test content');
  });

  await t.test('addNotification adds a notification and trims old events', () => {
    const state = new StateManager();
    for (let i = 0; i < 150; i++) {
      state.addNotification('test', `message ${i}`);
    }
    assert.strictEqual(state.notifications.length, 100);
    // new notifications are unshifted (added to beginning)
    assert.strictEqual(state.notifications[0].message, 'message 149');
    assert.strictEqual(state.notifications[99].message, 'message 50');
  });

  await t.test('processHookEvent handles stop event without error', () => {
    const state = new StateManager();
    state.processHookEvent({ conversationId: 'test-id', eventType: 'stop' });
    const session = state.getOrCreateSession('test-id');
    assert.strictEqual(session.status, SessionStatus.COMPLETED);
    assert.strictEqual(session.currentTask, null);
  });

  await t.test('processHookEvent handles stop event with error', () => {
    const state = new StateManager();
    state.processHookEvent({ conversationId: 'test-id', eventType: 'stop', error: 'some error' });
    const session = state.getOrCreateSession('test-id');
    assert.strictEqual(session.status, SessionStatus.ERROR);
    assert.strictEqual(session.currentTask, null);
  });

  await t.test('processHookEvent handles missing hookPayload in post-tool-use', () => {
    const state = new StateManager();
    state.processHookEvent({ conversationId: 'test-id', eventType: 'post-tool-use' });
    const session = state.getOrCreateSession('test-id');
    assert.strictEqual(session.status, SessionStatus.WORKING);
    assert.strictEqual(session.toolCallCount, 1);
  });

  await t.test('getSessionDetail returns null for nonexistent session', () => {
    const state = new StateManager();
    const detail = state.getSessionDetail('nonexistent-id');
    assert.strictEqual(detail, null);
  });

  await t.test('addTranscriptEntry handles ASK_QUESTION and sets waiting input', () => {
    const state = new StateManager();
    state.addTranscriptEntry('test-id', { type: 'ASK_QUESTION', content: 'Do you want to proceed?' });
    const session = state.getOrCreateSession('test-id');

    assert.strictEqual(session.status, SessionStatus.WAITING_INPUT);
    assert.strictEqual(state.notifications.length, 1);
    assert.strictEqual(state.notifications[0].type, 'needs_input');
    assert.strictEqual(state.notifications[0].data.content, 'Do you want to proceed?');
  });

  await t.test('processHookEvent handles post-invocation event', () => {
    const state = new StateManager();
    state.processHookEvent({ conversationId: 'test-id', eventType: 'post-invocation' });
    const session = state.getOrCreateSession('test-id');
    assert.strictEqual(session.status, SessionStatus.WORKING);
  });

  await t.test('processHookEvent handles pre-tool-use event', () => {
    const state = new StateManager();
    state.processHookEvent({ conversationId: 'test-id', eventType: 'pre-tool-use', toolName: 'test-tool' });
    const session = state.getOrCreateSession('test-id');
    assert.strictEqual(session.status, SessionStatus.WORKING);
    assert.strictEqual(session.currentTask, 'Running: test-tool');
  });

  await t.test('markNotificationsRead handles specific ids and all ids', () => {
    const state = new StateManager();
    state.addNotification('test1', 'message 1');
    state.addNotification('test2', 'message 2');
    state.addNotification('test3', 'message 3');
    const ids = state.notifications.map(n => n.id);

    // Specific ID
    state.markNotificationsRead([ids[0]]);
    assert.strictEqual(state.notifications[0].read, true);
    assert.strictEqual(state.notifications[1].read, false);
    assert.strictEqual(state.notifications[2].read, false);

    // All IDs
    state.markNotificationsRead();
    assert.strictEqual(state.notifications[0].read, true);
    assert.strictEqual(state.notifications[1].read, true);
    assert.strictEqual(state.notifications[2].read, true);
  });

  await t.test('getAllSessions returns serialized sessions', () => {
    const state = new StateManager();
    state.getOrCreateSession('test-id-1');
    // Simulate a small delay so updated at is strictly later for sort
    const session2 = state.getOrCreateSession('test-id-2');
    session2.updatedAt = new Date(Date.now() + 1000).toISOString();

    const sessions = state.getAllSessions();
    assert.strictEqual(sessions.length, 2);
    assert.strictEqual(sessions[0].id, 'test-id-2'); // Sorted by updated at, so 2 should be first
    assert.strictEqual(sessions[0].events, undefined);
  });

  await t.test('getStatus returns correct status', () => {
    const state = new StateManager();
    state.getOrCreateSession('test-id-1');
    const status = state.getStatus();
    assert.strictEqual(status.totalSessions, 1);
    assert.strictEqual(status.activeSessions, 0); // idle session
    assert.strictEqual(status.connectedClients, 0);
    assert.strictEqual(status.paired, false);
  });
});
