/**
 * OrdinaryMatter — Session State Manager
 * 
 * In-memory state store that tracks active Antigravity sessions,
 * their status, events, and conversation history.
 */

const crypto = require('crypto');

// Maximum events stored per session
const MAX_EVENTS_PER_SESSION = 500;

// Session status enum
const SessionStatus = {
  IDLE: 'idle',
  WORKING: 'working',
  WAITING_INPUT: 'waiting_input',
  ERROR: 'error',
  COMPLETED: 'completed',
};

class StateManager {
  constructor() {
    // Map of conversationId -> session object
    this.sessions = new Map();

    // Ordered list of notification events for the mobile app
    this.notifications = [];

    // Connected WebSocket clients
    this.wsClients = new Set();

    // Device pairing state
    this.pairedDevice = null;

    // Server start time
    this.startedAt = new Date().toISOString();
  }

  /**
   * Get or create a session by conversation ID.
   * @param {string} [conversationId] - The ID of the conversation. If falsy, a new ID is generated.
   * @returns {Object} The session object corresponding to the conversation ID.
   */
  getOrCreateSession(conversationId) {
    if (!conversationId) {
      conversationId = `unknown-${Date.now()}`;
    }

    if (!this.sessions.has(conversationId)) {
      this.sessions.set(conversationId, {
        id: conversationId,
        status: SessionStatus.IDLE,
        project: null,
        workspacePaths: [],
        modelName: null,
        currentTask: null,
        events: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        invocationCount: 0,
        toolCallCount: 0,
        errorCount: 0,
      });
    }

    return this.sessions.get(conversationId);
  }

  /**
   * Process a hook event and update session state.
   * @param {Object} event - The hook event object to process.
   * @param {string} event.conversationId - The associated conversation ID.
   * @param {string} event.eventType - The type of event (e.g., 'pre-invocation', 'post-tool-use', 'stop').
   * @param {string[]} [event.workspacePaths] - Workspace paths for the session.
   * @param {string} [event.modelName] - The model used for the session.
   * @param {number} [event.invocationNum] - The invocation number.
   * @param {string} [event.toolName] - The name of the tool being used.
   * @param {Object} [event.toolArgs] - Arguments passed to the tool.
   * @param {Object} [event.hookPayload] - The payload containing potential errors or tool data.
   * @param {string} [event.error] - An error message if the task failed.
   * @param {string} [event.terminationReason] - Reason for session termination.
   * @returns {Object} The updated session object.
   */
  processHookEvent(event) {
    const session = this.getOrCreateSession(event.conversationId);
    const now = new Date().toISOString();

    // Update workspace info if available
    if (event.workspacePaths && event.workspacePaths.length > 0) {
      session.workspacePaths = event.workspacePaths;
      // Derive project name from workspace path
      const primaryPath = event.workspacePaths[0];
      session.project = primaryPath.split(/[/\\]/).pop() || primaryPath;
    }

    if (event.modelName) {
      session.modelName = event.modelName;
    }

    // Map event type to status change
    switch (event.eventType) {
      case 'pre-invocation':
        session.status = SessionStatus.WORKING;
        session.invocationCount = event.invocationNum || (session.invocationCount + 1);
        break;

      case 'post-invocation':
        // After invocation, still working unless stopped
        session.status = SessionStatus.WORKING;
        break;

      case 'pre-tool-use':
        session.status = SessionStatus.WORKING;
        if (event.toolName) {
          session.currentTask = `Running: ${event.toolName}`;
        }
        break;

      case 'post-tool-use':
        session.toolCallCount++;
        if (event.hookPayload && event.hookPayload.error) {
          session.errorCount++;
          session.status = SessionStatus.ERROR;
          this.addNotification('error', `Tool error in ${session.project || 'session'}`, {
            sessionId: session.id,
            error: event.hookPayload.error,
          });
        } else {
          session.status = SessionStatus.WORKING;
        }
        break;

      case 'stop':
        const reason = event.terminationReason || 'unknown';
        if (event.error) {
          session.status = SessionStatus.ERROR;
          this.addNotification('task_failed', `Task failed in ${session.project || 'session'}`, {
            sessionId: session.id,
            error: event.error,
            reason,
          });
        } else {
          session.status = SessionStatus.COMPLETED;
          this.addNotification('task_completed', `Task completed in ${session.project || 'session'}`, {
            sessionId: session.id,
            reason,
          });
        }
        session.currentTask = null;
        break;
    }

    session.updatedAt = now;

    // Add event to session timeline
    const timelineEvent = {
      id: crypto.randomUUID(),
      type: event.eventType,
      timestamp: event.timestamp || now,
      toolName: event.toolName || null,
      toolArgs: event.toolArgs || null,
      error: event.hookPayload?.error || null,
      invocationNum: event.invocationNum || null,
      terminationReason: event.terminationReason || null,
    };

    session.events.push(timelineEvent);

    // Trim old events
    if (session.events.length > MAX_EVENTS_PER_SESSION) {
      session.events = session.events.slice(-MAX_EVENTS_PER_SESSION);
    }

    // Broadcast to connected clients
    this.broadcast({
      type: 'SESSION_UPDATE',
      session: this.serializeSession(session),
      event: timelineEvent,
    });

    return session;
  }

  /**
   * Add a transcript entry to a session (from transcript watcher).
   * @param {string} conversationId - The ID of the conversation.
   * @param {Object} entry - The transcript entry.
   * @param {string} [entry.source] - The source of the transcript entry.
   * @param {string} [entry.type] - The type of step (e.g., 'ASK_QUESTION', 'ASK_PERMISSION').
   * @param {string} [entry.content] - The content of the entry.
   * @param {Object} [entry.tool_calls] - Tool calls associated with the entry.
   */
  addTranscriptEntry(conversationId, entry) {
    const session = this.getOrCreateSession(conversationId);
    const now = new Date().toISOString();

    const transcriptEvent = {
      id: crypto.randomUUID(),
      type: 'transcript',
      timestamp: now,
      source: entry.source || null,
      stepType: entry.type || null,
      content: entry.content || null,
      toolCalls: entry.tool_calls || null,
    };

    session.events.push(transcriptEvent);

    if (session.events.length > MAX_EVENTS_PER_SESSION) {
      session.events = session.events.slice(-MAX_EVENTS_PER_SESSION);
    }

    session.updatedAt = now;

    // Check if this is a user input request (AI needs approval)
    if (entry.type === 'ASK_QUESTION' || entry.type === 'ASK_PERMISSION') {
      session.status = SessionStatus.WAITING_INPUT;
      this.addNotification('needs_input', `AI needs your input in ${session.project || 'session'}`, {
        sessionId: session.id,
        content: entry.content,
      });
    }

    this.broadcast({
      type: 'TRANSCRIPT_UPDATE',
      sessionId: conversationId,
      entry: transcriptEvent,
    });
  }

  /**
   * Add a notification.
   * @param {string} notifType - The type of notification.
   * @param {string} message - The notification message.
   * @param {Object} [data={}] - Additional data associated with the notification.
   * @returns {Object} The created notification object.
   */
  addNotification(notifType, message, data = {}) {
    const notification = {
      id: crypto.randomUUID(),
      type: notifType,
      message,
      data,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.notifications.unshift(notification);

    // Keep last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.broadcast({
      type: 'NOTIFICATION',
      notification,
    });

    return notification;
  }

  /**
   * Serialize a session for API/WebSocket responses.
   * @param {Object} session - The session object to serialize.
   * @returns {Object} The serialized session object (excluding event history).
   */
  serializeSession(session) {
    return {
      id: session.id,
      status: session.status,
      project: session.project,
      workspacePaths: session.workspacePaths,
      modelName: session.modelName,
      currentTask: session.currentTask,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      invocationCount: session.invocationCount,
      toolCallCount: session.toolCallCount,
      errorCount: session.errorCount,
      eventCount: session.events.length,
    };
  }

  /**
   * Get all sessions (serialized, no events).
   * @returns {Object[]} An array of serialized session objects sorted by most recently updated.
   */
  getAllSessions() {
    return Array.from(this.sessions.values())
      .map(s => this.serializeSession(s))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Get a session with its full event timeline.
   * @param {string} conversationId - The ID of the conversation to detail.
   * @returns {Object|null} The session details including events, or null if not found.
   */
  getSessionDetail(conversationId) {
    const session = this.sessions.get(conversationId);
    if (!session) return null;

    return {
      ...this.serializeSession(session),
      events: session.events,
    };
  }

  /**
   * Get server status overview.
   * @returns {Object} Status overview containing active session count, paired status, etc.
   */
  getStatus() {
    const sessions = this.getAllSessions();
    const activeSessions = sessions.filter(s =>
      s.status === SessionStatus.WORKING || s.status === SessionStatus.WAITING_INPUT
    );

    return {
      serverStartedAt: this.startedAt,
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      currentSession: activeSessions[0] || sessions[0] || null,
      connectedClients: this.wsClients.size,
      paired: this.pairedDevice !== null,
      unreadNotifications: this.notifications.filter(n => !n.read).length,
    };
  }

  /**
   * Register a WebSocket client.
   * @param {WebSocket} ws - The WebSocket client to register.
   */
  addClient(ws) {
    this.wsClients.add(ws);
  }

  /**
   * Unregister a WebSocket client.
   * @param {WebSocket} ws - The WebSocket client to remove.
   */
  removeClient(ws) {
    this.wsClients.delete(ws);
  }

  /**
   * Broadcast a message to all connected WebSocket clients.
   * @param {Object} message - The message object to broadcast.
   */
  broadcast(message) {
    const data = JSON.stringify(message);
    for (const client of this.wsClients) {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(data);
        } catch {
          // Client disconnected — will be cleaned up on close
        }
      }
    }
  }

  /**
   * Mark notifications as read.
   * @param {string[]} [ids=[]] - Optional array of notification IDs to mark as read. If empty, all are marked as read.
   */
  markNotificationsRead(ids = []) {
    if (ids.length === 0) {
      // Mark all as read
      this.notifications.forEach(n => { n.read = true; });
    } else {
      this.notifications
        .filter(n => ids.includes(n.id))
        .forEach(n => { n.read = true; });
    }
  }
}

module.exports = { StateManager, SessionStatus };
