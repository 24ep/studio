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
    try {
      const response = await fetch('/api/system/initial-setup-check');
      // No matter the API outcome (error or success), we want to get its JSON response
      // to determine if schemaInitialized is true or false.
      const data = await response.json(); 

      if (!data.schemaInitialized) {
        // If schema is not initialized and we are not already on guidance page, redirect.
        if (pathname !== '/setup-guidance') {
          router.replace('/setup-guidance');
          // setIsLoading(false) will be handled by the effect re-running due to pathname change
          return; // Exit early to let redirection take effect
        }
      }
      // If schema is initialized, or if API call failed but we are on setup-guidance,
      // or if schema is not initialized BUT we are already on setup-guidance,
      // then we stop loading and let the current page render.
    } catch (error) {
      console.error('Error calling initial setup check API:', error);
      // If API call itself fails, and we are not on setup-guidance, redirect to it.
      if (pathname !== '/setup-guidance') {
        router.replace('/setup-guidance');
         return; 
      }
    } finally {
      setIsLoading(false);
      setInitialCheckDone(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]); // router is stable, pathname changes trigger re-evaluation

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