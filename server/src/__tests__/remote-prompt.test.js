const test = require('node:test');
const assert = require('node:assert');
const { RemotePromptHandler } = require('../remote-prompt');

test('RemotePromptHandler module tests', async (t) => {
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
});
