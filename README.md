# ⚛️ OrdinaryMatter

**Remote control and monitoring for Antigravity AI coding sessions.**

Monitor your AI coding tasks, send remote prompts, and receive notifications — all from your phone.

---

## Architecture

```
Antigravity IDE/CLI → Lifecycle Hooks → OrdinaryMatter Relay Server → Cloudflare Tunnel → Mobile App
```

### Components

| Component | Tech | Purpose |
|:---|:---|:---|
| **Relay Server** | Node.js + Express + WebSocket | Aggregates session events, serves API, bridges to mobile |
| **Antigravity Plugin** | Lifecycle Hooks | Captures session events and forwards to relay |
| **Mobile App** | React Native + Expo | Native app for iOS/Android with dashboard, sessions, remote control |
| **Tunnel** | Cloudflare Tunnel | Secure connection from phone to PC without port forwarding |

---

## Quick Start

### 1. Install Dependencies

```bash
# Server
cd server && npm install

# Mobile
cd mobile && npm install
```

### 2. Install the Antigravity Plugin

```bash
npm run install-plugin
```

This copies the plugin to `~/.gemini/config/plugins/ordinarymatter/`. Restart Antigravity to activate.

### 3. Start the Relay Server

```bash
npm run server
```

You'll see:
```
⚛️  OrdinaryMatter Relay Server
   Status:  🟢 Running
   Port:    7777
   📱 Pairing Code: 123456
```

### 4. Start Cloudflare Tunnel

```bash
npm run tunnel
```

Requires [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) installed. You'll get a public URL like `https://abc123.trycloudflare.com`.

### 5. Run the Mobile App

```bash
npm run mobile
```

Open in Expo Go on your phone. Enter the tunnel URL and pairing code in Settings.

---

## Features

### Dashboard
- Connection status (🟢 Connected / 🔴 Disconnected)
- Current project and task
- Session statistics

### Sessions
- List of all active and recent sessions
- Full event timeline with tool calls, errors, and responses

### Remote Control
- Send prompts to Antigravity from your phone
- Real-time response streaming
- Suggestion prompts for quick actions

### Notifications
- Task completed / failed alerts
- AI needs input notifications
- Unread badge count

### Settings
- Device pairing with 6-digit code
- Server URL configuration
- Disconnect/re-pair

---

## Project Structure

```
Ordinarymatter/
├── server/           # Relay server (Node.js)
│   └── src/
│       ├── index.js          # Entry point
│       ├── state.js          # Session state manager
│       ├── hooks-handler.js  # Hook event processor
│       ├── transcript-watcher.js  # JSONL transcript tailer
│       ├── remote-prompt.js  # Mobile → Antigravity prompts
│       ├── auth.js           # Pairing & JWT auth
│       └── tunnel.js         # Cloudflare Tunnel manager
├── plugin/           # Antigravity plugin
│   ├── plugin.json
│   ├── hooks.json
│   └── scripts/
│       ├── hook-bridge.js    # Hook → relay bridge
│       └── hook-bridge.cmd   # Windows wrapper
├── mobile/           # React Native + Expo app
│   └── src/
│       ├── services/         # WebSocket, API, notifications
│       ├── store/            # State management
│       ├── screens/          # 5 main screens
│       ├── components/       # Reusable UI components
│       ├── theme/            # Design system
│       └── navigation/       # Tab + stack navigation
└── scripts/
    └── install-plugin.js     # Plugin installer
```

---

## License

MIT
