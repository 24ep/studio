import { useSSEFallback } from '@/hooks/use-sse-fallback';
import { useSharedSSE } from '@/hooks/use-shared-sse';
import { useEffect } from 'react';

export interface EnhancedSSEEndpointStatus {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  priority: number;
  isConnected: boolean;
  lastError: string | null;
  lastErrorEventType: string | null;
  lastErrorLocation: string | null;
  lastErrorTime: number | null;
  connectionAttempts: number;
  retryCount: number;
  maxRetries: number;
  isCircuitOpen: boolean;
}

export interface EnhancedSSEConnectionStatus {
  totalEndpoints: number;
  connectedEndpoints: number;
  failedEndpoints: number;
  disabledEndpoints: number;
  endpoints: EnhancedSSEEndpointStatus[];
}

// Lightweight compatibility hook mapped to the new robust EventSource
export function useEnhancedSSE(enabled = true) {
  const isSseDisabled = !enabled || process.env.NEXT_PUBLIC_DISABLE_SSE === 'true';
  const {
    isConnected: connected,
    lastMessage,
    error,
    reconnectAttempts,
    reconnect,
    disconnect,
  } = useSharedSSE(!isSseDisabled);
  const isCircuitOpen = Boolean(error) && reconnectAttempts >= 2;

  const { startPolling, stopPolling, isPolling } = useSSEFallback({
    fallbackIntervalMs: 30000, // 30 second polling
    enableFallback: !isSseDisabled
  });

  // Start fallback polling when SSE fails
  useEffect(() => {
    if (isSseDisabled) {
      stopPolling();
      return;
    }
    if (isCircuitOpen) {
      startPolling();
    } else if (connected) {
      stopPolling();
    }
  }, [isSseDisabled, connected, isCircuitOpen, startPolling, stopPolling]);

  const connectionStatus: EnhancedSSEConnectionStatus = {
    totalEndpoints: 1,
    connectedEndpoints: connected ? 1 : 0,
    failedEndpoints: !isSseDisabled && !connected ? 1 : 0,
    disabledEndpoints: isSseDisabled ? 1 : 0,
    endpoints: [
      {
        id: 'main-sse',
        name: 'Main SSE',
        url: '/api/sse',
        enabled: !isSseDisabled,
        priority: 1,
        isConnected: connected,
        lastError: error,
        lastErrorTime: error ? Date.now() : null,
        lastErrorEventType: null,
        lastErrorLocation: null,
        connectionAttempts: reconnectAttempts > 0 ? reconnectAttempts + 1 : connected ? 1 : 0,
        retryCount: reconnectAttempts,
        maxRetries: 2,
        isCircuitOpen
      }
    ]
  };

  return {
    isConnected: connected || (isSseDisabled ? false : isPolling), // Treat disabled as not connected
    isFullyConnected: connected,
    hasFailures: !!error || isCircuitOpen,
    isConnecting: reconnectAttempts > 0 && !connected,

    connectionStatus,
    totalEndpoints: connectionStatus.totalEndpoints,
    connectedEndpoints: connectionStatus.connectedEndpoints,
    failedEndpoints: connectionStatus.failedEndpoints,
    disabledEndpoints: connectionStatus.disabledEndpoints,

    // No-ops for legacy API
    getEndpointDetails: (id: string) => (
      connectionStatus.endpoints.find(endpoint => endpoint.id === id) ?? connectionStatus.endpoints[0]
    ),
    isEndpointConnected: (_id: string) => connected || isPolling,
    toggleEndpoint: (_id: string, _enabled: boolean) => {},
    reconnectEndpoint: (_id: string) => {},
    connect: () => {},
    disconnect,
    reconnect,

    error: isPolling ? 'Using fallback polling' : error,
    lastMessage
  };
}

export function useEnhancedApplicantUpdates() {
  const { isConnected, connectionStatus } = useEnhancedSSE();
  return { isConnected, hasMainSSE: connectionStatus.endpoints[0]?.isConnected };
}

export function useEnhancedPositionUpdates() {
  const { isConnected, connectionStatus } = useEnhancedSSE();
  return { isConnected, hasMainSSE: connectionStatus.endpoints[0]?.isConnected };
}

export function useEnhancedUploadQueueUpdates() {
  const { isConnected, connectionStatus } = useEnhancedSSE();
  return { isConnected, hasMainSSE: connectionStatus.endpoints[0]?.isConnected };
}

export function useEnhancedDashboardUpdates() {
  const { isConnected, connectionStatus } = useEnhancedSSE();
  return { isConnected, hasMainSSE: connectionStatus.endpoints[0]?.isConnected };
}

