import { Ban, Eye, Pin as PinIcon } from 'lucide-react';

import { BlacklistBadge } from '@/components/applicants/BlacklistBadge';
import { StatusBadge } from '@/components/applicants/applicant-kanban-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreBadge } from '@/components/ui/score-color';
import { TableCell } from '@/components/ui/table';
import type { Applicant } from '@/lib/types';
import { formatScoreWithGrade } from '@/lib/scoreUtils';
import { cn } from '@/lib/utils';

export function ApplicantNameCell({
  applicant,
  onApplicantClick,
}: {
  applicant: Applicant;
  onApplicantClick: (applicantId: string) => void;
}) {
  const isUnread = applicant.isRead !== true;

  return (
    <TableCell>
      <div>
        <div
          className={cn(
            'cursor-pointer hover:underline flex items-center gap-2',
            applicant.isBlacklisted
              ? 'text-destructive'
              : applicant.isPinned
                ? 'text-amber-600 dark:text-amber-500 font-medium'
                : isUnread
                  ? 'font-bold text-blue-600 dark:text-blue-400'
                  : 'font-medium text-foreground',
          )}
          onClick={() => onApplicantClick(applicant.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
        >
          {applicant.name}
          {applicant.isPinned && <PinIcon className="inline-block h-3.5 w-3.5 text-amber-500 fill-current rotate-45" />}
          {applicant.isBlacklisted && <Ban className="h-3 w-3 text-destructive" />}
        </div>
        <div className="text-xs text-muted-foreground">{applicant.email}</div>
      </div>
    </TableCell>
  );
}

export function ApplicantFitScoreCell({ applicant }: { applicant: Applicant }) {
  return (
    <TableCell>
      {applicant.fitScore !== undefined && applicant.fitScore !== null ? (
        <ScoreBadge score={applicant.fitScore}>
          {formatScoreWithGrade(applicant.fitScore)}
        </ScoreBadge>
      ) : (
        <Badge variant="outline">No Score</Badge>
      )}
    </TableCell>
  );
}

export function ApplicantExpectedSalaryCell({ applicant }: { applicant: Applicant }) {
  return (
    <TableCell>
      {applicant.expectedSalary ? (
        <span className="text-sm font-medium">THB {applicant.expectedSalary.toLocaleString()}</span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      )}
    </TableCell>
  );
}

export function ApplicantStatusCell({
  applicant,
  stageNames,
}: {
  applicant: Applicant;
  stageNames: Record<string, string>;
}) {
  return (
    <TableCell>
      {applicant.isBlacklisted ? (
        <BlacklistBadge />
      ) : (
        <StatusBadge statusId={applicant.statusId} stageNames={stageNames} />
      )}
    </TableCell>
  );
}

export function ApplicantAppliedDateCell({ applicant }: { applicant: Applicant }) {
  return (
    <TableCell>
      {applicant.applicationDate ? (
        <div className="text-sm">
          {new Date(applicant.applicationDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">N/A</span>
      )}
    </TableCell>
  );
}

export function ApplicantActionsCell({
  applicant,
  onApplicantClick,
  onPinToggle,
  showPin = true,
}: {
  applicant: Applicant;
  onApplicantClick: (applicantId: string) => void;
  onPinToggle?: (applicant: Applicant) => Promise<void>;
  showPin?: boolean;
}) {
  return (
    <TableCell>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onApplicantClick(applicant.id)}
          className="hover:bg-primary/10"
        >
          <Eye className="h-4 w-4" />
          <span className="ml-1 text-xs">View</span>
        </Button>
        {showPin && onPinToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={async (event) => {
              event.preventDefault();
              event.stopPropagation();
              await onPinToggle(applicant);
            }}
            title={applicant.isPinned ? 'Unpin' : 'Pin'}
            className="hover:bg-primary/10"
          >
            {applicant.isPinned ? (
              <PinIcon className="h-4 w-4 text-amber-500 fill-current rotate-45" />
            ) : (
              <PinIcon className="h-4 w-4 text-muted-foreground rotate-45" />
            )}
          </Button>
        )}
      </div>
    </TableCell>
  );
}
