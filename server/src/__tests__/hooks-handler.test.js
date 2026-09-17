const assert = require('node:assert');
const test = require('node:test');
const { createHooksRouter } = require('../hooks-handler');
const express = require('express');
const request = require('supertest');

test('hooks-handler module tests', async (t) => {
    let mockState = {
        processHookEvent: (event) => {
            return {
                id: event.conversationId || 'test-id',
                status: 'working'
            };
        }
    };
    const router = createHooksRouter(mockState);
    const app = express();
    app.use(express.json());
    app.use('/api', router);

    await t.test('POST /api/hook-event missing eventType', async () => {
        const res = await request(app)
            .post('/api/hook-event')
            .send({});
        assert.equal(res.status, 400);
        assert.equal(res.body.error, 'Missing eventType');
    });

    await t.test('POST /api/hook-event success', async () => {
        const res = await request(app)
            .post('/api/hook-event')
            .send({ eventType: 'test' });
        assert.equal(res.status, 200);
        assert.equal(res.body.ok, true);
        assert.equal(res.body.status, 'working');
    });
});
