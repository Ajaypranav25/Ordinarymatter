const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const express = require('express');
const { createHooksRouter } = require('../hooks-handler');
const { StateManager } = require('../state');

test('Hooks Router API', async (t) => {
  const state = new StateManager();
  const app = express();
  app.use(express.json());
  app.use('/api', createHooksRouter(state));

  await t.test('POST /api/hook-event handles event', async () => {
    const res = await request(app)
      .post('/api/hook-event')
      .send({
        eventType: 'pre-invocation',
        timestamp: new Date().toISOString(),
        conversationId: 'test-123'
      });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);

    // Verify state was updated
    const session = state.getSessionDetail('test-123');
    assert.ok(session);
  });

  await t.test('POST /api/hook-event returns 400 on missing eventType', async () => {
    const res = await request(app)
      .post('/api/hook-event')
      .send({
        conversationId: 'test-123'
      });
    assert.strictEqual(res.status, 400);
  });
});
