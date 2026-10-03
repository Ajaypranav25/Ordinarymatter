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

  await t.test('pair() returns null if pairing code is expired', () => {
    const state = {};
    const auth = new AuthManager(state);
    const code = auth.currentPairingCode;

    // Manually expire the code
    auth.pairingCodeExpiresAt = Date.now() - 1000;

    const result = auth.pair(code);
    assert.strictEqual(result, null);
  });

  await t.test('middleware() passes open paths without token', () => {
    const state = {};
    const auth = new AuthManager(state);
    const middleware = auth.middleware();

    let nextCalled = false;
    const req = { path: '/pair' };
    const res = {};
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    assert.strictEqual(nextCalled, true);
  });

  await t.test('middleware() rejects missing token on protected paths', () => {
    const state = {};
    const auth = new AuthManager(state);
    const middleware = auth.middleware();

    const req = { path: '/api/protected', headers: {}, query: {} };
    let statusCalled = null;
    let jsonCalled = null;
    const res = {
      status: (code) => {
        statusCalled = code;
        return {
          json: (data) => { jsonCalled = data; }
        };
      }
    };
    const next = () => { assert.fail('next() should not be called'); };

    middleware(req, res, next);
    assert.strictEqual(statusCalled, 401);
    assert.strictEqual(jsonCalled.error, 'Unauthorized. Pair your device first.');
  });

  await t.test('middleware() accepts valid token on protected paths', () => {
    const state = {};
    const auth = new AuthManager(state);
    const code = auth.currentPairingCode;
    const { token } = auth.pair(code);

    const middleware = auth.middleware();
    const req = { path: '/api/protected', headers: { authorization: `Bearer ${token}` }, query: {} };
    const res = {};
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    assert.strictEqual(nextCalled, true);
    assert.ok(req.device);
  });

  await t.test('verifyWebSocket() handles missing or invalid token', () => {
    const state = {};
    const auth = new AuthManager(state);
    assert.strictEqual(auth.verifyWebSocket('ws://localhost/'), null);
    assert.strictEqual(auth.verifyWebSocket('ws://localhost/?token=invalid'), null);
  });

  await t.test('verifyWebSocket() accepts valid token', () => {
    const state = {};
    const auth = new AuthManager(state);
    const code = auth.currentPairingCode;
    const { token } = auth.pair(code);

    const decoded = auth.verifyWebSocket(`ws://localhost/?token=${token}`);
    assert.ok(decoded);
    assert.ok(decoded.deviceId);
  });
});
