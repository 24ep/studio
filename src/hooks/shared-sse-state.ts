import { getSsePayloadType, isMeaningfulSsePayload } from "../lib/sse-event-utils";

export interface SSEEvent {
  type: string;
  data: unknown;
  timestamp: string;
}

export interface SharedSSEState {
  isConnected: boolean;
  eventCount: number;
  lastUpdate: string;
  error: string | null;
}

export const MAX_SHARED_SSE_RECONNECT_DELAY = 30000;
export const INITIAL_SHARED_SSE_RECONNECT_DELAY = 3000;

export function createInitialSharedSseState(): SharedSSEState {
  return {
    isConnected: false,
    eventCount: 0,
    lastUpdate: "Never",
    error: null,
  };
}

export function getSharedSseReconnectDelay(
  attempts: number,
  initialDelay = INITIAL_SHARED_SSE_RECONNECT_DELAY,
  maxDelay = MAX_SHARED_SSE_RECONNECT_DELAY,
) {
  return Math.min(initialDelay * Math.pow(2, Math.max(0, attempts)), maxDelay);
}

export function getConnectedSharedSseState(state: SharedSSEState, lastUpdate: string): SharedSSEState {
  return {
    ...state,
    isConnected: true,
    error: null,
    lastUpdate,
  };
}

export function getTimedOutSharedSseState(state: SharedSSEState, lastUpdate = state.lastUpdate): SharedSSEState {
  return {
    ...state,
    isConnected: false,
    error: "Connection timeout",
    lastUpdate,
  };
}

export function getErroredSharedSseState(state: SharedSSEState, lastUpdate = state.lastUpdate): SharedSSEState {
  return {
    ...state,
    isConnected: false,
    error: "Connection error - reconnecting...",
    lastUpdate,
  };
}

export function getPayloadSharedSseState(
  state: SharedSSEState,
  data: unknown,
  lastUpdate: string,
): SharedSSEState {
  return {
    ...state,
    eventCount: state.eventCount + (isMeaningfulSsePayload(data) ? 1 : 0),
    lastUpdate,
  };
}

export function createSharedSseEvent(data: unknown, fallbackType: string, timestamp: string): SSEEvent {
  return {
    type: getSsePayloadType(data) || fallbackType,
    data,
    timestamp,
  };
}
