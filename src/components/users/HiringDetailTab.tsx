import React from 'react';

import { ApplicantProfileCard, HeadcountAssignmentCard, MatchInfoBanner } from './HiringDetailTabCards';
import { HiringDetailEmptyState, HiringDetailErrorState, HiringDetailLoadingState } from './HiringDetailTabStates';
import type { HiringDetailTabProps } from './hiring-detail-types';
import { hasHiringDetails } from './hiring-detail-utils';
import { useHiringDetails } from './use-hiring-details';

export function HiringDetailTab({ userId }: HiringDetailTabProps) {
  const { data, loading, error } = useHiringDetails(userId);

  if (loading) {
    return <HiringDetailLoadingState />;
  }

  if (error) {
    return <HiringDetailErrorState error={error} />;
  }

  if (!hasHiringDetails(data)) {
    return <HiringDetailEmptyState />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <MatchInfoBanner matchCriteria={data.matchCriteria} />
      <div className="grid grid-cols-1 gap-6">
        {data.headcount && <HeadcountAssignmentCard headcount={data.headcount} />}
        {data.applicant && <ApplicantProfileCard applicant={data.applicant} />}
      </div>
    </div>
  );
}
