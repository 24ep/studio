"use client";

import type { ReactNode } from 'react';
import {
  AcademicCapIcon as GraduationCap,
  BriefcaseIcon as Briefcase,
  ClockIcon as Clock,
  PaperClipIcon as Paperclip,
  UserIcon as User,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';

interface FullApplicantDetailTabsNavProps {
  activeTab: string;
  isJobMatchEnabled: boolean;
  jobMatchCount: number;
  educationCount: number;
  experienceDuration: string;
  onTabChange: (tab: string) => void;
  reviewMode?: boolean;
}

interface DetailTabButtonProps {
  tab: string;
  activeTab: string;
  label: string;
  countLabel?: string;
  icon: ReactNode;
  onTabChange: (tab: string) => void;
  reviewMode?: boolean;
}

function DetailTabButton({
  tab,
  activeTab,
  label,
  countLabel,
  icon,
  onTabChange,
  reviewMode = false,
}: DetailTabButtonProps) {
  const isActive = activeTab === tab;

  return (
    <div
      className={cn(
        getUnderlineNavTriggerClassName(isActive),
        reviewMode
          ? 'flex-none justify-center px-4 py-4 text-sm font-medium min-w-max'
          : 'justify-center px-4 py-4 text-xs flex-1 md:flex-1 min-w-max md:min-w-0',
      )}
      onClick={() => onTabChange(tab)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onTabChange(tab);
        }
      }}
    >
      {!reviewMode && icon}
      {label}
      {countLabel}
    </div>
  );
}

export function FullApplicantDetailTabsNav({
  activeTab,
  isJobMatchEnabled,
  jobMatchCount,
  educationCount,
  experienceDuration,
  onTabChange,
  reviewMode = false,
}: FullApplicantDetailTabsNavProps) {
  return (
    <div
      className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent md:overflow-x-visible md:pb-0 md:mx-0 md:px-0"
      style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex w-full bg-background border-b border-border flex-shrink-0 min-w-max md:min-w-0">
        <DetailTabButton
          tab="jobs"
          activeTab={activeTab}
          label={isJobMatchEnabled ? 'Job Applied & Matched' : 'Job Applied'}
          countLabel={isJobMatchEnabled && jobMatchCount > 0 ? ` (${jobMatchCount})` : undefined}
          icon={<Briefcase className="w-4 h-4" />}
          onTabChange={onTabChange}
          reviewMode={reviewMode}
        />
        <DetailTabButton
          tab="applicant-info"
          activeTab={activeTab}
          label="Applicant Info"
          icon={<User className="w-4 h-4" />}
          onTabChange={onTabChange}
          reviewMode={reviewMode}
        />
        <DetailTabButton
          tab="education"
          activeTab={activeTab}
          label="Education"
          countLabel={educationCount > 0 ? ` (${educationCount})` : undefined}
          icon={<GraduationCap className="w-4 h-4" />}
          onTabChange={onTabChange}
          reviewMode={reviewMode}
        />
        <DetailTabButton
          tab="experience"
          activeTab={activeTab}
          label="Experience"
          countLabel={experienceDuration ? ` (${experienceDuration})` : undefined}
          icon={<Clock className="w-4 h-4" />}
          onTabChange={onTabChange}
          reviewMode={reviewMode}
        />
        <DetailTabButton
          tab="attachments"
          activeTab={activeTab}
          label="Attachments"
          icon={<Paperclip className="w-4 h-4" />}
          onTabChange={onTabChange}
          reviewMode={reviewMode}
        />
      </div>
    </div>
  );
}
