"use client";

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React, { useMemo, memo } from 'react';
import { SplashScreen } from '@/components/ui/SplashScreen';
import { useFavicon } from '@/hooks/use-favicon';
import { useSessionValidation } from '@/hooks/use-session-validation';
import { useTheme } from '@/hooks/use-theme';
import { useRenderMonitor } from '@/hooks/use-render-monitor';
import { useAppLayoutState } from '@/hooks/use-app-layout-state';
import { AdminPlatformSetupOnboarding } from '@/components/onboarding/AdminPlatformSetupOnboarding';
import { useLocalization } from '@/contexts/LocalizationContext';
import { isAdminUser } from '@/lib/permissions';

import { AppLayoutShell } from './AppLayoutShell';
import { getAppLayoutPageTitle } from './app-layout-view-utils';
import { useAppLayoutGlobalSettings } from './use-app-layout-global-settings';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayoutComponent = ({ children }: AppLayoutProps) => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { faviconDataUrl } = useFavicon();
  const { mounted: themeMounted } = useTheme();

  useRenderMonitor('AppLayout', 1000);

  const sessionValidationOptions = useMemo(() => ({
    validateInterval: 30 * 60 * 1000,
    autoSignOut: true,
    redirectTo: '/auth/signin'
  }), []);

  useSessionValidation(sessionValidationOptions);

  const appLayoutState = useAppLayoutState();
  const { t } = useLocalization();

  useAppLayoutGlobalSettings({
    appLayoutState,
    isClient: appLayoutState.isClient,
    session,
    status,
  });

  const pageTitle = useMemo(() => getAppLayoutPageTitle(pathname, (key, fallback) => t(key, fallback)), [pathname, t]);

  const completedBootstrapSteps = [
    status !== 'loading',
    themeMounted,
  ].filter(Boolean).length;

  if (completedBootstrapSteps < 2) {
    return (
      <SplashScreen
        persistent
        completedSteps={completedBootstrapSteps}
        totalSteps={2}
      />
    );
  }

  // Auth.js can surface a non-null error payload during local setup failures.
  // Treat any session without a usable user id as unauthenticated so the
  // shared layout never dereferences a malformed session object.
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <>
      <AppLayoutShell
        appLogoUrl={appLayoutState.appLogoUrl}
        contextualLogos={appLayoutState.contextualLogos}
        currentAppName={appLayoutState.currentAppName}
        faviconDataUrl={faviconDataUrl}
        isLogoLoading={appLayoutState.isLogoLoading}
        pageTitle={pageTitle}
        showLogoOnly={appLayoutState.showLogoOnly}
        sidebarLogoSize={appLayoutState.sidebarLogoSize}
      >
        {children}
      </AppLayoutShell>
      <AdminPlatformSetupOnboarding
        isAdmin={isAdminUser(session.user)}
        userId={session.user.id}
      />
    </>
  );
};

AppLayoutComponent.displayName = 'AppLayoutComponent';

export const AppLayout = memo(AppLayoutComponent);
AppLayout.displayName = 'AppLayout';


