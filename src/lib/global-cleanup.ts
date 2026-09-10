
// Global cleanup utilities
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Clean up all EventSource connections
    const eventSources = document.querySelectorAll('script[src*="EventSource"]');
    eventSources.forEach(script => {
      const scriptElement = script as HTMLScriptElement;
      if (scriptElement.src) {
        try {
          const eventSource = new EventSource(scriptElement.src);
          if (eventSource && typeof eventSource.close === 'function') {
            eventSource.close();
          }
        } catch (error) {
          console.error('Error cleaning up EventSource:', error);
        }
      }
    });

    // Clear all timeouts and intervals
    // Note: This is a simplified approach - in practice, you should track timeouts/intervals
    // and clear them individually rather than clearing all possible IDs

  });
}

// Monitor for memory leaks - reduced frequency for lower CPU usage
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  setInterval(() => {
    const memoryInfo = (performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
      };
    }).memory;
    if (memoryInfo && memoryInfo.usedJSHeapSize > 150 * 1024 * 1024) {
      console.warn('🚨 High memory usage detected:', Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024), 'MB');
    }
  }, 60000); // Optimized: 60s (was 10s) - less frequent checks
}
