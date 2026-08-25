/**
 * OrdinaryMatter — State Management
 *
 * React Context + useReducer for global app state.
 * Receives updates from WebSocket and REST API.
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { wsService } from '../services/websocket';
import { apiService } from '../services/api';
import { notificationService } from '../services/notifications';

// ─── Types ──────────────────────────────────────────────────────────

export interface Session {
  id: string;
  status: string;
  project: string | null;
  workspacePaths: string[];
  modelName: string | null;
  currentTask: string | null;
  createdAt: string;
  updatedAt: string;
  invocationCount: number;
  toolCallCount: number;
  errorCount: number;
  eventCount: number;
  events?: any[];
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  data: any;
  timestamp: string;
  read: boolean;
}

export interface AppStateType {
  // Connection
  isConnected: boolean;
  isReconnecting: boolean;
  isPaired: boolean;

  // Server status
  serverStatus: {
    serverStartedAt: string;
    totalSessions: number;
    activeSessions: number;
    connectedClients: number;
    unreadNotifications: number;
  } | null;

  // Sessions
  sessions: Session[];
  currentSession: Session | null;

  // Notifications
  notifications: Notification[];
  unreadCount: number;

  // Remote prompt
  isPromptRunning: boolean;
  promptResponse: string;
  promptError: string | null;

  // Device
  pairedDevice: any;
}

const initialState: AppStateType = {
  isConnected: false,
  isReconnecting: false,
  isPaired: false,
  serverStatus: null,
  sessions: [],
  currentSession: null,
  notifications: [],
  unreadCount: 0,
  isPromptRunning: false,
  promptResponse: '',
  promptError: null,
  pairedDevice: null,
};

// ─── Actions ────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_PAIRED'; payload: boolean }
  | { type: 'SET_SERVER_STATUS'; payload: any }
  | { type: 'SET_SESSIONS'; payload: Session[] }
  | { type: 'UPDATE_SESSION'; payload: Session }
  | { type: 'SET_CURRENT_SESSION'; payload: Session | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_READ'; payload: string[] }
  | { type: 'PROMPT_STARTED' }
  | { type: 'PROMPT_TOKEN'; payload: string }
  | { type: 'PROMPT_COMPLETED'; payload: string }
  | { type: 'PROMPT_ERROR'; payload: string }
  | { type: 'PROMPT_RESET' }
  | { type: 'SET_DEVICE'; payload: any }
  | { type: 'RESET' };

function reducer(state: AppStateType, action: Action): AppStateType {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload, isReconnecting: !action.payload && state.isPaired };

    case 'SET_PAIRED':
      return { ...state, isPaired: action.payload };

    case 'SET_SERVER_STATUS':
      return { ...state, serverStatus: action.payload };

    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };

    case 'UPDATE_SESSION': {
      const updated = action.payload;
      const sessions = state.sessions.map((s) =>
        s.id === updated.id ? { ...s, ...updated } : s
      );
      // Add new session if not found
      if (!sessions.find((s) => s.id === updated.id)) {
        sessions.unshift(updated);
      }
      const currentSession =
        state.currentSession?.id === updated.id
          ? { ...state.currentSession, ...updated }
          : state.currentSession;
      return { ...state, sessions, currentSession };
    }

    case 'SET_CURRENT_SESSION':
      return { ...state, currentSession: action.payload };

    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter((n: Notification) => !n.read).length,
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 100),
        unreadCount: state.unreadCount + 1,
      };

    case 'MARK_READ': {
      const ids = action.payload;
      const notifications = state.notifications.map((n) =>
        ids.length === 0 || ids.includes(n.id) ? { ...n, read: true } : n
      );
      return {
        ...state,
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }

    case 'PROMPT_STARTED':
      return { ...state, isPromptRunning: true, promptResponse: '', promptError: null };

    case 'PROMPT_TOKEN':
      return { ...state, promptResponse: state.promptResponse + action.payload };

    case 'PROMPT_COMPLETED':
      return { ...state, isPromptRunning: false, promptResponse: action.payload };

    case 'PROMPT_ERROR':
      return { ...state, isPromptRunning: false, promptError: action.payload };

    case 'PROMPT_RESET':
      return { ...state, isPromptRunning: false, promptResponse: '', promptError: null };

    case 'SET_DEVICE':
      return { ...state, pairedDevice: action.payload };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────

interface StoreContextType {
  state: AppStateType;
  dispatch: React.Dispatch<Action>;
  connect: (serverUrl: string, token: string) => void;
  disconnect: () => void;
  sendPrompt: (prompt: string) => void;
  refreshSessions: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ─── WebSocket message handler ────────────────────────

  useEffect(() => {
    const unsubMessage = wsService.onMessage((message) => {
      switch (message.type) {
        case 'INITIAL_STATE':
          dispatch({ type: 'SET_SERVER_STATUS', payload: message.status });
          dispatch({ type: 'SET_SESSIONS', payload: message.sessions || [] });
          dispatch({ type: 'SET_NOTIFICATIONS', payload: message.notifications || [] });
          break;

        case 'SESSION_UPDATE':
          dispatch({ type: 'UPDATE_SESSION', payload: message.session });
          break;

        case 'NOTIFICATION': {
          dispatch({ type: 'ADD_NOTIFICATION', payload: message.notification });
          // Show push notification if app is in background
          if (AppState.currentState !== 'active') {
            notificationService.showForEvent(message.notification);
          }
          break;
        }

        case 'PROMPT_STARTED':
          dispatch({ type: 'PROMPT_STARTED' });
          break;

        case 'PROMPT_TOKEN':
          dispatch({ type: 'PROMPT_TOKEN', payload: message.token });
          break;

        case 'PROMPT_COMPLETED':
          dispatch({ type: 'PROMPT_COMPLETED', payload: message.response });
          break;

        case 'PROMPT_ERROR':
          dispatch({ type: 'PROMPT_ERROR', payload: message.error });
          break;
      }
    });

    const unsubConnection = wsService.onConnection((connected) => {
      dispatch({ type: 'SET_CONNECTED', payload: connected });
    });

    return () => {
      unsubMessage();
      unsubConnection();
    };
  }, []);

  // ─── Auto-connect on init ─────────────────────────────

  useEffect(() => {
    (async () => {
      const stored = await apiService.init();
      if (stored) {
        dispatch({ type: 'SET_PAIRED', payload: true });
        wsService.connect(stored.serverUrl, stored.token);
      }
    })();
  }, []);

  // ─── Actions ──────────────────────────────────────────

  const connect = useCallback((serverUrl: string, token: string) => {
    dispatch({ type: 'SET_PAIRED', payload: true });
    wsService.connect(serverUrl, token);
  }, []);

  const disconnect = useCallback(() => {
    wsService.disconnect();
    dispatch({ type: 'RESET' });
  }, []);

  const sendPrompt = useCallback((prompt: string) => {
    dispatch({ type: 'PROMPT_RESET' });
    wsService.sendPrompt(prompt);
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      const sessions = await apiService.getSessions();
      dispatch({ type: 'SET_SESSIONS', payload: sessions });
    } catch {
      // Ignore errors
    }
  }, []);

  return (
    <StoreContext.Provider
      value={{ state, dispatch, connect, disconnect, sendPrompt, refreshSessions }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
