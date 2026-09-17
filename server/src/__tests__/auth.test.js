const assert = require('assert');
const test = require('node:test');
const { AuthManager } = require('../auth');

test('AuthManager: generatePairingCode creates valid 6-digit code', () => {
  const state = {};
  const auth = new AuthManager(state);
  const code = auth.getPairingInfo().code;
  assert.strictEqual(typeof code, 'string');
  assert.strictEqual(code.length, 6);
});

test('AuthManager: pair succeeds with valid code', () => {
  const state = {};
  const auth = new AuthManager(state);
  const code = auth.getPairingInfo().code;

  const result = auth.pair(code, { deviceName: 'Test Device' });
  assert.ok(result);
  assert.ok(result.token);
  assert.strictEqual(result.device.name, 'Test Device');
});

test('AuthManager: pair fails with invalid code', () => {
  const state = {};
  const auth = new AuthManager(state);
  const code = auth.getPairingInfo().code;

  const invalidCode = code === '123456' ? '654321' : '123456';
  const result = auth.pair(invalidCode, {});
  assert.strictEqual(result, null);
});

test('AuthManager: verifyToken succeeds with valid token', () => {
  const state = {};
  const auth = new AuthManager(state);
  const code = auth.getPairingInfo().code;

  const { token } = auth.pair(code, { deviceName: 'Test Device' });
  const decoded = auth.verifyToken(token);
  assert.ok(decoded);
  assert.strictEqual(decoded.deviceName, 'Test Device');
});
