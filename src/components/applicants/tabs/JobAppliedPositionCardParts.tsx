import {
  BanknotesIcon as Banknote,
  BriefcaseIcon as Briefcase,
  CheckIcon as Check,
  CheckCircleIcon,
  DocumentDuplicateIcon as Copy,
  InformationCircleIcon as Info,
  PencilSquareIcon as Edit2,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/ui/button';
import { getScoreGrade } from '@/lib/scoreUtils';
import type { CompanyReference, Position } from '@/lib/types';
import type { UseFormRegister } from 'react-hook-form';
import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';
import {
  formatJobAppliedExpectedSalary,
  getJobAppliedJustificationTone,
} from './job-applied-tab-utils';

export function JobAppliedCopyButton({
  copiedJobApplied,
  onCopyJobApplied,
}: {
  copiedJobApplied: boolean;
  onCopyJobApplied: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={(event) => {
        event.stopPropagation();
        onCopyJobApplied();
      }}
      className="h-8 w-8 p-0"
      title="Copy job applied information"
    >
      {copiedJobApplied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

export function JobAppliedEmptyState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Briefcase className="mx-auto h-12 w-12 mb-4 opacity-50" />
      <p>No position applied for.</p>
      <p className="text-sm">Click "Edit" to select the position this Applicant applied for.</p>
    </div>
  );
}

export function JobAppliedPositionHeader({
  appliedFitScore,
  appliedPosition,
}: {
  appliedFitScore: number | null;
  appliedPosition: Position | null;
  company?: CompanyReference | null;
  orgLogoUrl?: string | null;
}) {
  const normalizedScore = appliedFitScore === null || appliedFitScore === undefined
    ? null
    : Math.max(0, Math.min(100, appliedFitScore <= 1 ? Math.round(appliedFitScore * 100) : Math.round(appliedFitScore)));
  const scoreGrade = getScoreGrade(appliedFitScore);
  const positionGrade = appliedPosition?.grade?.label || appliedPosition?.grade?.name || appliedPosition?.positionLevel || 'Not specified';

  return (
    <div className="grid gap-5 px-5 py-6 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center sm:px-6">
      <div className="relative grid h-24 w-24 place-items-center rounded-full bg-muted/40" aria-label={normalizedScore === null ? 'Match score unavailable' : `${normalizedScore}% match`}>
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="43" fill="none" stroke="hsl(var(--border))" strokeWidth="7" />
          <circle cx="50" cy="50" r="43" fill="none" stroke="hsl(var(--primary))" strokeWidth="7" strokeLinecap="round" pathLength="100" strokeDasharray={`${normalizedScore ?? 0} 100`} />
        </svg>
        <div className="relative text-center">
          <span className="block text-2xl font-bold tracking-tight text-foreground">{normalizedScore === null ? '—' : `${normalizedScore}%`}</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Match</span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Applied position</p>
        <h4 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">{appliedPosition?.title || 'Unknown Position'}</h4>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Grade</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{positionGrade}{scoreGrade ? ` · Match ${scoreGrade}` : ''}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Department</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{appliedPosition?.department || 'Not specified'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobAppliedSalaryRow({
  expectedSalary,
  isEditing,
  onEditSalary,
  register,
}: {
  expectedSalary?: number | null;
  isEditing: boolean;
  onEditSalary: () => void;
  register?: UseFormRegister<EditApplicantFormValues>;
}) {
  return (
    <div
      className="flex items-center gap-2 text-sm text-muted-foreground"
      onClick={(event) => event.stopPropagation()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      <Banknote className="h-3.5 w-3.5" />
      {isEditing && register ? (
        <div className="flex items-center gap-2 flex-1 max-w-[200px]">
          <span className="text-xs">THB</span>
          <input
            {...register('expectedSalary')}
            type="number"
            placeholder="Expected Salary"
            className="h-7 w-full bg-background/50 border border-input/50 rounded px-2 text-xs focus:ring-1 focus:ring-primary"
          />
        </div>
      ) : (
        <>
          <span>Expected: {formatJobAppliedExpectedSalary(expectedSalary)}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-muted rounded-full ml-1"
            onClick={(event) => {
              event.stopPropagation();
              onEditSalary();
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
}

export function JobAppliedJustifications({ justifications }: { justifications: string[] }) {
  if (justifications.length === 0) {
    return null;
  }

  return (
    <div>
      <h5 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Info className="h-3 w-3" />
        Match justification
      </h5>
      <div className="space-y-2">
        {justifications.map((sentence, index) => {
          const tone = getJobAppliedJustificationTone(sentence);
          const ToneIcon = tone === 'negative' ? XCircleIcon : CheckCircleIcon;

          return (
            <div
              key={`${sentence}-${index}`}
              className="flex items-start gap-2.5 border-b border-border/70 py-2.5 text-sm leading-6 text-foreground last:border-b-0"
            >
              <ToneIcon
                aria-hidden="true"
                className={tone === 'negative'
                  ? 'mt-0.5 h-4 w-4 shrink-0 text-red-600'
                  : 'mt-0.5 h-4 w-4 shrink-0 text-emerald-600'}
              />
              <span className="min-w-0">{sentence}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
