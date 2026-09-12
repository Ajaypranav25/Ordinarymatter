const test = require('node:test');
const assert = require('node:assert');
const { EventEmitter } = require('events');

const child_process = require('child_process');
const originalSpawn = child_process.spawn;

const { RemotePromptHandler } = require('../remote-prompt.js');

test('RemotePromptHandler handles empty prompt', async () => {
  const handler = new RemotePromptHandler({});

  const messages = [];
  const mockWs = {
    send: (msg) => messages.push(JSON.parse(msg))
  };

  await handler.handlePrompt(mockWs, { prompt: '' });

  assert.strictEqual(messages.length, 1);
  assert.strictEqual(messages[0].type, 'PROMPT_ERROR');
  assert.strictEqual(messages[0].error, 'Empty prompt');
});

test('RemotePromptHandler handles successful execution', async (t) => {
  let spawnArgs = null;
  child_process.spawn = (cmd, args, options) => {
    spawnArgs = { cmd, args, options };
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    // mock killed so setTimeout clear process doesn't fail
    proc.killed = false;
    proc.kill = () => { proc.killed = true; };

    setTimeout(() => {
      proc.stdout.emit('data', 'hello');
      proc.stdout.emit('data', ' world');
      proc.emit('close', 0);
    }, 10);

    return proc;
  };

  t.after(() => {
    child_process.spawn = originalSpawn;
  });

  const notifications = [];
  const mockState = {
    addNotification: (type, msg, data) => notifications.push({ type, msg, data })
  };

  const handler = new RemotePromptHandler(mockState);

  const messages = [];
  const mockWs = {
    send: (msg) => messages.push(JSON.parse(msg))
  };

  await handler.handlePrompt(mockWs, { prompt: 'test prompt' });

  await new Promise(resolve => setTimeout(resolve, 50));

  assert.ok(spawnArgs);
  assert.strictEqual(spawnArgs.cmd, 'python');

  assert.strictEqual(messages[0].type, 'PROMPT_STARTED');
  assert.strictEqual(messages[1].type, 'PROMPT_TOKEN');
  assert.strictEqual(messages[1].token, 'hello');
  assert.strictEqual(messages[2].type, 'PROMPT_TOKEN');
  assert.strictEqual(messages[2].token, ' world');
  assert.strictEqual(messages[3].type, 'PROMPT_COMPLETED');
  assert.strictEqual(messages[3].response, 'hello world');

  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].type, 'task_completed');
});

test('RemotePromptHandler handles process error', async (t) => {
  child_process.spawn = (cmd, args, options) => {
    const proc = new EventEmitter();
    proc.stdout = new EventEmitter();
    proc.stderr = new EventEmitter();
    proc.killed = false;
    proc.kill = () => { proc.killed = true; };

    setTimeout(() => {
      proc.stderr.emit('data', 'python error');
      proc.emit('close', 1);
    }, 10);

    return proc;
  };

  t.after(() => {
    child_process.spawn = originalSpawn;
  });

  const notifications = [];
  const mockState = {
    addNotification: (type, msg, data) => notifications.push({ type, msg, data })
  };

  const handler = new RemotePromptHandler(mockState);

  const messages = [];
  const mockWs = {
    send: (msg) => messages.push(JSON.parse(msg))
  };

  await handler.handlePrompt(mockWs, { prompt: 'test error' });

  await new Promise(resolve => setTimeout(resolve, 50));

  assert.strictEqual(messages[0].type, 'PROMPT_STARTED');
  assert.strictEqual(messages[1].type, 'PROMPT_ERROR');
  assert.strictEqual(messages[1].error, 'python error');

  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].type, 'task_failed');
});

test('RemotePromptHandler buildPythonScript escapes correctly', () => {
  const handler = new RemotePromptHandler({});
  const script = handler.buildPythonScript('hello "world"\nnew line\\slash', '/test');

  assert.ok(script.includes('hello \\"world\\"\\nnew line\\\\slash'));
  assert.ok(script.includes('from google.antigravity import Agent'));
});
