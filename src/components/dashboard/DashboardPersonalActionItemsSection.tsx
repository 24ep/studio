"use client";

import {
  ListChecks,
  UserPlus,
} from 'lucide-react';

import type { Applicant } from '@/lib/types';

import { DashboardApplicantListCard } from './DashboardApplicantListCard';

export function DashboardPersonalActionItemsSection({
  myActionItemsList,
  newApplicantsAssignedToMeTodayList,
  recruiterId,
  stageNames,
}: {
  myActionItemsList: Applicant[];
  newApplicantsAssignedToMeTodayList: Applicant[];
  recruiterId?: string;
  stageNames: Record<string, string>;
}) {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">My action items</h2>
        <p className="mt-1 text-sm text-muted-foreground">Applicants who need your attention.</p>
      </div>
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1">
        <DashboardApplicantListCard
          title="My Action Items"
          description="Active Applicants assigned to you requiring attention."
          applicants={myActionItemsList}
          stageNames={stageNames}
          icon={ListChecks}
          viewHref={`/applicants?query=${encodeURIComponent(`recruiterId:${recruiterId}`)}`}
          viewLabel="View My Applicants"
          emptyMessage="Your backlog is clear!"
          showAppliedDate
          colorScore
        />

        {newApplicantsAssignedToMeTodayList.length > 0 && (
          <DashboardApplicantListCard
            title="New Applicants Assigned Today"
            description="Applicants assigned to you that applied today."
            applicants={newApplicantsAssignedToMeTodayList}
            stageNames={stageNames}
            icon={UserPlus}
          />
        )}
      </div>
    </div>
  );
}
