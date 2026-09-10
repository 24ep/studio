"use client";

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

import { isChunkLoadError, recoverFromChunkLoadError } from '@/lib/chunk-load-recovery';
import { globalErrorHandler } from '@/lib/error-handler';
import { ErrorBoundaryFallback } from './ErrorBoundaryFallback';
import {
  createErrorBoundaryLogContext,
  getFilterErrorContext,
} from './error-boundary-utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  timestamp: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    timestamp: Date.now(),
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      timestamp: Date.now(),
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('ErrorBoundary error info:', errorInfo);
    console.error('Production error:', createErrorBoundaryLogContext(error, errorInfo));

    globalErrorHandler.handleError(error, 'error_boundary', {
      componentStack: errorInfo.componentStack,
      filterErrorContext: getFilterErrorContext(error),
    });

    this.setState({ error, errorInfo });

    if (isChunkLoadError(error)) {
      recoverFromChunkLoadError(error).catch((recoveryError) => {
        console.error('Chunk load recovery failed:', recoveryError);
      });
    }
  }

  private handleReload = () => {
    if (this.state.error && isChunkLoadError(this.state.error)) {
      recoverFromChunkLoadError(this.state.error).catch(() => {
        window.location.reload();
      });
      return;
    }

    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo);

    if (process.env.NODE_ENV === 'production') {
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
