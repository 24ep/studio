"use client";

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export class SettingsPageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Settings page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <SettingsPageErrorState />;
    }

    return this.props.children;
  }
}

function SettingsPageErrorState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-muted-foreground mb-4">
          There was an error loading the settings page. Please try refreshing the page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}
