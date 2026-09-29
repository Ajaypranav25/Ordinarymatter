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
});
