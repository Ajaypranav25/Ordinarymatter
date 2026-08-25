/**
 * OrdinaryMatter — Relay Server
 * 
 * The central hub that bridges Antigravity sessions to the mobile app.
 * 
 * Components:
 * - Express REST API for hook events, session data, and pairing
 * - WebSocket server for real-time updates to mobile
 * - Transcript watcher for rich session history
 * - Cloudflare Tunnel for remote access
 */

const http = require('http');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const { StateManager } = require('./state');
const { AuthManager } = require('./auth');
const { createHooksRouter } = require('./hooks-handler');
const { TranscriptWatcher } = require('./transcript-watcher');
const { RemotePromptHandler } = require('./remote-prompt');
const { TunnelManager } = require('./tunnel');

const PORT = parseInt(process.env.PORT || '7777', 10);

// ─── Initialize Components ──────────────────────────────────────────

const state = new StateManager();
const auth = new AuthManager(state);
const transcriptWatcher = new TranscriptWatcher(state);
const remotePrompt = new RemotePromptHandler(state);
const tunnel = new TunnelManager(PORT);

// ─── Express App ────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Hook events endpoint — NO auth required (called from local hook scripts)
app.use('/api', createHooksRouter(state));

// Auth middleware for all other /api routes
app.use('/api', auth.middleware());

// ─── REST API Routes ────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0', uptime: process.uptime() });
});

// Server status overview
app.get('/api/status', (req, res) => {
  const status = state.getStatus();
  status.tunnelUrl = tunnel.getUrl();
  res.json(status);
});

// Pairing
app.get('/api/pair', (req, res) => {
  res.json(auth.getPairingInfo());
});

app.post('/api/pair', (req, res) => {
  const { code, deviceName, platform } = req.body;
  const result = auth.pair(code, { deviceName, platform });

  if (!result) {
    return res.status(401).json({ error: 'Invalid or expired pairing code' });
  }

  res.json(result);
});

app.post('/api/unpair', (req, res) => {
  auth.unpair();
  res.json({ ok: true });
});

// Sessions
app.get('/api/sessions', (req, res) => {
  res.json(state.getAllSessions());
});

app.get('/api/sessions/:id', (req, res) => {
  const session = state.getSessionDetail(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session);
});

// Notifications
app.get('/api/notifications', (req, res) => {
  res.json(state.notifications);
});

app.post('/api/notifications/read', (req, res) => {
  const { ids } = req.body;
  state.markNotificationsRead(ids || []);
  res.json({ ok: true });
});

// Device info
app.get('/api/device', (req, res) => {
  res.json(state.pairedDevice || { paired: false });
});

// ─── HTTP Server + WebSocket ────────────────────────────────────────

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  // Verify auth for WebSocket connections
  const device = auth.verifyWebSocket(req.url);
  if (!device) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  console.log(`[ws] Mobile device connected: ${device.deviceName}`);
  state.addClient(ws);

  // Send initial state on connect
  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    status: state.getStatus(),
    sessions: state.getAllSessions(),
    notifications: state.notifications.slice(0, 20),
  }));

  // Handle messages from mobile
  ws.on('message', (rawData) => {
    try {
      const message = JSON.parse(rawData.toString());

      switch (message.type) {
        case 'SEND_PROMPT':
          remotePrompt.handlePrompt(ws, message);
          break;

        case 'MARK_READ':
          state.markNotificationsRead(message.ids || []);
          break;

        case 'PING':
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          break;

        default:
          ws.send(JSON.stringify({ type: 'ERROR', error: `Unknown message type: ${message.type}` }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'ERROR', error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log(`[ws] Mobile device disconnected`);
    state.removeClient(ws);
  });

  ws.on('error', (err) => {
    console.error(`[ws] Error: ${err.message}`);
    state.removeClient(ws);
  });
});

// ─── Start Server ───────────────────────────────────────────────────

server.listen(PORT, () => {
  const pairingInfo = auth.getPairingInfo();

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ⚛️  OrdinaryMatter Relay Server                            ║
║                                                              ║
║   Status:  🟢 Running                                        ║
║   Port:    ${String(PORT).padEnd(46)}║
║   API:     http://localhost:${String(PORT).padEnd(36)}║
║                                                              ║
║   📱 Pairing Code: ${String(pairingInfo.code).padEnd(40)}║
║      (expires in ${String(pairingInfo.expiresInSeconds + 's').padEnd(41)}║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);

  // Start transcript watcher
  transcriptWatcher.start();

  // Start tunnel (async, will print URL when ready)
  if (process.env.NO_TUNNEL !== 'true') {
    tunnel.startTunnel().then(url => {
      if (url) {
        state.addNotification('info', `Tunnel active: ${url}`);
      }
    });
  }
});

// ─── Graceful Shutdown ──────────────────────────────────────────────

function shutdown() {
  console.log('\n🛑 Shutting down OrdinaryMatter...');
  transcriptWatcher.stop();
  tunnel.stop();
  wss.close();
  server.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
