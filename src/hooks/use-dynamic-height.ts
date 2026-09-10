import { useState, useEffect, useRef, useCallback } from 'react';
import { SafeResizeObserver } from '@/lib/resize-observer-utils';
import {
  calculateDynamicHeight,
  clearDynamicHeightTimer,
  resolveDynamicHeightOptions,
  shouldCommitDynamicHeight,
  sumElementHeights,
  type UseDynamicHeightOptions,
} from './dynamic-height-utils';

export function useDynamicHeight(options: UseDynamicHeightOptions = {}) {
  const { minHeight, maxHeight, buffer, debounceMs } = resolveDynamicHeightOptions(options);
  
  const [height, setHeight] = useState<number>(minHeight);
  const elementRef = useRef<HTMLDivElement>(null);
  const filterRefs = useRef<Set<HTMLElement>>(new Set());
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeObserverRef = useRef<SafeResizeObserver | null>(null);
  const isUpdatingRef = useRef<boolean>(false);
  const lastHeightRef = useRef<number>(minHeight);

  const updateHeight = useCallback(() => {
    if (isUpdatingRef.current) {
      return;
    }

    isUpdatingRef.current = true;
    
    try {
      const newHeight = calculateDynamicHeight({
        windowHeight: typeof window !== 'undefined' ? window.innerHeight : null,
        filterHeight: sumElementHeights(filterRefs.current),
        minHeight,
        maxHeight,
        buffer,
      });
      
      if (shouldCommitDynamicHeight(newHeight, lastHeightRef.current)) {
        lastHeightRef.current = newHeight;
        setHeight(newHeight);
      }
    } catch (error) {
      console.warn('Error updating dynamic height:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [minHeight, maxHeight, buffer]);

  const debouncedUpdateHeight = useCallback(() => {
    clearDynamicHeightTimer(resizeTimeoutRef);
    resizeTimeoutRef.current = setTimeout(() => {
      if (!isUpdatingRef.current) {
        updateHeight();
      }
    }, debounceMs);
  }, [updateHeight, debounceMs]);

  const addFilterRef = useCallback((ref: HTMLElement | null) => {
    if (ref) {
      filterRefs.current.add(ref);
      debouncedUpdateHeight();
    }
  }, [debouncedUpdateHeight]);

  const removeFilterRef = useCallback((ref: HTMLElement | null) => {
    if (ref) {
      filterRefs.current.delete(ref);
      debouncedUpdateHeight();
    }
  }, [debouncedUpdateHeight]);

  useEffect(() => {
    const initialTimer = setTimeout(updateHeight, 100);

    resizeObserverRef.current = new SafeResizeObserver(() => {
      if (!isUpdatingRef.current && elementRef.current) {
        debouncedUpdateHeight();
      }
    }, debounceMs);

    if (elementRef.current) {
      resizeObserverRef.current.observe(elementRef.current);
    }

    const handleResize = () => {
      debouncedUpdateHeight();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize, { passive: true });
    }

    return () => {
      clearTimeout(initialTimer);
      clearDynamicHeightTimer(resizeTimeoutRef);
      
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
      
      isUpdatingRef.current = false;
    };
  }, [updateHeight, debouncedUpdateHeight, debounceMs]);

  return { 
    height, 
    elementRef, 
    addFilterRef, 
    removeFilterRef 
  };
}
