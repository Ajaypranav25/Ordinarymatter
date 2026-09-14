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
});
