"use client";

import React, { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';

class SettingsLayoutErrorBoundary extends React.Component<
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
    console.error('Settings layout error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Something went wrong</h3>
            <p className="mb-4 text-muted-foreground">
              There was an error loading the settings layout. Please try refreshing the page.
            </p>
            <button type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function SettingsLayoutContent({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [isClient, setIsClient] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (status === "loading" && !isClient) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated" && isClient) {
    const isOnSigninPage = typeof window !== 'undefined' && window.location.pathname === '/auth/signin';
    const isLogoutInProgress = typeof window !== 'undefined' && window.location.search.includes('signout=true');

    if (!isOnSigninPage && !isLogoutInProgress) {
      router.replace('/auth/signin');
    }

    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-settings-layout="true"
      className="flex h-full min-h-0 flex-col overflow-hidden bg-[hsl(var(--app-page-background))]"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SettingsClientLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsLayoutErrorBoundary>
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </SettingsLayoutErrorBoundary>
  );
}
