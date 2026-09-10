import { useEffect, useRef, useState, useCallback } from 'react';
import { parseSseJsonData } from '@/lib/sse-event-utils';

type EventData = unknown;

interface EventSourceOptions {
  withCredentials?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  enableCircuitBreaker?: boolean;
}

export function useEventSource(url: string, options: EventSourceOptions = {}) {
  const {
    withCredentials = false,
    timeoutMs = 30000, // 30 second timeout
    maxRetries = 3,
    retryDelayMs = 5000, // 5 second delay between retries
    enableCircuitBreaker = true
  } = options;

  // Build-time flag to disable SSE on clients (e.g., in .env.local set NEXT_PUBLIC_DISABLE_SSE=true)
  const isSseDisabled = process.env.NEXT_PUBLIC_DISABLE_SSE === 'true';

  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<EventData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isCircuitOpen, setIsCircuitOpen] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastErrorTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch (e) {
      }
      eventSourceRef.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    // Respect explicit disable flag
    if (isSseDisabled) {
      setConnected(false);
      setError('SSE disabled by NEXT_PUBLIC_DISABLE_SSE');
      return;
    }

    // Circuit breaker: if too many recent failures, don't retry immediately
    if (enableCircuitBreaker && isCircuitOpen) {
      const timeSinceLastError = Date.now() - lastErrorTimeRef.current;
      if (timeSinceLastError < 60000) { // 1 minute circuit breaker
        return;
      } else {
        setIsCircuitOpen(false);
        setRetryCount(0);
      }
    }

    // Don't retry if we've exceeded max retries
    if (retryCount >= maxRetries) {
      setError(`Connection failed after ${maxRetries} attempts`);
      setIsCircuitOpen(true);
      lastErrorTimeRef.current = Date.now();
      return;
    }

    cleanup();

    try {
      
      const es = new EventSource(url, { withCredentials });
      eventSourceRef.current = es;

      // Set connection timeout
      timeoutRef.current = setTimeout(() => {
        cleanup();
        setConnected(false);
        setError('Connection timeout');
        
        // Schedule retry
        if (retryCount < maxRetries) {
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connect();
          }, retryDelayMs);
        } else {
          setIsCircuitOpen(true);
          lastErrorTimeRef.current = Date.now();
        }
      }, timeoutMs);

      es.onopen = () => {
        cleanup(); // Clear timeout
        setConnected(true);
        setError(null);
        setRetryCount(0);
        setIsCircuitOpen(false);
      };

      es.onerror = (event) => {
        cleanup();
        setConnected(false);
        setError('Connection error');
        
        // Schedule retry
        if (retryCount < maxRetries) {
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connect();
          }, retryDelayMs);
        } else {
          setIsCircuitOpen(true);
          lastErrorTimeRef.current = Date.now();
        }
      };

      es.onmessage = (e) => {
        const parsed = parseSseJsonData(e.data);
        setLastEvent(parsed.ok ? parsed.data : parsed.rawData);
      };

    } catch (error) {
      setError(`Failed to create connection: ${error}`);
      setConnected(false);
      
      // Schedule retry
      if (retryCount < maxRetries) {
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connect();
        }, retryDelayMs);
      } else {
        setIsCircuitOpen(true);
        lastErrorTimeRef.current = Date.now();
      }
    }
  }, [url, withCredentials, timeoutMs, maxRetries, retryDelayMs, enableCircuitBreaker, retryCount, isCircuitOpen, cleanup]);

  useEffect(() => {
    connect();
    
    return cleanup;
  }, [connect, cleanup]);

  const reconnect = useCallback(() => {
    setRetryCount(0);
    setIsCircuitOpen(false);
    setError(null);
    connect();
  }, [connect]);

  return { 
    connected, 
    lastEvent, 
    error, 
    retryCount, 
    isCircuitOpen,
    reconnect 
  };
}


