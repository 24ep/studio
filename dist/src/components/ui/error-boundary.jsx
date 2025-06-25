"use client";
import React, { Component } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { useRouter } from 'next/navigation';
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        var _a, _b;
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        // Log error to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            // You can integrate with services like Sentry, LogRocket, etc.
            console.error('Production error:', {
                error: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                timestamp: new Date().toISOString(),
            });
        }
        (_b = (_a = this.props).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return <ErrorFallback error={this.state.error}/>;
        }
        return this.props.children;
    }
}
function ErrorFallback({ error }) {
    const router = useRouter();
    const handleReload = () => {
        window.location.reload();
    };
    const handleGoHome = () => {
        router.push('/');
    };
    const handleReportError = () => {
        const errorDetails = {
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
        };
        // In a real app, you'd send this to your error reporting service
        console.error('Error report:', errorDetails);
        // For now, just copy to clipboard
        navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
        alert('Error details copied to clipboard. Please report this to support.');
    };
    return (<div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive"/>
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Bug className="h-4 w-4"/>
            <AlertTitle>Unexpected Error</AlertTitle>
            <AlertDescription>
              {(error === null || error === void 0 ? void 0 : error.message) || 'An unexpected error occurred. Please try again.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button onClick={handleReload} className="w-full" variant="default">
              <RefreshCw className="mr-2 h-4 w-4"/>
              Reload Page
            </Button>
            
            <Button onClick={handleGoHome} className="w-full" variant="outline">
              <Home className="mr-2 h-4 w-4"/>
              Go to Home
            </Button>
            
            <Button onClick={handleReportError} className="w-full" variant="ghost" size="sm">
              <Bug className="mr-2 h-4 w-4"/>
              Report Error
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (error === null || error === void 0 ? void 0 : error.stack) && (<details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-muted-foreground overflow-auto bg-muted p-2 rounded">
                {error.stack}
              </pre>
            </details>)}
        </CardContent>
      </Card>
    </div>);
}
// Hook for functional components to handle errors
export function useErrorHandler() {
    return React.useCallback((error, errorInfo) => {
        console.error('Error caught by useErrorHandler:', error, errorInfo);
        if (process.env.NODE_ENV === 'production') {
            // Log to monitoring service
            console.error('Production error:', {
                error: error.message,
                stack: error.stack,
                componentStack: errorInfo === null || errorInfo === void 0 ? void 0 : errorInfo.componentStack,
                timestamp: new Date().toISOString(),
            });
        }
    }, []);
}
// Higher-order component for wrapping components with error boundary
export function withErrorBoundary(Component, fallback, onError) {
    const WrappedComponent = (props) => (<ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props}/>
    </ErrorBoundary>);
    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
    return WrappedComponent;
}
