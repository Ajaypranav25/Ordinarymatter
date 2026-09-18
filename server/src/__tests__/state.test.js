const assert = require('node:assert');
const test = require('node:test');
const { StateManager, SessionStatus } = require('../state.js');

test('StateManager', async (t) => {
  await t.test('initializes correctly', () => {
    const stateManager = new StateManager();
    assert.strictEqual(stateManager.sessions.size, 0);
    assert.strictEqual(stateManager.notifications.length, 0);
    assert.strictEqual(stateManager.wsClients.size, 0);
    assert.strictEqual(stateManager.pairedDevice, null);
  });

  await t.test('creates session if it does not exist', () => {
    const stateManager = new StateManager();
    const conversationId = 'test-conv-1';
    const session = stateManager.getOrCreateSession(conversationId);

    assert.strictEqual(session.id, conversationId);
    assert.strictEqual(session.status, SessionStatus.IDLE);
    assert.strictEqual(stateManager.sessions.size, 1);
  });

  await t.test('processes hook event and updates session', () => {
    const stateManager = new StateManager();
    const conversationId = 'test-conv-2';

    stateManager.processHookEvent({
      conversationId,
      eventType: 'pre-invocation',
      invocationNum: 1,
    });

    const session = stateManager.getOrCreateSession(conversationId);
    assert.strictEqual(session.status, SessionStatus.WORKING);
    assert.strictEqual(session.invocationCount, 1);
    assert.strictEqual(session.events.length, 1);
    assert.strictEqual(session.events[0].type, 'pre-invocation');
  });

  await t.test('process stop event without error completes session', () => {
    const stateManager = new StateManager();
    const conversationId = 'test-conv-3';

    stateManager.processHookEvent({
      conversationId,
      eventType: 'stop',
      terminationReason: 'success'
    });

    const session = stateManager.getOrCreateSession(conversationId);
    assert.strictEqual(session.status, SessionStatus.COMPLETED);
    assert.strictEqual(session.events.length, 1);
    assert.strictEqual(session.events[0].type, 'stop');

    assert.strictEqual(stateManager.notifications.length, 1);
    assert.strictEqual(stateManager.notifications[0].type, 'task_completed');
  });

  await t.test('process stop event with error errors session', () => {
    const stateManager = new StateManager();
    const conversationId = 'test-conv-4';

    stateManager.processHookEvent({
      conversationId,
      eventType: 'stop',
      error: 'Something went wrong',
      terminationReason: 'error'
    });

    const session = stateManager.getOrCreateSession(conversationId);
    assert.strictEqual(session.status, SessionStatus.ERROR);

    assert.strictEqual(stateManager.notifications.length, 1);
    assert.strictEqual(stateManager.notifications[0].type, 'task_failed');
  });

});
