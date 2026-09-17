const assert = require('node:assert');
const test = require('node:test');
const { AuthManager } = require('../auth');

test('auth module tests', async (t) => {
    let mockState = {};
    let authManager = new AuthManager(mockState);

    await t.test('generatePairingCode generates a 6 digit code', () => {
        const code = authManager.generatePairingCode();
        assert.ok(/^[0-9]{6}$/.test(code));
    });
});
