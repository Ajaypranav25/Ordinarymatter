const assert = require('assert');
const test = require('node:test');
const { RemotePromptHandler } = require('../remote-prompt');

test('RemotePromptHandler: buildPythonScript escapes correctly', () => {
  const handler = new RemotePromptHandler({});
  const script = handler.buildPythonScript('Hello "world" \\ \n new line', '/workspace');

  assert.ok(script.includes('Hello \\"world\\" \\\\ \\n new line'));
  assert.ok(script.includes('from google.antigravity import Agent'));
});

test('RemotePromptHandler: handles empty prompt gracefully', async () => {
  const handler = new RemotePromptHandler({});
  let sentMessage = null;
  const dummyWs = {
    send: (msg) => { sentMessage = JSON.parse(msg); }
  };

  await handler.handlePrompt(dummyWs, { prompt: '   ' });
  assert.strictEqual(sentMessage.type, 'PROMPT_ERROR');
  assert.strictEqual(sentMessage.error, 'Empty prompt');
});
