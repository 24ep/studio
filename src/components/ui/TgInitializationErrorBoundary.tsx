"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import CacheClearHelper from '../../lib/cache-clear-helper';
import {
  isTgInitializationError,
  TgInitializationErrorFallback,
} from './TgInitializationErrorBoundaryParts';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class TgInitializationErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    if (isTgInitializationError(error)) {
      return { hasError: true, error };
    }

    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (isTgInitializationError(error)) {
      console.error('Variable Initialization Error caught:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount
      });
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleClearCache = async () => {
    await CacheClearHelper.clearAndReload({ clearServiceWorkers: false });
  };

  private handleHardRefresh = () => {
    window.location.href = window.location.href + '?t=' + Date.now();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (!isTgInitializationError(this.state.error)) {
        throw this.state.error;
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <TgInitializationErrorFallback
          error={this.state.error}
          maxRetries={this.maxRetries}
          retryCount={this.state.retryCount}
          onClearCache={this.handleClearCache}
          onHardRefresh={this.handleHardRefresh}
          onRefresh={this.handleRefresh}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}
