import React from 'react';
import { FlagIcon as Target, DocumentDuplicateIcon as Copy, CheckIcon as Check, LockClosedIcon as Lock } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreBadge } from '@/components/ui/score-color';
import { formatScoreWithGrade } from '@/lib/scoreUtils';
import type { ApplicantJobMatchLike } from '../full-applicant-detail-utils';
import {
  getJobMatchDisplayTitle,
  getJobMatchFitScore,
  getJobMatchPosition,
  getJobMatchReasons,
  type JobMatchPosition,
} from './job-match-tab-utils';
import type { Position } from '@/lib/types';

type JobMatchCardProps = {
  canManageJobMatches: boolean;
  copiedJobMatchIndex: number | null;
  index: number;
  match: ApplicantJobMatchLike;
  onCopyJobMatch: (match: ApplicantJobMatchLike, index: number) => void;
  onJobMatchClick: (jobMatch: ApplicantJobMatchLike) => void;
  orgLogoUrl?: string | null;
  positions: Position[];
};

export function JobMatchesAccessDeniedCard() {
  return (
    <JobMatchesShell matchCount={0} showCount={false}>
      <div className="text-center py-8 text-muted-foreground">
        <Lock className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Access Denied</p>
        <p className="text-sm">You don't have permission to view job matches.</p>
        <p className="text-xs mt-2">Contact your administrator to request access.</p>
      </div>
    </JobMatchesShell>
  );
}

export function JobMatchesEmptyState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
      <p>No job matches found.</p>
      <p className="text-sm">The system will automatically find matching positions based on the Applicant's profile.</p>
    </div>
  );
}

export function JobMatchesShell({
  children,
  matchCount,
  showCount = true,
}: {
  children: React.ReactNode;
  matchCount: number;
  showCount?: boolean;
}) {
  return (
    <div className="space-y-4">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Job Matches
            {showCount && matchCount > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({matchCount})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">{children}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export function JobMatchCard({
  canManageJobMatches,
  copiedJobMatchIndex,
  index,
  match,
  onCopyJobMatch,
  onJobMatchClick,
  orgLogoUrl,
  positions,
}: JobMatchCardProps) {
  const position = getJobMatchPosition(positions, match);
  const displayTitle = getJobMatchDisplayTitle(position, match);
  const fitScore = getJobMatchFitScore(match);
  const matchReasons = getJobMatchReasons(match);

  return (
    <Card
      className={`p-4 transition-shadow relative group ${canManageJobMatches ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={canManageJobMatches ? () => onJobMatchClick(match) : undefined}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <JobMatchTitle displayTitle={displayTitle} orgLogoUrl={orgLogoUrl} />
          <div className="flex items-center gap-2">
            {fitScore !== null && (
              <ScoreBadge score={fitScore}>
                {formatScoreWithGrade(fitScore)}
              </ScoreBadge>
            )}
            {canManageJobMatches && (
              <CopyJobMatchButton
                copied={copiedJobMatchIndex === index}
                onCopy={(event) => {
                  event.stopPropagation();
                  onCopyJobMatch(match, index);
                }}
              />
            )}
          </div>
        </div>

        {matchReasons.length > 0 && <JobMatchReasons reasons={matchReasons} />}
        {position && <JobMatchPositionMeta position={position} />}
      </div>
    </Card>
  );
}

function JobMatchTitle({ displayTitle, orgLogoUrl }: { displayTitle: string; orgLogoUrl?: string | null }) {
  return (
    <h4 className="font-semibold flex items-center gap-2">
      {orgLogoUrl && (
        <img
          src={orgLogoUrl}
          alt="Logo"
          className="h-5 w-5 object-contain flex-shrink-0 rounded-sm"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      )}
      <span>{displayTitle}</span>
    </h4>
  );
}

function CopyJobMatchButton({ copied, onCopy }: { copied: boolean; onCopy: React.MouseEventHandler<HTMLButtonElement> }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onCopy}
      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      title="Copy job match information"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

function JobMatchReasons({ reasons }: { reasons: string[] }) {
  return (
    <div className="mt-3">
      <h5 className="text-sm font-medium text-muted-foreground mb-2">Match Reasons:</h5>
      <div className="space-y-2">
        {reasons.map((reason, reasonIndex) => (
          <div
            key={`${reason}-${reasonIndex}`}
            className="text-sm text-foreground px-3 py-2 rounded shadow-sm bg-muted"
          >
            {reason.trim()}
          </div>
        ))}
      </div>
    </div>
  );
}

function JobMatchPositionMeta({ position }: { position: JobMatchPosition }) {
  return (
    <div className="mt-3 text-sm text-muted-foreground">
      <div className="grid grid-cols-2 gap-4">
        {position.department && (
          <div>
            <span className="font-medium">Department:</span> {position.department}
          </div>
        )}
        {position.location && (
          <div>
            <span className="font-medium">Location:</span> {position.location}
          </div>
        )}
      </div>
    </div>
  );
}
