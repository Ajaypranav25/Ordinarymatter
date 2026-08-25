/**
 * OrdinaryMatter — Cloudflare Tunnel Manager
 * 
 * Manages a Cloudflare Tunnel to expose the local relay server
 * to the internet for mobile access.
 */

const { spawn, execSync } = require('child_process');

class TunnelManager {
  constructor(port) {
    this.port = port;
    this.process = null;
    this.publicUrl = null;
  }

  /**
   * Check if cloudflared is installed.
   */
  isCloudflaredInstalled() {
    try {
      execSync('cloudflared --version', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Start a Cloudflare Tunnel.
   * Returns the public URL when ready.
   */
  startTunnel() {
    return new Promise((resolve, reject) => {
      if (!this.isCloudflaredInstalled()) {
        console.log('\n⚠️  cloudflared is not installed.');
        console.log('   Install it from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/');
        console.log('   Or via: winget install Cloudflare.cloudflared');
        console.log('\n   The server is still running on localhost — you can use it on your local network.\n');
        resolve(null);
        return;
      }

      console.log(`\n🚇 Starting Cloudflare Tunnel for localhost:${this.port}...`);

      this.process = spawn('cloudflared', [
        'tunnel',
        '--url', `http://localhost:${this.port}`,
        '--no-autoupdate',
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let started = false;

      // cloudflared outputs the URL on stderr
      this.process.stderr.on('data', (data) => {
        const output = data.toString();

        // Look for the tunnel URL
        const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
        if (urlMatch && !started) {
          started = true;
          this.publicUrl = urlMatch[0];
          console.log(`\n🌐 Tunnel URL: ${this.publicUrl}`);
          console.log(`   Use this URL in the OrdinaryMatter mobile app to connect.\n`);
          resolve(this.publicUrl);
        }
      });

      this.process.on('error', (err) => {
        console.error(`[tunnel] Error: ${err.message}`);
        if (!started) resolve(null);
      });

      this.process.on('close', (code) => {
        console.log(`[tunnel] Cloudflare Tunnel exited with code ${code}`);
        this.publicUrl = null;
        if (!started) resolve(null);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!started) {
          console.log('[tunnel] Timeout waiting for tunnel URL');
          resolve(null);
        }
      }, 30000);
    });
  }

  /**
   * Stop the tunnel.
   */
  stop() {
    if (this.process) {
      this.process.kill();
      this.process = null;
      this.publicUrl = null;
    }
  }

  /**
   * Get the current public URL.
   */
  getUrl() {
    return this.publicUrl;
  }
}

// Allow running standalone: node tunnel.js
async function startTunnel() {
  const port = process.env.PORT || 7777;
  const tunnel = new TunnelManager(port);
  const url = await tunnel.startTunnel();
  if (url) {
    console.log(`Tunnel running at: ${url}`);
    // Keep process alive
    process.on('SIGINT', () => {
      tunnel.stop();
      process.exit(0);
    });
  }
}

module.exports = { TunnelManager, startTunnel };
