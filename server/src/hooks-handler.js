/**
 * OrdinaryMatter — Hook Event Handler
 * 
 * Express router that receives hook event payloads from the bridge script
 * and processes them through the state manager.
 */

const express = require('express');

function createHooksRouter(stateManager) {
  const router = express.Router();

  /**
   * POST /api/hook-event
   * 
   * Receives enriched hook payloads from the hook-bridge.js script.
   * Updates session state and broadcasts to connected clients.
   */
  router.post('/hook-event', (req, res) => {
    try {
      const event = req.body;

      if (!event || !event.eventType) {
        return res.status(400).json({ error: 'Missing eventType' });
      }

      const session = stateManager.processHookEvent(event);

      res.json({
        ok: true,
        sessionId: session.id,
        status: session.status,
      });
    } catch (err) {
      console.error('[hooks-handler] Error processing hook event:', err.message);
      res.status(500).json({ error: 'Internal error processing hook event' });
    }
  });

  return router;
}

module.exports = { createHooksRouter };
