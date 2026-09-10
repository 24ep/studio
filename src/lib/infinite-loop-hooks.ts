import { useCallback, useEffect, useRef } from 'react';
import type { SetStateAction } from 'react';
import {
  CircuitBreaker,
  createProtectedDebounce,
} from './infinite-loop-guards';

export function useInfiniteLoopDetection(
  effectName: string,
  maxCalls: number = 100,
  timeWindow: number = 5000
) {
  const callCount = useRef(0);
  const callTimes = useRef<number[]>([]);
  const isBlocked = useRef(false);

  useEffect(() => {
    if (isBlocked.current) {
      console.error(`Effect blocked due to potential infinite loop: ${effectName}`);
      return;
    }

    const now = Date.now();
    callCount.current++;
    callTimes.current.push(now);
    callTimes.current = callTimes.current.filter((time) => now - time < timeWindow);

    if (callTimes.current.length > maxCalls) {
      console.error(`Potential infinite loop detected in ${effectName}: ${callTimes.current.length} calls in ${timeWindow}ms`);
      isBlocked.current = true;
      return;
    }

    if (callCount.current > maxCalls * 10) {
      console.error(`Excessive effect calls detected in ${effectName}: ${callCount.current} total calls`);
      isBlocked.current = true;
      return;
    }

    return () => {
      callCount.current = 0;
      callTimes.current = [];
      isBlocked.current = false;
    };
  });
}

export function useEffectMonitor(effectName: string, warningThreshold: number = 100) {
  const lastCallTime = useRef<number>(0);
  const callCount = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime.current;
    callCount.current++;

    if (timeSinceLastCall < warningThreshold && lastCallTime.current > 0) {
      console.warn(`Frequent effect calls detected in ${effectName}: ${timeSinceLastCall}ms between calls (total: ${callCount.current})`);
    }

    lastCallTime.current = now;
  });
}

export function useStateUpdateGuard(stateName: string, maxUpdates: number = 50) {
  const updateCount = useRef(0);
  const isBlocked = useRef(false);

  const guardedSetState = useCallback(<T>(updater: SetStateAction<T>) => {
    if (isBlocked.current) {
      console.error(`State update blocked due to potential infinite loop: ${stateName}`);
      return;
    }

    updateCount.current++;
    if (updateCount.current > maxUpdates) {
      console.error(`Excessive state updates detected in ${stateName}: ${updateCount.current} updates`);
      isBlocked.current = true;
      return;
    }

    return updater;
  }, [stateName, maxUpdates]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateCount.current = 0;
      isBlocked.current = false;
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return guardedSetState;
}

export function useCircuitBreaker(
  name: string,
  failureThreshold: number = 5,
  timeout: number = 60000
) {
  const circuitBreakerRef = useRef<CircuitBreaker>();

  if (!circuitBreakerRef.current) {
    circuitBreakerRef.current = new CircuitBreaker(failureThreshold, timeout, name);
  }

  return circuitBreakerRef.current;
}

export function useRetryGuard(
  maxRetries: number = 3,
  maxTotalTime: number = 5000,
  name: string = 'Retry'
) {
  const startTime = useRef<number>(0);
  const retryCount = useRef<number>(0);

  const shouldRetry = useCallback(() => {
    const now = Date.now();

    if (startTime.current === 0) {
      startTime.current = now;
    }

    if (retryCount.current >= maxRetries) {
      console.warn(`${name}: Max retries (${maxRetries}) exceeded`);
      return false;
    }

    if (now - startTime.current > maxTotalTime) {
      console.warn(`${name}: Max total time (${maxTotalTime}ms) exceeded`);
      return false;
    }

    retryCount.current++;
    return true;
  }, [maxRetries, maxTotalTime, name]);

  const reset = useCallback(() => {
    startTime.current = 0;
    retryCount.current = 0;
  }, []);

  return { shouldRetry, reset, getRetryCount: () => retryCount.current };
}

export function useProtectedDebounce<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  delay: number,
  maxCalls: number = 100,
  name: string = 'DebouncedFunction'
): ((...args: TArgs) => void) {
  return useCallback(
    createProtectedDebounce(func, delay, maxCalls, name),
    [func, delay, maxCalls, name]
  );
}
