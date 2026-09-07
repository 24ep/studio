"use client";

import { memo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { FaviconUpdater } from '@/components/layout/FaviconUpdater';
import { BroadcastBanner } from '@/components/layout/BroadcastBanner';
import { ImpersonationBanner } from '@/components/layout/ImpersonationBanner';
import { GlobalConnectivityBanner } from '@/components/layout/GlobalConnectivityBanner';
import { DemoEnvironmentBanner } from '@/components/layout/DemoEnvironmentBanner';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from './Header';
import { HeaderSecondaryNavigation } from './HeaderSecondaryNavigation';
import { isHeaderHiddenOnMobileDetail } from './header-utils';
import type { AppLayoutContextualLogos } from './app-layout-settings';

const MemoizedFaviconUpdater = memo(FaviconUpdater);

interface AppLayoutShellProps {
  appLogoUrl: string | null;
  children: ReactNode;
  contextualLogos: Partial<AppLayoutContextualLogos>;
  currentAppName: string;
  faviconDataUrl?: string | null;
  isLogoLoading: boolean;
  pageTitle: string;
  showLogoOnly: boolean;
  sidebarLogoSize: number;
}

export function AppLayoutShell({
  appLogoUrl,
  children,
  currentAppName,
  faviconDataUrl,
  pageTitle,
  showLogoOnly,
}: AppLayoutShellProps) {
  const { t } = useLocalization();
  const pathname = usePathname() || '';
  const isMobile = useIsMobile();
  const showSecondaryNavigation = (
    !pathname.startsWith('/auth/')
    && !(isMobile && isHeaderHiddenOnMobileDetail(pathname))
  );

  return (
    <>
      <MemoizedFaviconUpdater faviconDataUrl={faviconDataUrl} />
      <a href="#main-content" className="fixed left-3 top-3 z-[600] -translate-y-24 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground shadow-lg transition-transform focus:translate-y-0">
        {t("layout.skipToMainContent", "Skip to main content")}
      </a>
      <div
        className="flex h-dvh min-h-0 flex-col overflow-hidden"
        style={{
          background: 'radial-gradient(circle at top left, hsl(var(--primary) / 0.10), transparent 34%), linear-gradient(135deg, hsl(var(--app-page-background, var(--background))) 0%, hsl(var(--muted)) 100%)',
        }}
        data-testid="app-layout"
      >
        <ImpersonationBanner />
        <DemoEnvironmentBanner />
        <BroadcastBanner />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-transparent">
            <Header
              pageTitle={pageTitle}
              showLogoOnly={showLogoOnly}
              appLogoUrl={appLogoUrl}
              currentAppName={currentAppName}
            />
            <GlobalConnectivityBanner />
            <main
              id="main-content"
              tabIndex={-1}
              className="relative min-h-0 flex-1 overflow-hidden bg-transparent pb-[calc(4rem+env(safe-area-inset-bottom))] text-foreground focus:outline-none md:pb-0 lg:p-3 xl:p-4"
            >
              <section className="h-full min-h-0 w-full min-w-0 overflow-hidden bg-background lg:rounded-[24px] lg:bg-background/95 lg:shadow-[0_18px_48px_hsl(var(--foreground)/0.08)]">
                <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
                  {showSecondaryNavigation ? (
                    <HeaderSecondaryNavigation pathname={pathname} />
                  ) : null}
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
                    {children}
                  </div>
                </div>
              </section>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
