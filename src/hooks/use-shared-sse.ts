import { useEffect, useRef, useState, useCallback } from 'react';
import { parseSseJsonData } from '@/lib/sse-event-utils';
import {
  createInitialSharedSseState,
  createSharedSseEvent,
  getConnectedSharedSseState,
  getErroredSharedSseState,
  getPayloadSharedSseState,
  getSharedSseReconnectDelay,
  getTimedOutSharedSseState,
  type SSEEvent,
  type SharedSSEState,
} from './shared-sse-state';

export type { SSEEvent } from './shared-sse-state';

let globalEventSource: EventSource | null = null;
let globalState = createInitialSharedSseState();

let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;

const globalEventListeners = new Set<(event: SSEEvent) => void>();
const globalStateListeners = new Set<(state: SharedSSEState) => void>();

function notifyStateListeners() {
  globalStateListeners.forEach(listener => listener(globalState));
}

function notifyEventListeners(event: SSEEvent) {
  globalEventListeners.forEach(listener => listener(event));
}

function setGlobalState(state: SharedSSEState) {
  globalState = state;
  notifyStateListeners();
}

function closeGlobalEventSource() {
  if (!globalEventSource) {
    return;
  }

  try {
    globalEventSource.close();
  } finally {
    globalEventSource = null;
  }
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect() {
  clearReconnectTimer();

  const delay = getSharedSseReconnectDelay(reconnectAttempts);
  reconnectTimer = setTimeout(() => {
    reconnectAttempts++;
    initializeGlobalSSE();
  }, delay);
}

function getLastUpdateTime() {
  return new Date().toLocaleTimeString();
}

function handleParsedSseData(data: unknown, fallbackType: string) {
  setGlobalState(getPayloadSharedSseState(globalState, data, getLastUpdateTime()));
  notifyEventListeners(createSharedSseEvent(data, fallbackType, new Date().toISOString()));
}

function handleConnectionTimeout() {
  if (globalEventSource && !globalState.isConnected) {
    closeGlobalEventSource();
    setGlobalState(getTimedOutSharedSseState(globalState));
  }
}

function initializeGlobalSSE() {
  clearReconnectTimer();
  if (globalEventSource) {
    return;
  }

  try {
    globalEventSource = new EventSource('/api/sse');
    const connectionTimeout = setTimeout(handleConnectionTimeout, 15000);

    globalEventSource.onopen = () => {
      clearTimeout(connectionTimeout);
      reconnectAttempts = 0;
      setGlobalState(getConnectedSharedSseState(globalState, getLastUpdateTime()));
    };

    globalEventSource.onmessage = (event) => {
      const parsed = parseSseJsonData(event.data);
      if (!parsed.ok) {
        return;
      }

      handleParsedSseData(parsed.data, 'message');
    };

    const handleNamedEvent = (eventName: string) => (event: MessageEvent) => {
      const parsed = parseSseJsonData(event.data);
      if (!parsed.ok) {
        return;
      }

      handleParsedSseData(parsed.data, eventName);
    };

    globalEventSource.addEventListener('upload_queue_update', handleNamedEvent('upload_queue_update'));

    globalEventSource.addEventListener('keepalive', (event) => {
      const parsed = parseSseJsonData(event.data);
      if (!parsed.ok) {
        return;
      }

      setGlobalState(getPayloadSharedSseState(globalState, parsed.data, getLastUpdateTime()));
    });

    globalEventSource.addEventListener('connected', (event) => {
      const parsed = parseSseJsonData(event.data);
      if (!parsed.ok) {
        return;
      }

      setGlobalState(getPayloadSharedSseState(globalState, parsed.data, getLastUpdateTime()));
    });

    globalEventSource.onerror = () => {
      clearTimeout(connectionTimeout);
      setGlobalState(getErroredSharedSseState(globalState));
      closeGlobalEventSource();
      scheduleReconnect();
    };
  } catch (error) {
    setGlobalState({
      ...globalState,
      error: 'Failed to initialize connection',
    });
  }
}

function cleanupGlobalSSE() {
  clearReconnectTimer();

  if (globalEventSource) {
    closeGlobalEventSource();
    setGlobalState({
      ...globalState,
      isConnected: false,
      error: null,
    });
  }
}

export function useSharedSSE(enabled = true) {
  const [state, setState] = useState<SharedSSEState>(globalState);
  const eventListenerRef = useRef<(event: SSEEvent) => void>();
  const stateListenerRef = useRef<(state: SharedSSEState) => void>();

  useEffect(() => {
    if (!enabled) {
      cleanupGlobalSSE();
      return;
    }

    initializeGlobalSSE();
  }, [enabled]);

  useEffect(() => {
    stateListenerRef.current = (newState: SharedSSEState) => {
      setState(newState);
    };

    globalStateListeners.add(stateListenerRef.current);

    return () => {
      if (stateListenerRef.current) {
        globalStateListeners.delete(stateListenerRef.current);
      }
    };
  }, []);

  const subscribeToEvents = useCallback((callback: (event: SSEEvent) => void) => {
    eventListenerRef.current = callback;
    globalEventListeners.add(callback);

    return () => {
      globalEventListeners.delete(callback);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (eventListenerRef.current) {
        globalEventListeners.delete(eventListenerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    subscribeToEvents,
    reconnectAttempts,
    lastMessage: null,
    reconnect: initializeGlobalSSE,
    disconnect: cleanupGlobalSSE
  };
}

export { cleanupGlobalSSE };
