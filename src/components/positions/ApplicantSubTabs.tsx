"use client";

import { cn } from '@/lib/utils';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';

import type { PositionApplicantTab } from './ApplicantsTabTypes';

interface ApplicantSubTabsProps {
  activeApplicantTab: PositionApplicantTab;
  appliedApplicantsCount: number;
  isMobile: boolean;
  onActiveApplicantTabChange: (tab: PositionApplicantTab) => void;
  potentialApplicantsTotal: number;
}

export function ApplicantSubTabs({
  activeApplicantTab,
  appliedApplicantsCount,
  isMobile,
  onActiveApplicantTabChange,
  potentialApplicantsTotal,
}: ApplicantSubTabsProps) {
  return (
    <div className="flex w-full border-b border-border/50 mb-4 flex-shrink-0">
      <ApplicantSubTabButton
        active={activeApplicantTab === 'applied'}
        count={appliedApplicantsCount}
        isMobile={isMobile}
        label="Applied Applicants"
        onSelect={() => onActiveApplicantTabChange('applied')}
      />
      <ApplicantSubTabButton
        active={activeApplicantTab === 'potential'}
        count={potentialApplicantsTotal}
        isMobile={isMobile}
        label="Job Matches"
        onSelect={() => onActiveApplicantTabChange('potential')}
      />
    </div>
  );
}

function ApplicantSubTabButton({
  active,
  count,
  isMobile,
  label,
  onSelect,
}: {
  active: boolean;
  count: number;
  isMobile: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        getUnderlineNavTriggerClassName(active),
        isMobile ? 'px-4 py-2' : 'px-4 py-2.5',
      )}
    >
      {label} ({count})
    </button>
  );
}
