import React from 'react';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { useSession } from 'next-auth/react';
import type { Applicant, Position } from '@/lib/types';
import { hasAnyPermission } from '@/lib/permissions';
import type { ApplicantJobMatchLike } from '../full-applicant-detail-utils';
import {
  JobMatchCard,
  JobMatchesAccessDeniedCard,
  JobMatchesEmptyState,
  JobMatchesShell,
} from './JobMatchTabParts';

interface JobMatchTabProps {
  applicant: Applicant;
  allDbPositions: Position[];
  isEditing: boolean;
  applicantJobMatches: ApplicantJobMatchLike[];
  onJobMatchClick: (jobMatch: ApplicantJobMatchLike) => void;
  onCopyJobMatch: (match: ApplicantJobMatchLike, index: number) => void;
  copiedJobMatchIndex: number | null;
}

export const JobMatchTab: React.FC<JobMatchTabProps> = ({
  allDbPositions,
  applicantJobMatches,
  onJobMatchClick,
  onCopyJobMatch,
  copiedJobMatchIndex
}) => {
  const { data: session } = useSession();
  const { settings: globalSettings } = useGlobalSettings();
  const orgLogoUrl = globalSettings.organizationLogoDataUrl;

  const canViewJobMatches = hasAnyPermission(session?.user, ['JOB_MATCH_VIEW']);
  const canManageJobMatches = hasAnyPermission(session?.user, ['JOB_MATCH_MANAGE']);

  if (!canViewJobMatches) {
    return <JobMatchesAccessDeniedCard />;
  }

  return (
    <JobMatchesShell matchCount={applicantJobMatches.length}>
      {applicantJobMatches.length > 0 ? (
        <div className="grid gap-4">
          {applicantJobMatches.map((match, index) => (
            <JobMatchCard
              key={`${match.jobId || match.jobTitle || 'job-match'}-${index}`}
              canManageJobMatches={canManageJobMatches}
              copiedJobMatchIndex={copiedJobMatchIndex}
              index={index}
              match={match}
              onCopyJobMatch={onCopyJobMatch}
              onJobMatchClick={onJobMatchClick}
              orgLogoUrl={orgLogoUrl}
              positions={allDbPositions}
            />
          ))}
        </div>
      ) : (
        <JobMatchesEmptyState />
      )}
    </JobMatchesShell>
  );
};
