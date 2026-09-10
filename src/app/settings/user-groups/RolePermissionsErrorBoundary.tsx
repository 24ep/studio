"use client";

import React, { ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';

export class RolePermissionsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    const isEeInitializationError = error.message.includes('Cannot access') &&
      error.message.includes('before initialization');

    if (isEeInitializationError) {
      console.error('Detected "ee" variable initialization error:', error);
    }

    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RolePermissions page error:', error, errorInfo);

    const isEeVariableError = error.message.includes('ee') &&
      (error.message.includes('Cannot access') ||
        error.message.includes('before initialization'));

    if (isEeVariableError) {
      console.error('EE Variable Error Context:', {
        errorType: 'Temporal Dead Zone',
        likelyCause: 'Variable accessed before initialization in minified bundle',
        recommendation: 'Component initialization order issue',
        componentStack: errorInfo.componentStack,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="p-4 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Component Initialization Error</h3>
            <p className="text-muted-foreground mb-4">
              There was an issue loading the Roles & Permissions page. This is typically caused by a component initialization order issue.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 mr-2"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground">
                  Error Details
                </summary>
                <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
