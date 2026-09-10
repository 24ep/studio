"use client";

import { ApplicantAvatar } from '@/components/ui/applicant-avatar';
import type { Applicant } from '@/lib/types';
import { formatApplicantName } from '@/lib/applicantUtils';
import { cn } from '@/lib/utils';
import { formatScoreWithGrade, getScoreBgColor, normalizeFitScore } from '@/lib/scoreUtils';
import { getFieldLabel } from './applicant-kanban-utils';

interface MultiRecruiterApplicantCardProps {
  applicant: Applicant;
  isDragging: boolean;
  onCardClick?: (applicant: Applicant) => void;
  onDragStart: (applicant: Applicant) => void;
  onDragEnd: () => void;
}

export function MultiRecruiterApplicantCard({
  applicant,
  isDragging,
  onCardClick,
  onDragStart,
  onDragEnd,
}: MultiRecruiterApplicantCardProps) {
  return (
    <div
      className={cn(
        "cursor-pointer group p-3 bg-card border border-border rounded-lg hover:shadow-sm transition-all duration-200",
        isDragging && "opacity-60 scale-95"
      )}
      draggable
      onDragStart={() => onDragStart(applicant)}
      onDragEnd={onDragEnd}
      onClick={() => onCardClick?.(applicant)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onCardClick?.(applicant);
        }
      }}
    >
      <ApplicantCardIdentity applicant={applicant} />
      {applicant.fitScore !== undefined && applicant.fitScore !== null && (
        <ApplicantCardFitScore fitScore={applicant.fitScore} />
      )}
    </div>
  );
}

function ApplicantCardIdentity({ applicant }: { applicant: Applicant }) {
  const applicantName = formatApplicantName(applicant);
  const positionTitle = applicant.position?.title || 'N/A';

  return (
    <div className="flex items-start gap-2">
      <ApplicantAvatar
        user={applicant}
        size="sm"
        className="h-6 w-6 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate" title={applicantName}>
          {applicantName}
        </p>
        <p className="text-xs text-muted-foreground truncate" title={positionTitle}>
          {positionTitle}
        </p>
      </div>
    </div>
  );
}

function ApplicantCardFitScore({ fitScore }: { fitScore: number }) {
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{getFieldLabel('fitScore')}</span>
        <span className="font-medium text-foreground">
          {formatScoreWithGrade(fitScore)}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1">
        <div
          className={cn("h-1 rounded-full transition-all duration-300", getScoreBgColor(fitScore))}
          style={{ width: `${normalizeFitScore(fitScore)}%` }}
        />
      </div>
    </div>
  );
}
