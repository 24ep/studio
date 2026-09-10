"use client";
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isSystemSettingsTabId } from './system-settings-page-constants';
import { SystemSettingsTabContent } from './SystemSettingsTabContent';
import { useSystemSettingsPage } from './use-system-settings-page';

export default function SystemSettingsPage() {
  const router = useRouter();
  const [isEmbedded, setIsEmbedded] = React.useState<boolean | null>(null);
  const settingsPage = useSystemSettingsPage();
  const {
    fetchError,
    isLoading,
    sessionStatus,
  } = settingsPage;

  React.useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const embedded = window.self !== window.top || search.get('adminCenterEmbed') === '1';
    setIsEmbedded(embedded);

    if (!embedded) {
      const requestedTab = search.get('tab');
      const systemTab = isSystemSettingsTabId(requestedTab) ? requestedTab : 'organize';
      router.replace(`/settings?systemTab=${encodeURIComponent(systemTab)}`);
    }
  }, [router]);

  if (isEmbedded === null || !isEmbedded || sessionStatus === 'loading' || (isLoading && !fetchError)) {
    return <EmbeddedSystemSettingsSkeleton />;
  }
  if (fetchError && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <ServerCrash className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">Access Denied or Error</h2>
        <p className="text-muted-foreground mb-4 max-w-md">{fetchError}</p>
        <Button onClick={() => router.push('/')} className="btn-hover-primary-gradient">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="min-h-0 flex-1 overflow-hidden">
        <SystemSettingsTabContent settingsPage={settingsPage} />
      </div>
    </div>
  );
}

function EmbeddedSystemSettingsSkeleton() {
  return (
    <div className="h-full overflow-hidden bg-background p-4" aria-busy="true" aria-label="Loading system settings">
      <div className="flex h-full gap-4">
        <aside className="hidden w-56 shrink-0 border-r pr-4 lg:block">
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                className={index % 3 === 0 ? "h-9 w-full rounded-[4px]" : "h-9 w-[84%] rounded-[4px]"}
              />
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-4">
          <div className="rounded-[6px] border p-4">
            <Skeleton className="h-4 w-44 rounded-[4px]" />
            <Skeleton className="mt-2 h-3 w-80 max-w-full rounded-[4px]" />
          </div>

          {Array.from({ length: 4 }).map((_, sectionIndex) => (
            <section key={sectionIndex} className="rounded-[6px] border p-4">
              <Skeleton className="h-4 w-36 rounded-[4px]" />
              <div className="mt-4 space-y-3">
                {Array.from({ length: sectionIndex === 0 ? 3 : 2 }).map((__, rowIndex) => (
                  <div key={rowIndex} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-40 rounded-[4px]" />
                      <Skeleton className="h-3 w-64 max-w-full rounded-[4px]" />
                    </div>
                    <Skeleton className="h-9 rounded-[4px]" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}
