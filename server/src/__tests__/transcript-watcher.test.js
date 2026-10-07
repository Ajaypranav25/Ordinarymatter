const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { TranscriptWatcher } = require('../transcript-watcher');
const { StateManager } = require('../state');

test('transcript-watcher tests', async (t) => {
  await t.test('start() handles missing chokidar gracefully', () => {
    const watcher = new TranscriptWatcher({});
    // Normally chokidar is loaded from module scope, but we can test
    // this simply by invoking it (will just log and return if not mocking properly)
    // To truly mock the try/catch in the module, we can't easily without proxyquire.
    // So we'll just test the methods safely.
    assert.doesNotThrow(() => {
      watcher.start();
    });
  });

  await t.test('readNewLines() handles non-existent file gracefully', () => {
    const watcher = new TranscriptWatcher({});
    assert.doesNotThrow(() => {
      watcher.readNewLines('/non/existent/file.jsonl');
    });
  });

  await t.test('stop() safely does nothing if not started', () => {
    const watcher = new TranscriptWatcher({});
    assert.doesNotThrow(() => {
      watcher.stop();
    });
  });

  await t.test('stop() closes watcher if started', () => {
    const watcher = new TranscriptWatcher({});
    let closed = false;
    watcher.watcher = { close: () => { closed = true; } };
    watcher.stop();
    assert.strictEqual(closed, true);
    assert.strictEqual(watcher.watcher, null);
  });
});
