"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
// Removed complex dynamic performance - using simple constants instead

export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);
  const lastPathnameRef = useRef<string | null>(null);

  // Simple constants instead of complex dynamic performance - optimized for better performance
  const DEBOUNCE_DELAY = 1000; // Reduced from 3000ms to 1000ms
  const UPDATE_TIMEOUT = 800; // Reduced from 1500ms to 800ms
  const LOADING_TIMEOUT = 1500; // Reduced from 3000ms to 1500ms

  const startLoading = useCallback(() => {
    const now = Date.now();
    // Simple debouncing
    if (now - lastUpdateTimeRef.current < DEBOUNCE_DELAY) {
      return;
    }
    
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    lastUpdateTimeRef.current = now;
    
    setIsLoading(true);
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, UPDATE_TIMEOUT);
  }, []);

  const stopLoading = useCallback(() => {
    const now = Date.now();
    // Simple debouncing
    if (now - lastUpdateTimeRef.current < DEBOUNCE_DELAY) {
      return;
    }
    
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    lastUpdateTimeRef.current = now;
    
    setIsLoading(false);
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, UPDATE_TIMEOUT);
  }, []);

  // Optimized pathname change detection with better memoization
  const hasPathnameChanged = useMemo(() => {
    const currentPathname = pathname;
    const previousPathname = lastPathnameRef.current;
    
    // Only consider it a change if we have a previous pathname and they're different
    const hasChanged = previousPathname !== null && previousPathname !== currentPathname;
    
    // Update the ref for next comparison
    lastPathnameRef.current = currentPathname;
    
    return hasChanged;
  }, [pathname]);

  useEffect(() => {
    // Only show loading for actual page changes, not for the same page
    if (hasPathnameChanged) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      startLoading();
      
      // Simple timeout
      loadingTimeoutRef.current = setTimeout(() => {
        stopLoading();
      }, LOADING_TIMEOUT);
    }
    
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [hasPathnameChanged, startLoading, stopLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Memoize the return value to prevent unnecessary re-renders
  const memoizedValue = useMemo(() => ({
    isLoading,
    startLoading,
    stopLoading,
  }), [isLoading, startLoading, stopLoading]);

  return memoizedValue;
} 
