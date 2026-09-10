"use client";

import { DashboardHeadcountStatusCard, type DashboardHeadcountSummary } from './DashboardHeadcountStatusCard';

export function DashboardHeadcountSection({
  headcountData,
  headcountLoading,
  onPositionClick,
  onCreateHeadcount,
}: {
  headcountData: DashboardHeadcountSummary[];
  headcountLoading: boolean;
  onPositionClick: (positionId: string) => void;
  onCreateHeadcount: () => void;
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1">
        <DashboardHeadcountStatusCard
          headcountData={headcountData}
          isLoading={headcountLoading}
          onPositionClick={onPositionClick}
          onCreateHeadcount={onCreateHeadcount}
        />
      </div>
    </div>
  );
}
