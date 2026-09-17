const assert = require('node:assert');
const test = require('node:test');
const { StateManager, SessionStatus } = require('../state');

test('state manager tests', async (t) => {
    let stateManager = new StateManager();

    await t.test('initial state', () => {
        const status = stateManager.getStatus();
        assert.equal(status.totalSessions, 0);
    });

    await t.test('processHookEvent creates session', () => {
        stateManager.processHookEvent({
            conversationId: 'test-session',
            eventType: 'pre-invocation'
        });
        const status = stateManager.getStatus();
        assert.equal(status.totalSessions, 1);
        const session = stateManager.getSessionDetail('test-session');
        assert.equal(session.id, 'test-session');
        assert.equal(session.status, SessionStatus.WORKING);
    });
});
