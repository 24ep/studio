"use client";

import {
  BriefcaseIcon as Briefcase,
  ChatBubbleLeftRightIcon as MessageSquare,
  DocumentTextIcon as FileText,
  UserIcon as User,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { getUnderlineNavTriggerClassName } from '@/components/ui/underline-nav';

export type MobileApplicantDetailTab = 'job-applied' | 'applicant-info' | 'attachments' | 'comments';

interface MobileApplicantTabsNavProps {
  activeTab: MobileApplicantDetailTab;
  attachmentsCount: number;
  commentsCount: number;
  onTabChange: (tab: MobileApplicantDetailTab) => void;
}

const tabIconMap = {
  'job-applied': Briefcase,
  'applicant-info': User,
  attachments: FileText,
  comments: MessageSquare,
};

export function MobileApplicantTabsNav({
  activeTab,
  attachmentsCount,
  commentsCount,
  onTabChange,
}: MobileApplicantTabsNavProps) {
  const tabs: Array<{ value: MobileApplicantDetailTab; label: string }> = [
    { value: 'job-applied', label: 'Job Applied' },
    { value: 'applicant-info', label: 'Applicant Info' },
    { value: 'attachments', label: `Attachments (${attachmentsCount})` },
    { value: 'comments', label: `Comments (${commentsCount})` },
  ];

  return (
    <div className="overflow-x-auto border-b border-border/50 flex-shrink-0">
      <div className="flex w-full min-w-max">
        {tabs.map((tab) => {
          const Icon = tabIconMap[tab.value];
          return (
            <div
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                getUnderlineNavTriggerClassName(activeTab === tab.value),
                "px-6 py-3 flex-shrink-0 touch-manipulation",
              )}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onTabChange(tab.value);
                }
              }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
