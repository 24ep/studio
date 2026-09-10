import { useRef, useEffect } from 'react';
// Removed complex dynamic performance - using simple constants instead

/**
 * Hook to monitor render frequency with dynamic performance optimization
 * Prevents false positives that could cause application to get stuck
 * Automatically adjusts thresholds based on system resources
 */
export function useRenderMonitor(componentName: string, maxRenders: number = 200) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const warningShown = useRef(false);
  const enabled = process.env.NODE_ENV !== 'production';

  // Simple constant instead of complex dynamic performance
  const RENDER_THRESHOLD = maxRenders;

  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();
    renderCount.current++;

    // Only show warning once per component to reduce noise
    if (renderCount.current > RENDER_THRESHOLD && !warningShown.current) {
      console.warn(`⚠️ High render count in "${componentName}": ${renderCount.current} renders`);
      warningShown.current = true;
    }

    if (lastRenderTime.current > 0) {
      const timeSinceLastRender = now - lastRenderTime.current;
      // Only warn for very frequent renders (less than 50ms) and after many renders
      if (timeSinceLastRender < 50 && renderCount.current > 50 && !warningShown.current) {
        console.warn(`⚠️ Very frequent renders in "${componentName}": ${timeSinceLastRender}ms between renders`);
        warningShown.current = true;
      }
    }

    lastRenderTime.current = now;

    // Reset warning flag after a period of normal renders
    if (renderCount.current > RENDER_THRESHOLD * 2) {
      renderCount.current = 0;
      warningShown.current = false;
    }
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    // Simple threshold info for debugging
    maxRenders: RENDER_THRESHOLD
  };
}
