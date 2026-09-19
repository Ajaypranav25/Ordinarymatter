const { describe, it } = require('node:test');
const assert = require('node:assert');
const { AuthManager } = require('./auth');

describe('AuthManager', () => {
  it('should generate a 6-digit pairing code', () => {
    const mockState = {};
    const auth = new AuthManager(mockState);
    const code = auth.currentPairingCode;
    assert.strictEqual(typeof code, 'string');
    assert.strictEqual(code.length, 6);
    assert.ok(/^\d{6}$/.test(code));
  });

  it('should pair successfully with valid code', () => {
    const mockState = {};
    const auth = new AuthManager(mockState);
    const code = auth.currentPairingCode;

    const result = auth.pair(code, { deviceName: 'Test Device' });
    assert.ok(result);
    assert.ok(result.token);
    assert.strictEqual(result.device.name, 'Test Device');
    assert.strictEqual(mockState.pairedDevice.name, 'Test Device');
  });

  it('should not pair with invalid code', () => {
    const mockState = {};
    const auth = new AuthManager(mockState);

    const result = auth.pair('000000', { deviceName: 'Test Device' });
    assert.strictEqual(result, null);
  });

  it('should unpair successfully', () => {
    const mockState = {};
    const auth = new AuthManager(mockState);
    const code = auth.currentPairingCode;
    auth.pair(code, { deviceName: 'Test Device' });

    assert.ok(mockState.pairedDevice);
    auth.unpair();
    assert.strictEqual(mockState.pairedDevice, null);
  });

  it('should verify token successfully', () => {
    const mockState = {};
    const auth = new AuthManager(mockState);
    const code = auth.currentPairingCode;
    const result = auth.pair(code, { deviceName: 'Test Device' });

    const decoded = auth.verifyToken(result.token);
    assert.ok(decoded);
    assert.strictEqual(decoded.deviceName, 'Test Device');
  });

  it('should return null for invalid token verification', () => {
    const mockState = {};
    const auth = new AuthManager(mockState);
    const decoded = auth.verifyToken('invalid-token');
    assert.strictEqual(decoded, null);
  });
});
