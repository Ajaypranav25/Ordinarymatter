const test = require('node:test');
const assert = require('node:assert');
const proxyquire = require('proxyquire');

test('RemotePromptHandler module tests', async (t) => {
  const { RemotePromptHandler } = require('../remote-prompt');

  await t.test('buildPythonScript creates valid script', () => {
    const handler = new RemotePromptHandler({});
    const script = handler.buildPythonScript('hello world', undefined);
    assert.match(script, /await agent\.chat\("hello world"\)/);
  });

  await t.test('handlePrompt sends PROMPT_ERROR if prompt is empty', async () => {
    const handler = new RemotePromptHandler({});
    let sentMessage = null;
    const ws = {
      send: (msg) => {
        sentMessage = JSON.parse(msg);
      }
    };

    await handler.handlePrompt(ws, { prompt: '   ' });
    assert.strictEqual(sentMessage.type, 'PROMPT_ERROR');
    assert.strictEqual(sentMessage.error, 'Empty prompt');
  });

  await t.test('buildPythonScript properly escapes quotes and newlines', () => {
    const handler = new RemotePromptHandler({});
    const script = handler.buildPythonScript('hello "world"\nnew line', undefined);
    assert.match(script, /await agent\.chat\("hello \\"world\\"\\nnew line"\)/);
  });

  await t.test('handlePrompt handles spawn failure', async () => {
    const { RemotePromptHandler } = proxyquire('../remote-prompt', {
      'child_process': {
        spawn: () => {
          throw new Error('Spawn simulated failure');
        }
      }
    });

    const handler = new RemotePromptHandler({});
    let sentMessage = null;
    const ws = {
      send: (msg) => {
        sentMessage = JSON.parse(msg);
      }
    };

    await handler.handlePrompt(ws, { prompt: 'hello' });
    assert.strictEqual(sentMessage.type, 'PROMPT_ERROR');
    assert.strictEqual(sentMessage.error, 'Spawn simulated failure');
  });
});
