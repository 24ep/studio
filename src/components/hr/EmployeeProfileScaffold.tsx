"use client";

import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Shared page structure for HR employee detail and employee self-service profile.
 * Keeping the chrome here prevents the two profile experiences from drifting.
 */
export function EmployeeProfileScaffold({
  header,
  navigation,
  children,
  sidebarNavigation,
  sidebar,
  className,
}: {
  header: React.ReactNode;
  navigation: React.ReactNode;
  children: React.ReactNode;
  sidebarNavigation?: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn('flex h-full min-h-[calc(100vh-4rem)] w-full flex-col bg-background text-foreground', className)}>
      {header}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 bg-muted/10 p-3 sm:gap-4 sm:p-4 sm:pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          {navigation}
          <div className="flex-1 overflow-y-auto bg-background p-4 pb-20 sm:p-6">
            {children}
          </div>
        </section>
        <aside className="flex min-h-[360px] flex-col overflow-hidden lg:min-h-0">
          {sidebarNavigation}
          <div className="flex-1 overflow-y-auto">{sidebar}</div>
        </aside>
      </div>
    </main>
  );
}
