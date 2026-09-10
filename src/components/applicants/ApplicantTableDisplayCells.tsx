"use client";

import { Pin as PinIcon } from 'lucide-react';

import { ScoreBadge } from '@/components/ui/score-color';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Applicant } from '@/lib/types';
import { BlacklistBadge } from './BlacklistBadge';
import { StatusBadge } from './applicant-kanban-utils';
import {
  displayApplicantFitScoreWithGrade,
  displayApplicantTableDate,
} from './applicant-table-row-utils';

export function ApplicantPinCell({
  applicant,
  onTogglePin,
}: {
  applicant: Applicant;
  onTogglePin: () => void;
}) {
  return (
    <TableCell key={`${applicant.id}-pin`} className="text-center w-12 min-w-[48px]">
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onTogglePin();
        }}
        className={cn(
          'p-1 rounded hover:bg-muted transition-colors',
          applicant.isPinned ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground',
        )}
        title={applicant.isPinned ? 'Unpin applicant' : 'Pin applicant to top'}
      >
        {applicant.isPinned ? (
          <PinIcon className="h-4 w-4 text-amber-500 fill-current" />
        ) : (
          <PinIcon className="h-4 w-4 text-foreground" />
        )}
      </button>
    </TableCell>
  );
}

export function ApplicantJobMatchesCell({ applicant }: { applicant: Applicant }) {
  return (
    <TableCell key={`${applicant.id}-job-matches-count`} className="text-center min-w-[96px] max-w-[120px]">
      {Array.isArray(applicant.jobMatches) && applicant.jobMatches.length > 0 ? applicant.jobMatches.length : '-'}
    </TableCell>
  );
}

export function ApplicantFitScoreCell({ applicant }: { applicant: Applicant }) {
  return (
    <TableCell key={`${applicant.id}-fit-score`} className="hidden sm:table-cell min-w-[80px] max-w-[120px]">
      {applicant.fitScore !== undefined && applicant.fitScore !== null ? (
        <ScoreBadge score={applicant.fitScore} className="rounded-full">
          {displayApplicantFitScoreWithGrade(applicant.fitScore)}
        </ScoreBadge>
      ) : (
        <span className="text-xs text-muted-foreground">No job applied</span>
      )}
    </TableCell>
  );
}

export function ApplicantStatusCell({
  applicant,
  stageColors,
  stageNames,
}: {
  applicant: Applicant;
  stageColors: Record<string, string>;
  stageNames: Record<string, string>;
}) {
  if (applicant.isBlacklisted) {
    return (
      <TableCell key={`${applicant.id}-status`} className="min-w-[100px] max-w-[150px]">
        <BlacklistBadge className="px-2.5" />
      </TableCell>
    );
  }

  return (
    <TableCell key={`${applicant.id}-status`} className="min-w-[100px] max-w-[150px]">
      <StatusBadge statusId={applicant.statusId} className="capitalize" stageNames={stageNames} stageColors={stageColors} />
    </TableCell>
  );
}

export function ApplicantDateCell({
  applicant,
  className,
  dateValue,
  idSuffix,
}: {
  applicant: Applicant;
  className: string;
  dateValue: string | null | undefined;
  idSuffix: string;
}) {
  return (
    <TableCell key={`${applicant.id}-${idSuffix}`} className={className}>
      {displayApplicantTableDate(dateValue)}
    </TableCell>
  );
}
