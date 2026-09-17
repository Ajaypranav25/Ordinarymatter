const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { StateManager, SessionStatus } = require('../state');

describe('StateManager', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  test('getOrCreateSession creates a new session if one does not exist', () => {
    const session = stateManager.getOrCreateSession('test-conversation-1');

    assert.strictEqual(session.id, 'test-conversation-1');
    assert.strictEqual(session.status, SessionStatus.IDLE);
    assert.strictEqual(session.events.length, 0);
  });

  test('getOrCreateSession returns existing session if it exists', () => {
    const session1 = stateManager.getOrCreateSession('test-conversation-2');
    const session2 = stateManager.getOrCreateSession('test-conversation-2');

    assert.strictEqual(session1, session2);
  });

  test('processHookEvent updates state for pre-invocation', () => {
    const event = {
      eventType: 'pre-invocation',
      conversationId: 'test-conversation-3',
      workspacePaths: ['/test/project/path']
    };

    const session = stateManager.processHookEvent(event);

    assert.strictEqual(session.status, SessionStatus.WORKING);
    assert.strictEqual(session.project, 'path'); // Path popped
    assert.strictEqual(session.invocationCount, 1);
    assert.strictEqual(session.events.length, 1);
    assert.strictEqual(session.events[0].type, 'pre-invocation');
  });

  test('processHookEvent updates state for post-tool-use with error', () => {
    const preToolEvent = {
      eventType: 'pre-tool-use',
      conversationId: 'test-conversation-4',
      toolName: 'test-tool'
    };
    stateManager.processHookEvent(preToolEvent);

    const postToolEvent = {
      eventType: 'post-tool-use',
      conversationId: 'test-conversation-4',
      hookPayload: { error: 'Test error message' }
    };
    const session = stateManager.processHookEvent(postToolEvent);

    assert.strictEqual(session.status, SessionStatus.ERROR);
    assert.strictEqual(session.errorCount, 1);
    assert.strictEqual(session.toolCallCount, 1);
    assert.strictEqual(stateManager.notifications.length, 1);
    assert.strictEqual(stateManager.notifications[0].type, 'error');
  });

  test('processHookEvent updates state for stop', () => {
    const event = {
      eventType: 'stop',
      conversationId: 'test-conversation-5',
      terminationReason: 'completed normally'
    };

    const session = stateManager.processHookEvent(event);

    assert.strictEqual(session.status, SessionStatus.COMPLETED);
    assert.strictEqual(session.currentTask, null);
    assert.strictEqual(stateManager.notifications.length, 1);
    assert.strictEqual(stateManager.notifications[0].type, 'task_completed');
  });

  test('addNotification adds to list and limits size', () => {
    for (let i = 0; i < 110; i++) {
      stateManager.addNotification('test', `message ${i}`);
    }

    assert.strictEqual(stateManager.notifications.length, 100);
    assert.strictEqual(stateManager.notifications[0].message, 'message 109'); // Newest at top
    assert.strictEqual(stateManager.notifications[99].message, 'message 10'); // Oldest at bottom
  });
});
