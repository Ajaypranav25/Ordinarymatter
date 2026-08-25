/**
 * Plugin installer script.
 * Copies the plugin directory to the global Antigravity plugins folder.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const SOURCE = path.join(__dirname, '..', 'plugin');
const DEST = path.join(os.homedir(), '.gemini', 'config', 'plugins', 'ordinarymatter');

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log(`📦 Installing OrdinaryMatter plugin...`);
console.log(`   Source: ${SOURCE}`);
console.log(`   Destination: ${DEST}`);

try {
  copyRecursive(SOURCE, DEST);
  console.log(`✅ Plugin installed successfully!`);
  console.log(`   Restart Antigravity to activate the plugin.`);
} catch (err) {
  console.error(`❌ Failed to install plugin: ${err.message}`);
  process.exit(1);
}
