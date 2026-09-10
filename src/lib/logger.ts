/**
 * Logger Utility
 * 
 * A lightweight logging utility that respects production mode.
 * In production, debug logs are suppressed while errors and warnings remain.
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.DEBUG === 'true' || isDevelopment;

/**
 * Logger with conditional output based on environment
 */
export const logger = {
  /**
   * Debug log - only shown in development or when DEBUG=true
   */
  debug: (...args: unknown[]): void => {
    if (isDebugEnabled) {
      // console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info log - only shown in development or when DEBUG=true
   */
  info: (...args: unknown[]): void => {
    if (isDebugEnabled) {
      // console.log('[INFO]', ...args);
    }
  },

  /**
   * Warning log - always shown
   */
  warn: (...args: unknown[]): void => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error log - always shown
   */
  error: (...args: unknown[]): void => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Production-safe log - always shown but without sensitive data
   */
  log: (...args: unknown[]): void => {
    // console.log(...args);
  },
};

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string) {
  return {
    debug: (...args: unknown[]): void => {
      if (isDebugEnabled) {
        // console.log(`[DEBUG][${namespace}]`, ...args);
      }
    },
    info: (...args: unknown[]): void => {
      if (isDebugEnabled) {
        // console.log(`[INFO][${namespace}]`, ...args);
      }
    },
    warn: (...args: unknown[]): void => {
      console.warn(`[WARN][${namespace}]`, ...args);
    },
    error: (...args: unknown[]): void => {
      console.error(`[ERROR][${namespace}]`, ...args);
    },
  };
}

export default logger;
