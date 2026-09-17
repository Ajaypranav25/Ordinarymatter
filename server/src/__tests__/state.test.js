const assert = require('assert');
const test = require('node:test');
const { StateManager, SessionStatus } = require('../state');

test('StateManager: getOrCreateSession', () => {
  const state = new StateManager();
  const session1 = state.getOrCreateSession('conv-1');
  assert.strictEqual(session1.id, 'conv-1');
  assert.strictEqual(session1.status, SessionStatus.IDLE);

  const session2 = state.getOrCreateSession('conv-1');
  assert.strictEqual(session1, session2);
});

test('StateManager: processHookEvent updates status', () => {
  const state = new StateManager();
  const session = state.processHookEvent({
    conversationId: 'conv-1',
    eventType: 'pre-invocation'
  });
  assert.strictEqual(session.status, SessionStatus.WORKING);
  assert.strictEqual(session.invocationCount, 1);
});
