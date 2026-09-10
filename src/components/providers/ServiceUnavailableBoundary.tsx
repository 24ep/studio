"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

import { ServiceUnavailableState } from '@/components/ui/ServiceUnavailableState';
import { subscribeToFetchMonitor } from '@/lib/fetch-monitor';
import { isPageLoadRequest } from '@/lib/service-unavailable-utils';

export function ServiceUnavailableBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [unavailablePathname, setUnavailablePathname] = React.useState<string | null>(null);
  const handleUnavailable = React.useCallback(() => {
    setUnavailablePathname(pathname);
  }, [pathname]);

  return (
    <>
      <ServiceUnavailableFetchMonitor onUnavailable={handleUnavailable} />
      {unavailablePathname === pathname ? (
        <ServiceUnavailableState onRetry={() => window.location.reload()} />
      ) : children}
    </>
  );
}

function ServiceUnavailableFetchMonitor({ onUnavailable }: { onUnavailable: () => void }) {
  React.useEffect(() => {
    return subscribeToFetchMonitor({
      onResponse(response, input, init) {
        if (response.status === 503 && isPageLoadRequest(input, init)) {
          onUnavailable();
        }
      },
    });
  }, [onUnavailable]);

  return null;
}
