/**
 * OrdinaryMatter — Remote Prompt Handler
 * 
 * Receives prompts from the mobile app and injects them into
 * Antigravity via the Python SDK.
 */

const { spawn } = require('child_process');
const path = require('path');

class RemotePromptHandler {
  constructor(stateManager) {
    this.state = stateManager;
  }

  /**
   * Handle a SEND_PROMPT WebSocket message.
   * Spawns an Antigravity agent via the Python SDK and streams the response.
   * 
   * @param {WebSocket} ws - The WebSocket client to stream response to
   * @param {Object} data - { prompt, sessionId?, workspacePath? }
   */
  async handlePrompt(ws, data) {
    const { prompt, workspacePath } = data;

    if (!prompt || !prompt.trim()) {
      ws.send(JSON.stringify({
        type: 'PROMPT_ERROR',
        error: 'Empty prompt',
      }));
      return;
    }

    // Notify mobile that we're starting
    ws.send(JSON.stringify({
      type: 'PROMPT_STARTED',
      prompt,
      timestamp: new Date().toISOString(),
    }));

    try {
      // Use the Python SDK to send the prompt to Antigravity
      // The SDK script spawns an agent and sends the prompt
      const pythonScript = this.buildPythonScript(prompt, workspacePath);

      const proc = spawn('python', ['-c', pythonScript], {
        cwd: workspacePath || process.cwd(),
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let responseText = '';
      let errorText = '';

      proc.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        responseText += text;

        // Stream tokens to mobile
        ws.send(JSON.stringify({
          type: 'PROMPT_TOKEN',
          token: text,
          timestamp: new Date().toISOString(),
        }));
      });

      proc.stderr.on('data', (chunk) => {
        errorText += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          ws.send(JSON.stringify({
            type: 'PROMPT_COMPLETED',
            response: responseText,
            timestamp: new Date().toISOString(),
          }));

          this.state.addNotification('task_completed', 'Remote prompt completed', {
            prompt: prompt.substring(0, 100),
          });
        } else {
          ws.send(JSON.stringify({
            type: 'PROMPT_ERROR',
            error: errorText || `Process exited with code ${code}`,
            timestamp: new Date().toISOString(),
          }));

          this.state.addNotification('task_failed', 'Remote prompt failed', {
            prompt: prompt.substring(0, 100),
            error: errorText.substring(0, 200),
          });
        }
      });

      proc.on('error', (err) => {
        ws.send(JSON.stringify({
          type: 'PROMPT_ERROR',
          error: `Failed to start Python: ${err.message}. Is the Antigravity SDK installed? (pip install google-antigravity)`,
          timestamp: new Date().toISOString(),
        }));
      });

      // Timeout after 10 minutes
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill();
          ws.send(JSON.stringify({
            type: 'PROMPT_ERROR',
            error: 'Prompt timed out after 10 minutes',
            timestamp: new Date().toISOString(),
          }));
        }
      }, 10 * 60 * 1000);

    } catch (err) {
      ws.send(JSON.stringify({
        type: 'PROMPT_ERROR',
        error: err.message,
        timestamp: new Date().toISOString(),
      }));
    }
  }

  /**
   * Build a Python script that uses the Antigravity SDK to send a prompt.
   */
  buildPythonScript(prompt, workspacePath) {
    // Escape the prompt for embedding in Python string
    const escapedPrompt = prompt
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');

    return `
import asyncio
import sys

async def main():
    try:
        from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig
    except ImportError:
        print("ERROR: Antigravity SDK not installed. Run: pip install google-antigravity", file=sys.stderr)
        sys.exit(1)

    config = LocalAgentConfig(
        capabilities=CapabilitiesConfig(),
    )

    async with Agent(config) as agent:
        response = await agent.chat("${escapedPrompt}")
        async for token in response:
            sys.stdout.write(token)
            sys.stdout.flush()

asyncio.run(main())
`.trim();
  }
}

module.exports = { RemotePromptHandler };
