const test = require('node:test');
const assert = require('node:assert');
const { AuthManager } = require('../auth.js');

test('AuthManager generates and validates a pairing code', () => {
  const mockState = { pairedDevice: null };
  const auth = new AuthManager(mockState);

  const code = auth.currentPairingCode;
  assert.ok(code);
  assert.strictEqual(code.length, 6);

  const pairResult = auth.pair(code, { deviceName: 'Test Device' });
  assert.ok(pairResult);
  assert.ok(pairResult.token);
  assert.strictEqual(pairResult.device.name, 'Test Device');
});

test('AuthManager rejects invalid pairing code', () => {
  const mockState = { pairedDevice: null };
  const auth = new AuthManager(mockState);

  const pairResult = auth.pair('111111', { deviceName: 'Test Device' });
  assert.strictEqual(pairResult, null);
});
