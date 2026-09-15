const { test, describe } = require('node:test');
const assert = require('node:assert');
const { AuthManager } = require('../auth');

describe('AuthManager', () => {
  test('should generate a 6-digit pairing code', () => {
    const auth = new AuthManager({ pairedDevice: null });
    const code = auth.getPairingInfo().code;
    assert.strictEqual(code.length, 6);
    assert.ok(/^\d{6}$/.test(code));
  });

  test('should fail to pair with invalid code', () => {
    const auth = new AuthManager({ pairedDevice: null });
    const result = auth.pair('000000', {});
    assert.strictEqual(result, null);
  });

  test('should successfully pair with valid code', () => {
    const state = { pairedDevice: null };
    const auth = new AuthManager(state);
    const code = auth.getPairingInfo().code;

    const result = auth.pair(code, { deviceName: 'Test Device' });
    assert.ok(result);
    assert.ok(result.token);
    assert.strictEqual(result.device.name, 'Test Device');
    assert.strictEqual(state.pairedDevice.name, 'Test Device');
  });
});
