"use client";

import { AppraisalProgress } from './appraisal-ui';
import { useLocalization } from '@/contexts/LocalizationContext';
import { cn } from '@/lib/utils';

type Row = Record<string, unknown>;

export function GoalRow({ goal }: { goal: Row }) {
  const { t } = useLocalization();
  return (
    <div className="grid gap-3 border-b border-slate-200 pb-3 last:border-b-0 dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
      <div><p className="text-sm font-bold">{String(goal.title)}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{String(goal.description || t('appraisal.myAppraisals.noGoalDescription', 'No description'))}</p></div>
      <AppraisalProgress value={Number(goal.progress || 0)} label={label(goal.status)} />
    </div>
  );
}

export function PulseRow({ label: itemLabel, value, helper, attention }: { label: string; value: number; helper: string; attention?: boolean }) {
  return <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">{itemLabel}</p><p className="mt-0.5 text-xs text-slate-500">{helper}</p></div><span className={cn('text-xl font-bold tabular-nums', attention && 'text-rose-700 dark:text-rose-300')}>{value}</span></div>;
}

export function isComplete(row: Row) {
  return Boolean(row.releasedAt || row.completedAt || ['released', 'acknowledged', 'completed', 'closed'].includes(String(row.status)));
}

export function canEditSelf(row: Row) {
  return ['not_started', 'awaiting_employee_submission', 'self_assessment_in_progress', 'returned_for_revision'].includes(String(row.status));
}

export function canEditManager(row: Row) {
  return ['awaiting_manager_review', 'manager_review_in_progress', 'returned_for_revision'].includes(String(row.status));
}

export function reviewProgress(row: Row) {
  const status = String(row.status);
  const values: Record<string, number> = {
    not_started: 0,
    awaiting_employee_submission: 10,
    self_assessment_in_progress: 25,
    awaiting_manager_review: 40,
    manager_review_in_progress: 55,
    awaiting_peer_review: 60,
    awaiting_calibration: 70,
    calibration_in_progress: 78,
    awaiting_final_approval: 85,
    ready_for_release: 92,
    released: 96,
    acknowledgment_pending: 96,
    discussion_requested: 96,
    disputed: 96,
    acknowledged: 100,
    completed: 100,
    closed: 100,
  };
  return values[status] ?? 0;
}

export function nextDue(row: Row) {
  return ['not_started', 'awaiting_employee_submission', 'self_assessment_in_progress'].includes(String(row.status))
    ? row.selfDueDate
    : row.managerDueDate;
}

export function nextEmployeeInstruction(row: Row, t: (key: string, fallback: string) => string) {
  if (row.releasedAt) return t('appraisal.overview.employeeInstructionReleased', 'Your final review is available. Read the result and acknowledge receipt or request a discussion.');
  if (canEditSelf(row)) return t('appraisal.overview.employeeInstructionComplete', 'Complete your structured self-assessment before the configured deadline.');
  return t('appraisal.overview.employeeInstructionOngoing', 'Your appraisal is moving through manager review, calibration, and approval. Final results stay private until release.');
}

export function nextManagerInstruction(row: Row, t: (key: string, fallback: string) => string) {
  if (canEditManager(row)) return t('appraisal.overview.managerInstructionReview', 'Review employee evidence and submit your assessment.');
  if (row.status === 'awaiting_calibration') return t('appraisal.overview.managerInstructionCalibration', 'Rating inputs are ready for calculation and calibration.');
  if (row.status === 'ready_for_release') return t('appraisal.overview.managerInstructionReadyForRelease', 'Final result passed approval and is ready for release.');
  return t('appraisal.overview.managerInstructionProgress', 'Review is progressing through the configured workflow.');
}

export function arrayValue(value: unknown): Row[] {
  if (Array.isArray(value)) return value as Row[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function numberValue(value: unknown) {
  return value == null ? null : Number(value);
}

export function rating(value: unknown) {
  return value == null || !Number.isFinite(Number(value)) ? '—' : Number(value).toFixed(1);
}

export function label(value: unknown) {
  return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

export function formatDate(value: unknown, t: (key: string, fallback: string) => string) {
  if (!value) return t('appraisal.shared.notSet', 'Not set');
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(String(value)));
}

export function formatDateTime(value: unknown, t: (key: string, fallback: string) => string) {
  if (!value) return t('appraisal.shared.dateUnavailable', 'Date unavailable');
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(String(value)));
}

export function formatYear(value: unknown, t: (key: string, fallback: string) => string) {
  return value ? new Date(String(value)).getFullYear() : t('appraisal.shared.periodFallback', 'Period');
}

export function stripIdempotency(value: string) {
  return value.replace(/\s*\[idempotency:[^\]]+\]\s*/g, '').trim();
}
