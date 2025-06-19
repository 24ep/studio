// src/components/layout/SetupFlowHandler.tsx
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

// Paths that should bypass the setup check
const BYPASS_PATHS = ['/auth/signin', '/setup-guidance'];

export function SetupFlowHandler({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const performSetupCheck = useCallback(async () => {
    setIsLoading(true);
    let schemaInitialized = false; // Default to false

    try {
      const response = await fetch('/api/system/initial-setup-check');

      if (response.ok) {
        try {
          const data = await response.json();
          schemaInitialized = data.schemaInitialized === true; // Explicitly check for true
        } catch (jsonError) {
          // This case is unusual: response.ok was true, but JSON parsing failed.
          console.error('Setup check: API response was OK, but JSON parsing failed:', jsonError);
          // Treat as if schema is not initialized or check failed to be safe.
          schemaInitialized = false;
        }
      } else {
        // Response not OK (e.g., 500 error from API), schema check failed or schema is not initialized.
        console.error(`Setup check: API request failed with status ${response.status}.`);
        // Attempt to get text from the response body for more details, but don't let it break anything.
        try {
          const errorText = await response.text();
          console.error('Setup check: API error response text:', errorText);
        } catch (textError) {
          console.error('Setup check: Failed to get error text from non-OK API response.');
        }
        schemaInitialized = false; // Treat as not initialized
      }

      if (!schemaInitialized) {
        if (pathname !== '/setup-guidance') {
          router.replace('/setup-guidance');
          return; // Exit early to let redirection take effect before finally block sets isLoading
        }
      }
      // If schemaInitialized is true, or if !schemaInitialized BUT we are already on /setup-guidance, proceed.
    } catch (networkError) { // Catches network errors from fetch() itself
      console.error('Setup check: Network error during initial setup check API call:', networkError);
      if (pathname !== '/setup-guidance') {
        router.replace('/setup-guidance');
        return; // Exit early
      }
    } finally {
      setIsLoading(false);
      setInitialCheckDone(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]); // router and pathname are dependencies

  useEffect(() => {
    const isBypassPath = BYPASS_PATHS.includes(pathname) || pathname.startsWith('/_next/');
    
    if (isBypassPath) {
      setIsLoading(false); // Stop loading for bypass paths
      setInitialCheckDone(true); // Consider check done for bypass paths
      return;
    }

    if (!initialCheckDone) { // Only run the check if it hasn't been done yet
        performSetupCheck();
    } else {
        // If check was done, but path changed (e.g. navigation after login),
        // we might not need to re-check immediately unless it's a crucial path.
        // For now, simply stop loading if the check has been performed.
        setIsLoading(false);
    }

  }, [pathname, initialCheckDone, performSetupCheck]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-50">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verifying application setup...</p>
      </div>
    );
  }
  
  return <>{children}</>;
}
