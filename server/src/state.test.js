const { describe, it } = require('node:test');
const assert = require('node:assert');
const { StateManager, SessionStatus } = require('./state');

describe('StateManager', () => {
  it('should initialize with correct default state', () => {
    const state = new StateManager();
    assert.strictEqual(state.sessions.size, 0);
    assert.strictEqual(state.notifications.length, 0);
    assert.strictEqual(state.wsClients.size, 0);
    assert.strictEqual(state.pairedDevice, null);
    assert.ok(state.startedAt);
  });

  it('should get or create a session', () => {
    const state = new StateManager();
    const session = state.getOrCreateSession('conv-123');

    assert.strictEqual(session.id, 'conv-123');
    assert.strictEqual(session.status, SessionStatus.IDLE);
    assert.strictEqual(state.sessions.size, 1);

    const sameSession = state.getOrCreateSession('conv-123');
    assert.strictEqual(session, sameSession);
    assert.strictEqual(state.sessions.size, 1);
  });

  it('should process hook event - pre-invocation', () => {
    const state = new StateManager();
    const event = {
      eventType: 'pre-invocation',
      conversationId: 'conv-123',
      workspacePaths: ['/workspace/my-project'],
      modelName: 'gpt-4'
    };

    const session = state.processHookEvent(event);
    assert.strictEqual(session.status, SessionStatus.WORKING);
    assert.strictEqual(session.project, 'my-project');
    assert.strictEqual(session.modelName, 'gpt-4');
    assert.strictEqual(session.invocationCount, 1);
    assert.strictEqual(session.events.length, 1);
  });

  it('should add notification and limit to 100', () => {
    const state = new StateManager();

    for (let i = 0; i < 105; i++) {
      state.addNotification('info', `Message ${i}`);
    }

    assert.strictEqual(state.notifications.length, 100);
    assert.strictEqual(state.notifications[0].message, 'Message 104');
    assert.strictEqual(state.notifications[99].message, 'Message 5');
  });

  it('should get status overview', () => {
    const state = new StateManager();
    state.getOrCreateSession('conv-1');
    const session2 = state.getOrCreateSession('conv-2');
    session2.status = SessionStatus.WORKING;

    const status = state.getStatus();
    assert.strictEqual(status.totalSessions, 2);
    assert.strictEqual(status.activeSessions, 1);
    assert.strictEqual(status.connectedClients, 0);
    assert.strictEqual(status.paired, false);
    assert.strictEqual(status.unreadNotifications, 0);
  });

  it('should mark notifications read', () => {
    const state = new StateManager();
    const notif1 = state.addNotification('info', 'Message 1');
    const notif2 = state.addNotification('info', 'Message 2');

    state.markNotificationsRead([notif1.id]);

    assert.strictEqual(notif1.read, true);
    assert.strictEqual(notif2.read, false);

    state.markNotificationsRead(); // Mark all read
    assert.strictEqual(notif2.read, true);
  });
});
