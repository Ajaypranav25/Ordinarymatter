const assert = require('assert');
const test = require('node:test');
const { createHooksRouter } = require('../hooks-handler');

test('createHooksRouter: returns express router', () => {
  const router = createHooksRouter({});
  assert.strictEqual(typeof router, 'function');
  assert.ok(router.stack);
});
