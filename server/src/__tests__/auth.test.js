const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { AuthManager } = require('../auth');

describe('AuthManager', () => {
  let authManager;
  let mockState;

  beforeEach(() => {
    mockState = { pairedDevice: null };
    authManager = new AuthManager(mockState);
  });

  test('generatePairingCode generates a 6-digit string code', () => {
    const code = authManager.generatePairingCode();
    assert.strictEqual(typeof code, 'string');
    assert.strictEqual(code.length, 6);
    assert.ok(/^[0-9]+$/.test(code));
  });

  test('pair returns a token and updates state for a valid code', () => {
    const code = authManager.currentPairingCode;
    const result = authManager.pair(code, { deviceName: 'Test Device' });

    assert.ok(result);
    assert.ok(result.token);
    assert.strictEqual(result.device.name, 'Test Device');
    assert.strictEqual(mockState.pairedDevice, result.device);

    // code should be invalidated
    assert.strictEqual(authManager.currentPairingCode, null);
  });

  test('pair returns null for an invalid code', () => {
    const code = authManager.currentPairingCode;
    const result = authManager.pair('000000', { deviceName: 'Test Device' });

    assert.strictEqual(result, null);
    assert.strictEqual(mockState.pairedDevice, null);
  });

  test('pair returns null for an expired code', () => {
    const code = authManager.currentPairingCode;
    authManager.pairingCodeExpiresAt = Date.now() - 1000; // Expired 1 second ago

    const result = authManager.pair(code, { deviceName: 'Test Device' });

    assert.strictEqual(result, null);
    assert.strictEqual(mockState.pairedDevice, null);
  });

  test('verifyToken returns decoded payload for valid token', () => {
    const code = authManager.currentPairingCode;
    const pairResult = authManager.pair(code, { deviceName: 'Test Device' });

    const decoded = authManager.verifyToken(pairResult.token);

    assert.ok(decoded);
    assert.strictEqual(decoded.deviceName, 'Test Device');
    assert.ok(decoded.deviceId);
  });

  test('verifyToken returns null for invalid token', () => {
    const decoded = authManager.verifyToken('invalid-token');
    assert.strictEqual(decoded, null);
  });
});
