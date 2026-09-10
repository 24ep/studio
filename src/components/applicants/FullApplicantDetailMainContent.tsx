"use client";

import type { ComponentProps, FormEventHandler, Key } from 'react';
import { ApplicantSidebar } from './ApplicantSidebar';
import { ApplicantTabsContent } from './ApplicantTabsContent';
import { FullApplicantDetailTabsNav } from './FullApplicantDetailTabsNav';
import { cn } from '@/lib/utils';

interface FullApplicantDetailMainContentProps {
  activeTab: string;
  educationCount: number;
  experienceDuration: string;
  isJobMatchEnabled: boolean;
  isMobile: boolean;
  jobMatchCount: number;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onTabChange: (tab: string) => void;
  showSidebar?: boolean;
  reviewMode?: boolean;
  sidebarProps: ComponentProps<typeof ApplicantSidebar>;
  tabsContentKey?: Key;
  tabsContentProps: ComponentProps<typeof ApplicantTabsContent>;
}

export function FullApplicantDetailMainContent({
  activeTab,
  educationCount,
  experienceDuration,
  isJobMatchEnabled,
  isMobile,
  jobMatchCount,
  onSubmit,
  onTabChange,
  showSidebar = true,
  reviewMode = false,
  sidebarProps,
  tabsContentKey,
  tabsContentProps,
}: FullApplicantDetailMainContentProps) {
  const detailContent = (
    <div className="w-full h-full flex flex-col min-h-0 pointer-events-auto">
      <FullApplicantDetailTabsNav
        activeTab={activeTab}
        isJobMatchEnabled={isJobMatchEnabled}
        jobMatchCount={jobMatchCount}
        educationCount={educationCount}
        experienceDuration={experienceDuration}
        onTabChange={onTabChange}
        reviewMode={reviewMode}
      />

      <div className={cn(
        "flex-1 overflow-y-auto bg-background h-full pointer-events-auto",
        isMobile ? "p-4 pb-48" : reviewMode ? "bg-slate-50/70 p-6" : "p-6",
      )}>
        <form id="applicant-edit-form" onSubmit={onSubmit} className="h-full">
          <ApplicantTabsContent key={tabsContentKey} {...tabsContentProps} />
        </form>
      </div>
    </div>
  );

  if (!showSidebar) {
    return (
      <div className="flex-1 min-h-0 bg-background">
        {detailContent}
      </div>
    );
  }

  return (
    <div className={cn(
      "grid grid-cols-1 flex-1 min-h-0 bg-transparent",
      isMobile
        ? "gap-3 p-3"
        : "lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)] gap-4 p-4 pt-3"
    )}>
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-lg flex flex-col min-h-0 pointer-events-auto">
        {detailContent}
      </div>

      <div className={cn(
        "overflow-hidden rounded-xl border border-border bg-background shadow-lg flex flex-col min-h-0 pointer-events-auto",
        isMobile ? "pb-48" : ""
      )}>
        <ApplicantSidebar {...sidebarProps} />
      </div>
    </div>
  );
}
