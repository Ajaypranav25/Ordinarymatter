const { test, describe } = require('node:test');
const assert = require('node:assert');
const { StateManager, SessionStatus } = require('../state');

describe('StateManager', () => {
  test('should create and retrieve a session', () => {
    const state = new StateManager();
    const session = state.getOrCreateSession('conv-123');

    assert.strictEqual(session.id, 'conv-123');
    assert.strictEqual(session.status, SessionStatus.IDLE);
    assert.strictEqual(session.events.length, 0);

    // Retrieving the same session should return the same object
    const session2 = state.getOrCreateSession('conv-123');
    assert.strictEqual(session, session2);
  });

  test('should process hook event and update state', () => {
    const state = new StateManager();
    const event = {
      eventType: 'pre-invocation',
      conversationId: 'conv-456',
      workspacePaths: ['/test/project'],
      modelName: 'test-model'
    };

    const session = state.processHookEvent(event);
    assert.strictEqual(session.status, SessionStatus.WORKING);
    assert.strictEqual(session.project, 'project');
    assert.strictEqual(session.modelName, 'test-model');
    assert.strictEqual(session.events.length, 1);
  });

  test('should add notifications and mark them as read', () => {
    const state = new StateManager();
    const notif = state.addNotification('info', 'Test notification');

    assert.strictEqual(state.notifications.length, 1);
    assert.strictEqual(notif.read, false);

    state.markNotificationsRead([notif.id]);
    assert.strictEqual(state.notifications[0].read, true);
  });
});
