"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { isNextRedirectError } from '@/lib/next-redirect-error';
import {
  canStartProtectedClick,
  clearClickProtectionTimeout,
  resetActioningWhenMounted,
  resetClickProtectionState,
  scheduleClickProtectionReset,
  type ClickProtectionConfig,
  type ClickProtectionReturn,
} from './click-protection-utils';

export function useClickProtection(config: ClickProtectionConfig = {}): ClickProtectionReturn {
  const {
    debounceMs = 200,
    timeoutMs = 500,
    actionName = 'action',
    onBlocked,
    onExcessiveClicks
  } = config;

  const [isActioning, setIsActioning] = useState(false);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearClickProtectionTimeout(actionTimeoutRef);
    };
  }, []);

  const reset = useCallback(() => {
    resetClickProtectionState({
      lastClickTimeRef,
      setIsActioning,
      timeoutRef: actionTimeoutRef,
    });
  }, []);

  const handleProtectedClick = useCallback((action: () => void | Promise<void>) => {
    const now = Date.now();
    if (!canStartProtectedClick({
      debounceMs,
      isActioning,
      isMounted: isMountedRef.current,
      lastClickTime: lastClickTimeRef.current,
      now,
      onBlocked,
      onExcessiveClicks,
    })) {
      return;
    }

    lastClickTimeRef.current = now;
    setIsActioning(true);
    scheduleClickProtectionReset({
      isMountedRef,
      setIsActioning,
      timeoutMs,
      timeoutRef: actionTimeoutRef,
    });
    
    try {
      const result = action();
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error(`${actionName} error:`, error);
          resetActioningWhenMounted(isMountedRef, setIsActioning);
        });
      }
    } catch (error) {
      console.error(`${actionName} error:`, error);
      resetActioningWhenMounted(isMountedRef, setIsActioning);
    }
  }, [actionName, debounceMs, timeoutMs, isActioning, onBlocked, onExcessiveClicks]);

  const handleProtectedAsyncClick = useCallback(async (action: () => Promise<void>) => {
    const now = Date.now();
    if (!canStartProtectedClick({
      debounceMs,
      isActioning,
      isMounted: isMountedRef.current,
      lastClickTime: lastClickTimeRef.current,
      now,
      onBlocked,
      onExcessiveClicks,
    })) {
      return;
    }

    lastClickTimeRef.current = now;
    setIsActioning(true);
    
    try {
      await action();
    } catch (error) {
      // IMPORTANT: If it's a redirect error (success), we MUST re-throw it!
      if (isNextRedirectError(error)) {
        throw error;
      }
      console.error(`${actionName} error:`, error);
    } finally {
      // Set timeout to reset action state
      // We still reset state even on redirect because the redirect might arguably take a moment
      // or if it fails/cancels (though usually component unmounts)
      scheduleClickProtectionReset({
        isMountedRef,
        setIsActioning,
        timeoutMs,
        timeoutRef: actionTimeoutRef,
      });
    }
  }, [actionName, debounceMs, timeoutMs, isActioning, onBlocked, onExcessiveClicks]);

  return {
    isActioning,
    handleProtectedClick,
    handleProtectedAsyncClick,
    reset
  };
}
