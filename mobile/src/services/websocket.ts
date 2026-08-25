/**
 * OrdinaryMatter — WebSocket Service
 *
 * Manages the WebSocket connection to the relay server.
 * Handles auto-reconnection, auth, and message dispatching.
 */

type MessageHandler = (message: any) => void;
type ConnectionHandler = (connected: boolean) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private serverUrl: string = '';
  private token: string = '';
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 20;
  private isIntentionallyClosed: boolean = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Connect to the relay server.
   */
  connect(serverUrl: string, token: string): void {
    this.serverUrl = serverUrl;
    this.token = token;
    this.isIntentionallyClosed = false;
    this.reconnectAttempts = 0;
    this.doConnect();
  }

  private doConnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Convert HTTP URL to WebSocket URL
    const wsUrl = this.serverUrl
      .replace(/^http:/, 'ws:')
      .replace(/^https:/, 'wss:');

    const url = `${wsUrl}?token=${encodeURIComponent(this.token)}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[ws] Connected to relay server');
        this.reconnectAttempts = 0;
        this.notifyConnection(true);
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          this.messageHandlers.forEach((handler) => {
            try {
              handler(message);
            } catch (err) {
              console.error('[ws] Handler error:', err);
            }
          });
        } catch {
          console.error('[ws] Failed to parse message');
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[ws] Disconnected (code: ${event.code})`);
        this.stopPing();
        this.notifyConnection(false);

        if (!this.isIntentionallyClosed && event.code !== 4001) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[ws] Error:', error);
      };
    } catch (err) {
      console.error('[ws] Failed to create WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule a reconnection with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[ws] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(`[ws] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.doConnect();
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive.
   */
  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send({ type: 'PING' });
    }, 25000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Send a message to the server.
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send a prompt to Antigravity.
   */
  sendPrompt(prompt: string, workspacePath?: string): void {
    this.send({
      type: 'SEND_PROMPT',
      prompt,
      workspacePath,
    });
  }

  /**
   * Mark notifications as read.
   */
  markRead(ids: string[]): void {
    this.send({
      type: 'MARK_READ',
      ids,
    });
  }

  /**
   * Disconnect from the server.
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopPing();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Register a message handler.
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register a connection state handler.
   */
  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  private notifyConnection(connected: boolean): void {
    this.connectionHandlers.forEach((handler) => {
      try {
        handler(connected);
      } catch (err) {
        console.error('[ws] Connection handler error:', err);
      }
    });
  }

  /**
   * Check if currently connected.
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsService = new WebSocketService();
