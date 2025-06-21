// src/components/layout/SetupFlowHandler.tsx
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

// Paths that should bypass the setup check
const BYPASS_PATHS = ['/auth/signin'];

export function SetupFlowHandler({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // Manages the global loader visibility
  const [initialCheckDone, setInitialCheckDone] = useState(false); // Tracks if the very first setup check has completed

  // Callback to perform the actual setup check API call
  // This manages its own isLoading state changes during the API call.
  const performSetupCheck = useCallback(async () => {
    console.log("SetupFlowHandler: performSetupCheck called. Pathname:", pathname);
    setIsLoading(true); // Show loader when this check is active
    let schemaInitialized = false;

    try {
      const response = await fetch('/api/system/initial-setup-check');
      if (response.ok) {
        const data = await response.json();
        schemaInitialized = data.schemaInitialized === true;
      } else {
        console.error(`SetupFlowHandler: API request failed with status ${response.status}.`);
        schemaInitialized = false; 
      }
      if (!schemaInitialized) {
        console.log("SetupFlowHandler: Schema not initialized.");
      } else {
        console.log("SetupFlowHandler: Schema initialized.");
      }
    } catch (networkError) {
      console.error('SetupFlowHandler: Network error during setup check API call:', networkError);
    } finally {
      setIsLoading(false); // Hide loader after check completes
      setInitialCheckDone(true); // Mark that an initial check attempt has been made
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);

  // Main effect to decide if a setup check is needed or if bypass.
  useEffect(() => {
    console.log(`SetupFlowHandler: Main effect. Path: ${pathname}, InitialCheckDone: ${initialCheckDone}`);
    const isBypassPath = BYPASS_PATHS.includes(pathname) || pathname.startsWith('/_next/');

    if (isBypassPath) {
      console.log("SetupFlowHandler: Bypass path detected.");
      setIsLoading(false); // No loading for bypass paths
      // We don't set initialCheckDone to true here unconditionally for bypass,
      // as navigating from signin back to a protected route should re-trigger a check if not done.
      // It's okay if initialCheckDone remains false; the next non-bypass path will trigger the check.
      return;
    }

    if (!initialCheckDone) {
      console.log("SetupFlowHandler: Initial check not completed, performing check.");
      performSetupCheck();
    } else {
      // If initial check is done, and it's not a bypass path, ensure loader is off.
      // This covers navigation between regular app pages after the first check.
      console.log("SetupFlowHandler: Initial check already done, ensuring loader is off.");
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, initialCheckDone]); // performSetupCheck is not needed here as it's called conditionally

  // Logging for component mount/unmount and state changes for deeper debugging if needed
  useEffect(() => {
    console.log(`SetupFlowHandler: Component instance Mounted/Updated. Current Pathname: ${pathname}. InitialCheckDone: ${initialCheckDone}`);
    return () => {
      // console.log(`SetupFlowHandler: Component instance Unmounted. Pathname was: ${pathname}`);
    };
  }, [pathname, initialCheckDone]); // Log when these crucial states/props change


  if (isLoading && !BYPASS_PATHS.includes(pathname) && !pathname.startsWith('/_next/')) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background fixed inset-0 z-[100]"> {/* Increased z-index */}
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Verifying application setup...</p>
      </div>
    );
  }
  
  return <>{children}</>;
}
