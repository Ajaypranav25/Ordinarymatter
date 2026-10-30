const test = require('node:test');
const assert = require('node:assert');
const proxyquire = require('proxyquire');

test('TunnelManager module tests', async (t) => {
  await t.test('isCloudflaredInstalled returns true if installed', () => {
    const { TunnelManager } = proxyquire('../tunnel', {
      'child_process': {
        execSync: () => Buffer.from('cloudflared version'),
        spawn: () => {}
      }
    });
    const manager = new TunnelManager(8080);
    assert.strictEqual(manager.isCloudflaredInstalled(), true);
  });

  await t.test('isCloudflaredInstalled returns false if not installed', () => {
    const { TunnelManager } = proxyquire('../tunnel', {
      'child_process': {
        execSync: () => { throw new Error('Command failed'); },
        spawn: () => {}
      }
    });
    const manager = new TunnelManager(8080);
    assert.strictEqual(manager.isCloudflaredInstalled(), false);
  });

  await t.test('stop kills the process and resets URL', () => {
    const { TunnelManager } = require('../tunnel');
    const manager = new TunnelManager(8080);
    let killed = false;
    manager.process = { kill: () => { killed = true; } };
    manager.publicUrl = 'https://example.com';
    manager.stop();
    assert.strictEqual(killed, true);
    assert.strictEqual(manager.process, null);
    assert.strictEqual(manager.publicUrl, null);
  });
});
