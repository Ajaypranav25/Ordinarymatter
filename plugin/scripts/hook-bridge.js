#!/usr/bin/env node
/**
 * OrdinaryMatter Hook Bridge
 * 
 * Called by Antigravity lifecycle hooks. Reads the hook payload from stdin
 * and forwards it to the local OrdinaryMatter relay server.
 * 
 * Usage: node hook-bridge.js <event-type>
 * Event types: pre-invocation, post-invocation, pre-tool-use, post-tool-use, stop
 * 
 * Designed to be resilient — if the relay server is offline, the script
 * exits silently so Antigravity is never blocked.
 */

const http = require('http');
const path = require('path');

const RELAY_URL = 'http://localhost:7777';
const TIMEOUT_MS = 3000;

const eventType = process.argv[2] || 'unknown';

// Read all of stdin
let inputData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { inputData += chunk; });

process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(inputData || '{}');
  } catch {
    payload = {};
  }

  // Enrich payload with event metadata
  const enrichedPayload = {
    eventType,
    timestamp: new Date().toISOString(),
    hookPayload: payload,
    conversationId: payload.conversationId || null,
    workspacePaths: payload.workspacePaths || [],
    modelName: payload.modelName || null,
  };

  // Extract tool call info for tool-use events
  if (payload.toolCall) {
    enrichedPayload.toolName = payload.toolCall.name;
    enrichedPayload.toolArgs = payload.toolCall.args;
  }

  // Extract stop-specific fields
  if (eventType === 'stop') {
    enrichedPayload.terminationReason = payload.terminationReason || null;
    enrichedPayload.error = payload.error || null;
    enrichedPayload.fullyIdle = payload.fullyIdle || false;
  }

  // Extract invocation-specific fields
  if (payload.invocationNum !== undefined) {
    enrichedPayload.invocationNum = payload.invocationNum;
  }

  // Forward to relay server
  const postData = JSON.stringify(enrichedPayload);
  const url = new URL(`${RELAY_URL}/api/hook-event`);

  const req = http.request({
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
    timeout: TIMEOUT_MS,
  }, (res) => {
    // Drain the response
    res.resume();
    res.on('end', () => outputAndExit());
  });

  req.on('error', () => {
    // Relay server is offline — exit silently, don't block Antigravity
    outputAndExit();
  });

  req.on('timeout', () => {
    req.destroy();
    outputAndExit();
  });

  req.write(postData);
  req.end();
});

/**
 * Output the appropriate JSON response for the hook contract and exit.
 * 
 * - PreToolUse: must return { decision: "allow" } to not block tool execution
 * - All others: return {}
 */
function outputAndExit() {
  if (eventType === 'pre-tool-use') {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
  } else if (eventType === 'stop') {
    // Don't interfere with stop behavior
    process.stdout.write(JSON.stringify({}));
  } else {
    process.stdout.write(JSON.stringify({}));
  }
  process.exit(0);
}
