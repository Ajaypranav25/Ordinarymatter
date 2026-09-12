const test = require('node:test');
const assert = require('node:assert');
const { StateManager, SessionStatus } = require('../state.js');

test('StateManager creates and gets a session', () => {
  const manager = new StateManager();
  const session = manager.getOrCreateSession('test-1');

  assert.strictEqual(session.id, 'test-1');
  assert.strictEqual(session.status, SessionStatus.IDLE);

  const fetchedSession = manager.getOrCreateSession('test-1');
  assert.strictEqual(session, fetchedSession);
});

test('StateManager processes hook events correctly', () => {
  const manager = new StateManager();

  manager.processHookEvent({
    conversationId: 'test-2',
    eventType: 'pre-invocation',
    invocationNum: 1
  });

  const session = manager.getOrCreateSession('test-2');
  assert.strictEqual(session.status, SessionStatus.WORKING);
  assert.strictEqual(session.invocationCount, 1);
  assert.strictEqual(session.events.length, 1);
});
