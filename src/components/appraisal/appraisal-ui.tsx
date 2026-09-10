"use client";

import * as React from 'react';
import {
  AlertCircle,
  Check,
  Clock3,
  Loader2,
  LockKeyhole,
  RefreshCw,
} from 'lucide-react';

import { HrisEmptyState, HrisStatusBadge } from '@/components/hris/HrisWorkspacePrimitives';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalization } from '@/contexts/LocalizationContext';
import { cn } from '@/lib/utils';

export function AppraisalStatusBadge({ status, className }: { status: unknown; className?: string }) {
  return <HrisStatusBadge value={status || 'not_started'} className={cn('min-h-6 px-2.5 text-[11px] font-bold', className)} />;
}

export function AppraisalProgress({ value, label }: { value: number; label?: string }) {
  const { t } = useLocalization();
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-300">{label || t('appraisal.ui.labels.reviewProgress', 'Review progress')}</span>
        <span className="tabular-nums text-slate-500">{safeValue}%</span>
      </div>
      <Progress value={safeValue} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

export function AppraisalMetric({
  label,
  value,
  helper,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
  emphasis?: 'neutral' | 'attention' | 'positive';
}) {
  return (
    <div className="min-w-0 border-l border-slate-200 pl-4 first:border-l-0 first:pl-0 dark:border-slate-800 sm:first:border-l sm:first:pl-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className={cn(
        'mt-1 text-2xl font-bold tracking-[-0.04em] tabular-nums text-slate-950 dark:text-slate-50',
        emphasis === 'attention' && 'text-amber-700 dark:text-amber-300',
        emphasis === 'positive' && 'text-emerald-700 dark:text-emerald-300',
      )}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

export function AppraisalSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('border border-border bg-background', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-bold tracking-[-0.01em] text-slate-950 dark:text-slate-50">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function RatingScale({
  value,
  label,
  guidance,
}: {
  value: number | null | undefined;
  label?: string | null;
  guidance?: string | null;
}) {
  const { t } = useLocalization();
  if (value == null || Number.isNaN(Number(value))) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <LockKeyhole className="h-4 w-4" aria-hidden />
        {t('appraisal.ui.labels.ratingUnavailable', 'Rating not available at this review stage')}
      </div>
    );
  }
  const numeric = Number(value);
  return (
    <div className="grid gap-3 sm:grid-cols-[88px_1fr] sm:items-center">
      <div>
        <p className="text-3xl font-bold tracking-[-0.05em] tabular-nums text-[#284a73] dark:text-blue-200">{numeric.toFixed(1)}</p>
        <p className="text-xs font-semibold text-slate-500">{label || t('appraisal.ui.labels.calculatedScore', 'Calculated score')}</p>
      </div>
      <div>
        <div className="relative h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="absolute inset-y-0 left-0 rounded-full bg-[#cc7a3b]" style={{ width: `${Math.min(100, Math.max(0, numeric))}%` }} />
        </div>
        {guidance ? <p className="mt-2 text-xs leading-5 text-slate-500">{guidance}</p> : null}
      </div>
    </div>
  );
}

export function AppraisalEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return <div className="border border-dashed border-slate-300 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/30"><HrisEmptyState title={title} description={description} action={action} /></div>;
}

export function AppraisalError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLocalization();
  return (
    <div role="alert" className="flex flex-col gap-3 border border-rose-200 bg-rose-50 p-4 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-bold">{t('appraisal.ui.labels.actionFailed', 'Appraisal could not complete that request')}</p>
          <p className="mt-0.5 text-sm">{message}</p>
        </div>
      </div>
      <Button variant="outline" className="min-h-11 shrink-0 border-rose-300 bg-transparent" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />{t('appraisal.ui.labels.tryAgain', 'Try again')}
      </Button>
    </div>
  );
}

export function AppraisalLoading() {
  const { t } = useLocalization();
  return (
    <main className="min-h-full w-full bg-background px-3 py-4 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="grid min-h-[60vh] items-stretch border-y border-border lg:grid-cols-[280px_minmax(0,1fr)]" aria-label={t('appraisal.ui.aria.loading', 'Loading Appraisal workspace')}>
        <div className="hidden border-r border-border p-4 lg:block">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-3 h-4 w-24" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-14 w-full rounded-lg" />)}
          </div>
        </div>
        <div className="min-w-0">
          <div className="border-b border-border p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Skeleton className="h-3 w-28" />
                <Skeleton className="mt-3 h-8 w-64" />
                <Skeleton className="mt-2 h-4 w-96 max-w-full" />
              </div>
              <Loader2 className="h-6 w-6 animate-spin text-[#284a73]" aria-hidden />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-none" />
          <Skeleton className="m-5 h-64 rounded-none" />
        </div>
      </div>
    </main>
  );
}

export function ReviewTimeline({
  status,
  released,
}: {
  status: unknown;
  released?: boolean;
}) {
  const { t } = useLocalization();
  const steps = [
    { key: 'self', label: t('appraisal.ui.timeline.self', 'Self-assessment'), statuses: ['self_assessment_in_progress', 'awaiting_manager_review', 'manager_review_in_progress', 'awaiting_calibration', 'awaiting_final_approval', 'ready_for_release', 'released', 'acknowledged'] },
    { key: 'manager', label: t('appraisal.ui.timeline.manager', 'Manager review'), statuses: ['manager_review_in_progress', 'awaiting_calibration', 'awaiting_final_approval', 'ready_for_release', 'released', 'acknowledged'] },
    { key: 'calibration', label: t('appraisal.ui.timeline.calibration', 'Calibration & approval'), statuses: ['awaiting_calibration', 'calibration_in_progress', 'awaiting_final_approval', 'ready_for_release', 'released', 'acknowledged'] },
    { key: 'release', label: t('appraisal.ui.timeline.release', 'Result release'), statuses: ['released', 'acknowledgment_pending', 'acknowledged', 'disputed'] },
  ];
  const current = String(status || 'not_started');
  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label={t('appraisal.ui.aria.workflow', 'Appraisal workflow')}>
      {steps.map((step, index) => {
        const done = step.statuses.includes(current) || (released && step.key === 'release');
        return (
          <li key={step.key} className="flex items-center gap-2 sm:block">
            <div className={cn(
              'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold',
              done ? 'border-[#284a73] bg-[#284a73] text-white' : 'border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950',
            )}>
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
            </div>
            <p className="text-xs font-semibold text-slate-600 sm:mt-2 dark:text-slate-300">{step.label}</p>
          </li>
        );
      })}
    </ol>
  );
}

export function DueDate({ value, label }: { value: unknown; label?: string }) {
  const { t } = useLocalization();
  if (!value) return null;
  const date = new Date(String(value));
  const overdue = date.getTime() < Date.now();
  const dueLabel = label || t('appraisal.ui.labels.dueDate', 'Due');
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500', overdue && 'text-rose-700 dark:text-rose-300')}>
      <Clock3 className="h-3.5 w-3.5" aria-hidden />
      {overdue ? t('appraisal.ui.labels.overdue', 'Overdue') : dueLabel} {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)}
    </span>
  );
}
