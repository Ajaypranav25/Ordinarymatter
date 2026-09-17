const assert = require('assert');
const test = require('node:test');
const { TunnelManager } = require('../tunnel');

test('TunnelManager: initialization', () => {
  const tunnel = new TunnelManager(8080);
  assert.strictEqual(tunnel.port, 8080);
  assert.strictEqual(tunnel.process, null);
  assert.strictEqual(tunnel.publicUrl, null);
  assert.strictEqual(tunnel.getUrl(), null);
});
