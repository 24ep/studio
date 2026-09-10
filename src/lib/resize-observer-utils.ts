/**
 * ResizeObserver Utilities
 * 
 * Provides safe wrappers and error handling for ResizeObserver to prevent
 * "ResizeObserver loop completed with undelivered notifications" errors.
 */

/**
 * Safe ResizeObserver wrapper that prevents infinite loops
 */
export class SafeResizeObserver {
  private observer: ResizeObserver | null = null;
  private isObserving = false;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private lastSize: { width: number; height: number } | null = null;

  constructor(
    private callback: (entries: ResizeObserverEntry[]) => void,
    private debounceMs: number = 100
  ) {
    this.createObserver();
  }

  private createObserver(): void {
    try {
      this.observer = new ResizeObserver((entries) => {
        // Use requestAnimationFrame to prevent ResizeObserver loop errors
        requestAnimationFrame(() => {
          this.handleResize(entries);
        });
      });
    } catch (error) {
      console.warn('ResizeObserver not supported:', error);
    }
  }

  private handleResize(entries: ResizeObserverEntry[]): void {
    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    // Debounce the callback to prevent rapid successive calls
    this.debounceTimeout = setTimeout(() => {
      try {
        // Check if size actually changed significantly
        const entry = entries[0];
        if (entry && entry.contentRect) {
          const { width, height } = entry.contentRect;
          
          if (!this.lastSize || 
              Math.abs(width - this.lastSize.width) > 1 || 
              Math.abs(height - this.lastSize.height) > 1) {
            
            this.lastSize = { width, height };
            this.callback(entries);
          }
        } else {
          this.callback(entries);
        }
      } catch (error) {
        console.warn('Error in ResizeObserver callback:', error);
      }
    }, this.debounceMs);
  }

  observe(element: Element): void {
    if (this.observer && !this.isObserving) {
      try {
        this.observer.observe(element);
        this.isObserving = true;
      } catch (error) {
        console.warn('Error observing element:', error);
      }
    }
  }

  unobserve(element: Element): void {
    if (this.observer && this.isObserving) {
      try {
        this.observer.unobserve(element);
        this.isObserving = false;
      } catch (error) {
        console.warn('Error unobserving element:', error);
      }
    }
  }

  disconnect(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    
    if (this.observer) {
      try {
        this.observer.disconnect();
        this.observer = null;
      } catch (error) {
        console.warn('Error disconnecting ResizeObserver:', error);
      }
    }
    
    this.isObserving = false;
    this.lastSize = null;
  }
}

/**
 * Global ResizeObserver error handler
 * Call this function early in your application to prevent ResizeObserver errors
 */
export function setupGlobalResizeObserverErrorHandler(): (() => void) | void {
  if (typeof window === 'undefined') return;

  const errorHandler = (error: ErrorEvent) => {
    if (error.message && error.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      // Prevent the error from being logged to console
      error.preventDefault();
      
      // Log a more informative message
      console.warn('ResizeObserver loop detected - this is usually harmless and has been handled automatically');
    }
  };

  window.addEventListener('error', errorHandler);

  // Return cleanup function
  return () => {
    window.removeEventListener('error', errorHandler);
  };
}

/**
 * Hook for creating a safe ResizeObserver
 */
export function useSafeResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  debounceMs: number = 100
): SafeResizeObserver {
  return new SafeResizeObserver(callback, debounceMs);
}

/**
 * Utility to check if ResizeObserver is supported
 */
export function isResizeObserverSupported(): boolean {
  return typeof window !== 'undefined' && 'ResizeObserver' in window;
}

/**
 * Utility to create a ResizeObserver with error handling
 */
export function createSafeResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  debounceMs: number = 100
): SafeResizeObserver | null {
  if (!isResizeObserverSupported()) {
    console.warn('ResizeObserver is not supported in this environment');
    return null;
  }

  return new SafeResizeObserver(callback, debounceMs);
}
