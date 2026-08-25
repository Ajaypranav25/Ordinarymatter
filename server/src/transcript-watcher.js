/**
 * OrdinaryMatter — Transcript Watcher
 * 
 * Uses chokidar to watch Antigravity conversation transcript files (JSONL).
 * Tails new lines as they're appended, parses them, and feeds them
 * to the state manager for rich session history.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

let chokidar;
try {
  chokidar = require('chokidar');
} catch {
  chokidar = null;
}

// Known transcript directories for different Antigravity surfaces
const TRANSCRIPT_DIRS = [
  path.join(os.homedir(), '.gemini', 'antigravity-ide', 'brain'),
  path.join(os.homedir(), '.gemini', 'antigravity', 'brain'),
  path.join(os.homedir(), '.gemini', 'antigravity-cli', 'brain'),
];

class TranscriptWatcher {
  constructor(stateManager) {
    this.state = stateManager;
    this.watcher = null;
    // Track file read positions so we only read new lines
    this.filePositions = new Map();
  }

  /**
   * Start watching for transcript file changes.
   */
  start() {
    if (!chokidar) {
      console.log('[transcript-watcher] chokidar not available, transcript watching disabled');
      return;
    }

    // Find existing transcript directories
    const existingDirs = TRANSCRIPT_DIRS.filter(dir => {
      try {
        return fs.existsSync(dir);
      } catch {
        return false;
      }
    });

    if (existingDirs.length === 0) {
      console.log('[transcript-watcher] No transcript directories found, watching disabled');
      return;
    }

    // Watch for transcript.jsonl files
    const globs = existingDirs.map(dir =>
      path.join(dir, '**', '.system_generated', 'logs', 'transcript.jsonl')
    );

    console.log(`[transcript-watcher] Watching ${existingDirs.length} transcript directories`);

    this.watcher = chokidar.watch(globs, {
      persistent: true,
      ignoreInitial: true, // Don't process existing content on startup
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    this.watcher.on('change', (filePath) => {
      this.readNewLines(filePath);
    });

    this.watcher.on('add', (filePath) => {
      // New transcript file — record its current size so we only read new lines
      try {
        const stats = fs.statSync(filePath);
        this.filePositions.set(filePath, stats.size);
      } catch {
        this.filePositions.set(filePath, 0);
      }
    });

    this.watcher.on('error', (err) => {
      console.error('[transcript-watcher] Error:', err.message);
    });
  }

  /**
   * Read new lines appended to a transcript file.
   */
  readNewLines(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const currentSize = stats.size;
      const lastPosition = this.filePositions.get(filePath) || 0;

      if (currentSize <= lastPosition) return;

      // Read only the new bytes
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(currentSize - lastPosition);
      fs.readSync(fd, buffer, 0, buffer.length, lastPosition);
      fs.closeSync(fd);

      this.filePositions.set(filePath, currentSize);

      // Parse new lines
      const newContent = buffer.toString('utf8');
      const lines = newContent.split('\n').filter(line => line.trim());

      // Extract conversation ID from file path
      // Pattern: .../brain/<conversation-id>/.system_generated/logs/transcript.jsonl
      const pathParts = filePath.split(path.sep);
      const sysGenIdx = pathParts.indexOf('.system_generated');
      const conversationId = sysGenIdx > 0 ? pathParts[sysGenIdx - 1] : null;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (conversationId) {
            this.state.addTranscriptEntry(conversationId, entry);
          }
        } catch {
          // Skip malformed lines
        }
      }
    } catch (err) {
      // File may have been deleted or locked
      console.error('[transcript-watcher] Error reading file:', err.message);
    }
  }

  /**
   * Stop watching.
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

module.exports = { TranscriptWatcher };
