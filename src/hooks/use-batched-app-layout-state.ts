import { useCallback, useEffect, useRef, useState } from 'react';

import type { AppLayoutState } from './app-layout-state-types';
import { INITIAL_APP_LAYOUT_STATE } from './app-layout-state-types';

function mergeQueuedUpdates(queue: Partial<AppLayoutState>[]) {
  return queue.reduce<Partial<AppLayoutState>>((acc, update) => ({
    ...acc,
    ...update,
  }), {});
}

export function useBatchedAppLayoutState() {
  const [state, setState] = useState<AppLayoutState>(INITIAL_APP_LAYOUT_STATE);
  const isUpdatingRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateQueueRef = useRef<Partial<AppLayoutState>[]>([]);

  const flushUpdateQueue = useCallback(() => {
    if (updateQueueRef.current.length === 0) {
      return;
    }

    const mergedUpdates = mergeQueuedUpdates(updateQueueRef.current);
    setState(prevState => ({
      ...prevState,
      ...mergedUpdates,
    }));
    updateQueueRef.current = [];
  }, []);

  const updateState = useCallback((updates: Partial<AppLayoutState>) => {
    const now = Date.now();

    if (now - lastUpdateTimeRef.current < 800) {
      updateQueueRef.current.push(updates);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        flushUpdateQueue();
        lastUpdateTimeRef.current = Date.now();
      }, 400);

      return;
    }

    if (isUpdatingRef.current) {
      updateQueueRef.current.push(updates);
      return;
    }

    isUpdatingRef.current = true;
    lastUpdateTimeRef.current = now;

    setState(prevState => ({
      ...prevState,
      ...updates,
    }));

    setTimeout(() => {
      isUpdatingRef.current = false;
      flushUpdateQueue();
    }, 400);
  }, [flushUpdateQueue]);

  useEffect(() => {
    return () => {
      isUpdatingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      updateQueueRef.current = [];
    };
  }, []);

  return {
    state,
    updateState,
  };
}
