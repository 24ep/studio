'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { GlobalSettingsProvider } from '@/contexts/GlobalSettingsContext';
import { ZIndexProvider } from '@/contexts/ZIndexContext';
import { RamdaPolyfillInitializer } from '@/components/ui/RamdaPolyfillInitializer';
import { AppLayout } from '@/components/layout/AppLayout';
import ToastClient from '@/components/ui/ToastClient';
import { AccessibilityPreferenceInitializer } from '@/components/privacy-support/AccessibilityPreferenceInitializer';
import { ServiceUnavailableBoundary } from '@/components/providers/ServiceUnavailableBoundary';
import { isFullPageWorkspacePath } from '@/lib/full-page-routes';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { LocalizationRuntime } from '@/components/providers/LocalizationRuntime';
import { PWAClientFeatures } from '@/components/pwa/PWAClientFeatures';

interface ClientProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

export function ClientProviders({ children, session }: ClientProvidersProps) {
  const fastDev = process.env.NEXT_PUBLIC_FAST_DEV === 'true';
  const pathname = usePathname();
  const [isEmbeddedFrame, setIsEmbeddedFrame] = React.useState(false);

  React.useEffect(() => {
    setIsEmbeddedFrame(
      window.self !== window.top ||
      new URLSearchParams(window.location.search).get('adminCenterEmbed') === '1',
    );
  }, []);

  // Routes that should render without the main AppLayout (no sidebar)
  const shouldBypassAppLayout = React.useMemo(() => {
    if (!pathname) return false;
    if (isEmbeddedFrame) return true;
    if (pathname === '/setup' || pathname.startsWith('/setup/')) return true;
    if (pathname === '/auth/setup-password' || pathname.startsWith('/auth/setup-password/')) return true;
    if (pathname === '/employee-portal/public' || pathname.startsWith('/employee-portal/public/')) return true;
    if (isFullPageWorkspacePath(pathname)) return true;
    // Match /applicants/[id]/evaluate and /applicants/[id]/evaluate-result (and any nested variants)
    // The evaluate page should NOT have sidebar/header navigation
    return /^\/applicants\/([^/]+)\/(evaluate|evaluate-result)(\/?|$)/i.test(pathname);
  }, [isEmbeddedFrame, pathname]);
  return (
    <SessionProvider session={session}>
      <LocalizationProvider>
       <AccessibilityPreferenceInitializer />
       <ZIndexProvider>
        <LoadingProvider>
          <NotificationProvider>
            <GlobalSettingsProvider>
              <LocalizationRuntime />
              <PWAClientFeatures />
              {fastDev ? (
                <>
                  <RamdaPolyfillInitializer />
                  <ServiceUnavailableBoundary>
                    {shouldBypassAppLayout ? children : <AppLayout>{children}</AppLayout>}
                  </ServiceUnavailableBoundary>
                  <ToastClient />
                </>
              ) : (
                <>
                  <RamdaPolyfillInitializer />
                  <ServiceUnavailableBoundary>
                    {shouldBypassAppLayout ? children : <AppLayout>{children}</AppLayout>}
                  </ServiceUnavailableBoundary>
                  <ToastClient />
                </>
              )}
            </GlobalSettingsProvider>
          </NotificationProvider>
        </LoadingProvider>
       </ZIndexProvider>
      </LocalizationProvider>
    </SessionProvider >
  );
}
