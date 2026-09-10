import {
  buildErrorContext,
  createFilterErrorContext,
  createInitializationErrorContext,
  getFilterErrorDebugInfo as buildFilterErrorDebugInfo,
  isFilterError as checkIsFilterError,
  isInitializationError,
  isResizeObserverLoopError,
  type ErrorAdditionalContext,
  type ErrorContext,
} from './error-handler-utils';

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorLog: ErrorContext[] = [];

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'unhandled_promise_rejection');
    });

    window.addEventListener('error', (event) => {
      if (event.defaultPrevented) {
        return;
      }

      if (isResizeObserverLoopError(event.message)) {
        return;
      }

      this.handleError(event.error || new Error(event.message), 'global_error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  }

  handleError(error: Error | string, errorType: string = 'unknown', additionalContext?: ErrorAdditionalContext) {
    const errorContext = buildErrorContext(error, errorType, additionalContext);

    if (checkIsFilterError(errorContext.message)) {
      this.handleFilterError(errorContext);
    }

    if (isInitializationError(errorContext.message)) {
      this.handleInitializationError(errorContext);
    }

    this.errorLog.push(errorContext);
    console.error('Global error handler caught:', errorContext);

    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorReportingService(errorContext);
    }
  }

  private handleInitializationError(errorContext: ErrorContext) {
    const enhancedContext = createInitializationErrorContext(errorContext);

    console.error(`${enhancedContext.errorType} detected:`, enhancedContext);
  }

  private handleFilterError(errorContext: ErrorContext) {
    const enhancedContext = createFilterErrorContext(errorContext);

    console.error('Filter error detected with enhanced context:', enhancedContext);
    
    this.showUserNotification('Data filtering error detected. Please refresh the page or contact support if the issue persists.');
  }

  private sendToErrorReportingService(errorContext: ErrorContext) {
    console.log('[MONITORING] Error context captured for reporting:', errorContext);
  }

  private showUserNotification(message: string) {
    console.warn('User notification:', message);
  }

  getErrorLog(): ErrorContext[] {
    return [...this.errorLog];
  }

  clearErrorLog() {
    this.errorLog = [];
  }

  isFilterError(error: Error | string): boolean {
    return checkIsFilterError(error);
  }

  getFilterErrorDebugInfo(array: unknown, context: string) {
    return buildFilterErrorDebugInfo(array, context);
  }
}

export const globalErrorHandler = GlobalErrorHandler.getInstance();

export const isFilterError = (error: Error | string) => globalErrorHandler.isFilterError(error);
export const getFilterErrorDebugInfo = (array: unknown, context: string) => globalErrorHandler.getFilterErrorDebugInfo(array, context);
