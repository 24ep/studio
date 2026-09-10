"use client";

import * as React from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Clock3,
} from 'lucide-react';

import { HrisEmptyState, HrisStatusBadge } from '@/components/hris/HrisWorkspacePrimitives';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PerformanceStatusBadge({ status, className }: { status: unknown; className?: string }) {
  return <HrisStatusBadge value={status || 'not_started'} className={cn('px-2.5 py-1 text-[11px] font-semibold', className)} />;
}

export function WorkspaceSection({
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

export function MetricCell({
  label,
  value,
  helper,
  progress,
  tone = 'navy',
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
  progress?: number;
  tone?: 'navy' | 'teal' | 'amber' | 'rose';
}) {
  const bar = {
    navy: '[&>div]:bg-[#3459a8]',
    teal: '[&>div]:bg-emerald-600',
    amber: '[&>div]:bg-amber-500',
    rose: '[&>div]:bg-rose-500',
  }[tone];
  return (
    <div className="min-w-0 px-4 py-4 sm:px-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 truncate text-xl font-bold tabular-nums tracking-[-0.03em] text-slate-950 dark:text-slate-50">{value}</p>
      {typeof progress === 'number' ? <Progress value={progress} className={cn('mt-3 h-1.5 bg-slate-100 dark:bg-slate-800', bar)} /> : null}
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{helper}</p>
    </div>
  );
}

export function EmptyPerformanceState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return <div className="border border-dashed border-border bg-muted/20"><HrisEmptyState title={title} description={description} action={action} /></div>;
}

export function PerformanceLoadingState() {
  return (
    <main className="min-h-full bg-slate-50 px-3 py-4 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1536px] space-y-4" aria-label="Loading Performance workspace">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-[520px] rounded-xl" />
          <Skeleton className="h-[520px] rounded-xl" />
        </div>
      </div>
    </main>
  );
}

export function WorkspaceError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-950 dark:border-rose-900/70 dark:bg-rose-950/35 dark:text-rose-100">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Performance data could not be loaded</p>
          <p className="mt-1 text-sm text-rose-800 dark:text-rose-200">{message}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
}

export function SmallLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs text-[#3459a8] dark:text-blue-300">
      <a href={href}>{children}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></a>
    </Button>
  );
}

export function Timeline({
  activities,
}: {
  activities: Array<Record<string, unknown>>;
}) {
  if (!activities.length) {
    return <EmptyPerformanceState title="No performance activity yet" description="Real appraisal, goal, check-in, feedback, and development events will appear here." />;
  }
  return (
    <ol className="space-y-0" aria-label="Performance activity timeline">
      {activities.slice(0, 12).map((activity, index) => (
        <li key={String(activity.id || index)} className="relative flex gap-3 pb-5 last:pb-0">
          {index < Math.min(activities.length, 12) - 1 ? <span className="absolute left-[7px] top-4 h-full w-px bg-slate-200 dark:bg-slate-800" aria-hidden /> : null}
          <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-[3px] border-white bg-[#3459a8] ring-1 ring-slate-200 dark:border-slate-950 dark:ring-slate-700" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{String(activity.title || 'Performance updated')}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              {formatDate(activity.occurredAt)}
              {activity.source ? <span>· {String(activity.source)}</span> : null}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function formatDate(value: unknown, fallback = 'Not scheduled') {
  if (!value) return fallback;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

export function percent(value: unknown) {
  const number = Number(value || 0);
  return Math.max(0, Math.min(100, Number.isFinite(number) ? Math.round(number) : 0));
}
