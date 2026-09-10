"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  threshold?: number; // Distance in pixels to trigger refresh
  resistance?: number; // Resistance factor when pulling beyond threshold
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
}

export function usePullToRefresh({
  onRefresh,
  enabled = true,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
  });

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const elementRef = useRef<HTMLElement | null>(null);

  const handleRefresh = useCallback(async () => {
    if (state.isRefreshing) return;
    
    setState(prev => ({ ...prev, isRefreshing: true }));
    try {
      await onRefresh();
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false, isPulling: false, pullDistance: 0 }));
    }
  }, [onRefresh, state.isRefreshing]);

  useEffect(() => {
    if (!enabled) return;

    const element = elementRef.current;
    if (!element) return;

    let touchStartY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh when scrolled to top
      if (element.scrollTop > 0) return;
      
      touchStartY = e.touches[0].clientY;
      startY.current = touchStartY;
      currentY.current = touchStartY;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || element.scrollTop > 0) {
        isDragging = false;
        return;
      }

      currentY.current = e.touches[0].clientY;
      const deltaY = currentY.current - touchStartY;

      if (deltaY > 0) {
        e.preventDefault(); // Prevent default scroll when pulling down
        const distance = Math.min(deltaY / resistance, threshold * 1.5);
        setState(prev => ({
          ...prev,
          isPulling: true,
          pullDistance: distance,
        }));
      } else {
        setState(prev => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
        }));
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      
      const finalDistance = state.pullDistance;
      
      if (finalDistance >= threshold && !state.isRefreshing) {
        handleRefresh();
      } else {
        setState(prev => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
        }));
      }
      
      isDragging = false;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, threshold, resistance, state.pullDistance, state.isRefreshing, handleRefresh]);

  return {
    elementRef,
    ...state,
    pullProgress: Math.min(state.pullDistance / threshold, 1),
  };
}

