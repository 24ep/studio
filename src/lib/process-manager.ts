// src/lib/process-manager.ts
// Utility for managing process event listeners safely

interface ProcessHandler {
  signal: string;
  handler: (...args: unknown[]) => void;
  id: string;
}

class ProcessManager {
  private static instance: ProcessManager;
  private handlers: Map<string, ProcessHandler> = new Map();
  private maxListeners = 20; // Increase default limit

  private constructor() {
    // Only set max listeners in Node.js environment
    if (typeof process !== 'undefined' && process.setMaxListeners) {
      process.setMaxListeners(this.maxListeners);
    }
  }

  static getInstance(): ProcessManager {
    if (!ProcessManager.instance) {
      ProcessManager.instance = new ProcessManager();
    }
    return ProcessManager.instance;
  }

  /**
   * Safely add a process event listener, preventing duplicates
   */
  addHandler(signal: string, handler: (...args: unknown[]) => void, id: string): void {
    // Only work in Node.js environment
    if (typeof process === 'undefined' || !process.on) {
      return;
    }
    
    const key = `${signal}:${id}`;
    
    // Remove existing handler if it exists
    this.removeHandler(signal, id);
    
    // Add new handler
    const processHandler: ProcessHandler = { signal, handler, id };
    this.handlers.set(key, processHandler);
    process.on(signal, handler);
  }

  /**
   * Remove a specific process event listener
   */
  removeHandler(signal: string, id: string): void {
    // Only work in Node.js environment
    if (typeof process === 'undefined' || !process.removeListener) {
      return;
    }
    
    const key = `${signal}:${id}`;
    const existingHandler = this.handlers.get(key);
    
    if (existingHandler) {
      process.removeListener(signal, existingHandler.handler);
      this.handlers.delete(key);
    }
  }

  /**
   * Remove all handlers for a specific signal
   */
  removeAllHandlers(signal: string): void {
    // Only work in Node.js environment
    if (typeof process === 'undefined' || !process.removeListener) {
      return;
    }
    
    for (const [key, handler] of this.handlers.entries()) {
      if (handler.signal === signal) {
        process.removeListener(signal, handler.handler);
        this.handlers.delete(key);
      }
    }
  }

  /**
   * Get current listener count for a signal
   */
  getListenerCount(signal: string): number {
    // Only work in Node.js environment
    if (typeof process === 'undefined' || !process.listenerCount) {
      return 0;
    }
    
    return process.listenerCount(signal);
  }

  /**
   * Get all registered handlers
   */
  getAllHandlers(): ProcessHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Clean up all handlers (useful for testing or cleanup)
   */
  cleanup(): void {
    // Only work in Node.js environment
    if (typeof process === 'undefined' || !process.removeListener) {
      this.handlers.clear();
      return;
    }
    
    for (const [key, handler] of this.handlers.entries()) {
      process.removeListener(handler.signal, handler.handler);
      this.handlers.delete(key);
    }
  }
}

export const processManager = ProcessManager.getInstance();

// Convenience functions
export const addProcessHandler = (signal: string, handler: (...args: unknown[]) => void, id: string) => {
  processManager.addHandler(signal, handler, id);
};

export const removeProcessHandler = (signal: string, id: string) => {
  processManager.removeHandler(signal, id);
};

export const getProcessListenerCount = (signal: string) => {
  return processManager.getListenerCount(signal);
};
