import { useEffect, useRef } from 'react';

type VisibilityIntervalCallback = () => void | Promise<void>;

export function useVisibilityInterval(
  callback: VisibilityIntervalCallback,
  intervalMs: number,
  enabled = true
) {
  const callbackRef = useRef(callback);
  const isRunningRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || typeof document === 'undefined' || intervalMs <= 0) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const canRun = () => {
      return !document.hidden && (typeof navigator === 'undefined' || navigator.onLine);
    };

    const clearIntervalIfNeeded = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const run = () => {
      if (!canRun() || isRunningRef.current) return;

      const result = callbackRef.current();
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        isRunningRef.current = true;
        result.finally(() => {
          isRunningRef.current = false;
        });
      }
    };

    const start = () => {
      if (intervalId !== null || !canRun()) return;
      intervalId = setInterval(run, intervalMs);
      run();
    };

    const handleVisibility = () => {
      if (!canRun()) {
        clearIntervalIfNeeded();
        isRunningRef.current = false;
        return;
      }
      start();
    };

    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleVisibility);
      window.addEventListener('offline', handleVisibility);
    }

    return () => {
      clearIntervalIfNeeded();
      document.removeEventListener('visibilitychange', handleVisibility);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleVisibility);
        window.removeEventListener('offline', handleVisibility);
      }
    };
  }, [intervalMs, enabled]);
}
