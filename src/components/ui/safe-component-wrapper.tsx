"use client";

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class SafeComponentWrapper extends Component<Props, State> {
  private maxRetries = 3;
  private mounted = true;
  
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      retryCount: 0
    };
  }

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if it's a temporal dead zone error
    const isTemporalDeadZone = error.message.includes('Cannot access') && 
                               error.message.includes('before initialization');
    
    return { 
      hasError: true, 
      error: isTemporalDeadZone ? new Error('Component initialization error. Please refresh the page.') : error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('SafeComponentWrapper caught an error:', error, errorInfo);
    
    // Check for temporal dead zone or variable access errors
    const isInitializationError = error.message.includes('Cannot access') ||
                                  error.message.includes('before initialization') ||
                                  error.message.includes('is not defined') ||
                                  error.name === 'ReferenceError';
    
    // Enhanced detection for the specific 'ee' and 'tg' variable errors
    const isEeVariableError = error.message.includes('ee') && 
                              (error.message.includes('Cannot access') || 
                               error.message.includes('before initialization'));
    const isTgVariableError = error.message.includes('tg') && 
                              (error.message.includes('Cannot access') || 
                               error.message.includes('before initialization'));
    
    if (isInitializationError) {
      console.error('Detected variable initialization error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        isEeVariableError,
        isTgVariableError
      });
      
      // Log additional context for debugging
      if (isEeVariableError || isTgVariableError) {
        const variableName = isTgVariableError ? 'TG' : 'EE';
        console.error(`${variableName} Variable Error Context:`, {
          errorType: 'Temporal Dead Zone',
          likelyCause: 'Variable accessed before initialization in minified bundle',
          recommendation: 'Check for circular dependencies or hook order issues',
          componentStack: errorInfo.componentStack,
          userAction: 'Try refreshing the page to reload the JavaScript bundle'
        });
      }
    }

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (!this.mounted) return;
    
    if (this.state.retryCount < this.maxRetries) {
      this.setState({ 
        hasError: false, 
        error: undefined,
        retryCount: this.state.retryCount + 1
      });
    } else {
      // Don't force page reload - just show error
      console.error('SafeComponentWrapper: Max retries reached, showing error state');
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle = "Something went wrong", fallbackDescription } = this.props;
      const showRetry = this.state.retryCount < this.maxRetries;
      
      return (
        <Card className="w-full max-w-md mx-auto my-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-destructive">{fallbackTitle}</CardTitle>
            <CardDescription>
              {fallbackDescription || this.state.error?.message || "An unexpected error occurred"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            {null}
            <Button onClick={this.handleReload} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
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
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default SafeComponentWrapper; 