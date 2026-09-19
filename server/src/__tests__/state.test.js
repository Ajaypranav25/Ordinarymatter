const test = require('node:test');
const assert = require('node:assert/strict');
const { StateManager, SessionStatus } = require('../state');

test('StateManager', async (t) => {
  await t.test('initializes correctly', () => {
    const state = new StateManager();
    assert.ok(state.sessions instanceof Map);
    assert.deepEqual(state.notifications, []);
    assert.equal(state.pairedDevice, null);
  });

  await t.test('getOrCreateSession creates a new session', () => {
    const state = new StateManager();
    const session = state.getOrCreateSession('test-id');

    assert.equal(session.id, 'test-id');
    assert.equal(session.status, SessionStatus.IDLE);
    assert.equal(state.sessions.get('test-id'), session);
  });

  await t.test('getOrCreateSession generates an ID if missing', () => {
    const state = new StateManager();
    const session = state.getOrCreateSession();

    assert.ok(session.id.startsWith('unknown-'));
    assert.equal(session.status, SessionStatus.IDLE);
  });

  await t.test('processHookEvent updates session state for pre-invocation', () => {
    const state = new StateManager();
    const event = {
      conversationId: 'test-id',
      eventType: 'pre-invocation',
      workspacePaths: ['/path/to/project'],
      modelName: 'gpt-4',
    };

    const session = state.processHookEvent(event);

    assert.equal(session.status, SessionStatus.WORKING);
    assert.equal(session.project, 'project');
    assert.equal(session.modelName, 'gpt-4');
    assert.equal(session.invocationCount, 1);
    assert.equal(session.events.length, 1);
  });

  await t.test('processHookEvent updates session state for pre-tool-use', () => {
    const state = new StateManager();
    const event = {
      conversationId: 'test-id',
      eventType: 'pre-tool-use',
      toolName: 'readFile',
    };

    const session = state.processHookEvent(event);

    assert.equal(session.status, SessionStatus.WORKING);
    assert.equal(session.currentTask, 'Running: readFile');
    assert.equal(session.events.length, 1);
  });

  await t.test('processHookEvent updates session state for post-tool-use with error', () => {
    const state = new StateManager();
    const event = {
      conversationId: 'test-id',
      eventType: 'post-tool-use',
      hookPayload: { error: 'file not found' },
    };

    const session = state.processHookEvent(event);

    assert.equal(session.status, SessionStatus.ERROR);
    assert.equal(session.errorCount, 1);
    assert.equal(session.toolCallCount, 1);
    assert.equal(state.notifications.length, 1);
    assert.equal(state.notifications[0].type, 'error');
  });

  await t.test('processHookEvent updates session state for stop', () => {
    const state = new StateManager();
    const event = {
      conversationId: 'test-id',
      eventType: 'stop',
      terminationReason: 'finished',
    };

    const session = state.processHookEvent(event);

    assert.equal(session.status, SessionStatus.COMPLETED);
    assert.equal(session.currentTask, null);
    assert.equal(state.notifications.length, 1);
    assert.equal(state.notifications[0].type, 'task_completed');
  });

  await t.test('addNotification adds and trims notifications', () => {
    const state = new StateManager();

    for (let i = 0; i < 110; i++) {
      state.addNotification('info', `Message ${i}`);
    }

    assert.equal(state.notifications.length, 100);
    assert.equal(state.notifications[0].message, 'Message 109');
  });

  await t.test('markNotificationsRead marks specified or all notifications', () => {
    const state = new StateManager();
    const notif1 = state.addNotification('info', 'Msg 1');
    const notif2 = state.addNotification('info', 'Msg 2');

    state.markNotificationsRead([notif1.id]);

    assert.equal(notif1.read, true);
    assert.equal(notif2.read, false);

    state.markNotificationsRead();

    assert.equal(notif2.read, true);
  });

  await t.test('getAllSessions returns serialized sessions', () => {
    const state = new StateManager();
    state.getOrCreateSession('id1');
    state.getOrCreateSession('id2');

    const sessions = state.getAllSessions();

    assert.equal(sessions.length, 2);
    // Should not include 'events' array in serialized form
    assert.ok(!sessions[0].hasOwnProperty('events'));
  });
});
