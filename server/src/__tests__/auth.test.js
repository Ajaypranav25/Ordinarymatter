const test = require('node:test');
const assert = require('node:assert');
const { AuthManager } = require('../auth');
const jwt = require('jsonwebtoken');

test('auth module tests', async (t) => {
  await t.test('generatePairingCode creates a 6-digit string', () => {
    const state = {};
    const auth = new AuthManager(state);
    const code = auth.generatePairingCode();
    assert.strictEqual(typeof code, 'string');
    assert.strictEqual(code.length, 6);
    assert.match(code, /^\d{6}$/);
  });

  await t.test('pair() returns a token on success', () => {
    const state = {};
    const auth = new AuthManager(state);
    const code = auth.currentPairingCode;
    const result = auth.pair(code);
    assert.ok(result);
    assert.ok(result.token);
    assert.ok(state.pairedDevice);
  });

  await t.test('pair() returns null on invalid code', () => {
    const state = {};
    const auth = new AuthManager(state);
    const result = auth.pair('invalid');
    assert.strictEqual(result, null);
  });

  await t.test('verifyToken() returns decoded payload on success', () => {
    const state = {};
    const auth = new AuthManager(state);
    const code = auth.currentPairingCode;
    const result = auth.pair(code);
    const decoded = auth.verifyToken(result.token);
    assert.ok(decoded);
    assert.ok(decoded.deviceId);
  });

  await t.test('verifyToken() returns null on invalid token', () => {
    const state = {};
    const auth = new AuthManager(state);
    const result = auth.verifyToken('invalid-token');
    assert.strictEqual(result, null);
  });

  await t.test('unpair() resets pairedDevice', () => {
    const state = {};
    const auth = new AuthManager(state);
    auth.pair(auth.currentPairingCode);
    assert.ok(state.pairedDevice);
    auth.unpair();
    assert.strictEqual(state.pairedDevice, null);
  });
});
