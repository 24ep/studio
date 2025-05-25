
"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export function SetupFlowHandler({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status: sessionStatus } = useSession(); // Use session status to avoid premature redirects
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage only on the client side
    const setupCompleteStorage = localStorage.getItem('setupComplete') === 'true';
    setIsSetupComplete(setupCompleteStorage);
    setIsLoading(false); // Done loading setup status from localStorage
  }, []);

  useEffect(() => {
    if (isLoading || sessionStatus === 'loading') {
      // Still loading setup status, session status, or it's the initial render before localStorage check
      return;
    }

    // If setup is not complete, and user is not on /setup or /auth/... pages, redirect to /setup
    if (isSetupComplete === false && pathname !== '/setup' && !pathname.startsWith('/auth')) {
      router.replace('/setup');
    }
    // If setup is complete and user is on /setup page, redirect to dashboard
    else if (isSetupComplete === true && pathname === '/setup') {
      router.replace('/');
    }
  }, [isSetupComplete, pathname, router, isLoading, sessionStatus]);

  // Show a loading spinner while checking setup status or if a redirect is imminent
  if (isLoading || (isSetupComplete === false && pathname !== '/setup' && !pathname.startsWith('/auth'))) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  // If setup is complete, or if it's not complete but user is on /setup or /auth pages, render children
  return <>{children}</>;
}
