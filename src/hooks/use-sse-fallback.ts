import { useEffect, useState } from 'react';
import { safeFetch } from '@/lib/safe-fetch';
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';

interface SSEFallbackOptions {
  fallbackIntervalMs?: number;
  enableFallback?: boolean;
}

/**
 * Fallback hook that provides polling when SSE is not available
 * This prevents the app from getting stuck when SSE fails
 */
export function useSSEFallback(options: SSEFallbackOptions = {}) {
  const {
    fallbackIntervalMs = 30000, // 30 second polling interval
    enableFallback = true
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
  const poll = async () => {
    try {
      const result = await safeFetch('/api/sse/status', { timeoutMs: 5000 });
      if (result.ok) {
        setLastPollTime(new Date());
      }
    } catch (error) {
      // Safe fail: polling is only a fallback/keep-alive.
    }
  };

  useVisibilityInterval(poll, fallbackIntervalMs, enableFallback && isPolling);

  const startPolling = () => {
    if (!enableFallback) return;
    setIsPolling(true);
  };

  const stopPolling = () => {
    setIsPolling(false);
  };

  useEffect(() => {
    if (!enableFallback) {
      setIsPolling(false);
    }
  }, [enableFallback]);

  return {
    isPolling,
    lastPollTime,
    startPolling,
    stopPolling
  };
}
