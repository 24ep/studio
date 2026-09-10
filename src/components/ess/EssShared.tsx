"use client";

import * as React from 'react';
import {
  AlertCircle,
  Check,
  ChevronRight,
  Gauge,
  RefreshCw,
  ShieldCheck,
  UserRoundX,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { EssEmployee, EssRow, EssView } from './ess-types';
import { dateValue, statusLabel, stringValue } from './ess-types';

const viewMeta: Record<EssView, { label: string; description: string }> = {
  profile: { label: 'My Profile', description: 'Personal details and employment information' },
  leave: { label: 'My Requests', description: 'Track your time away and manage leave requests' },
  attendance: { label: 'Attendance', description: 'Today, history, and corrections' },
  'shift-requests': { label: 'Shift Requests', description: 'Request schedule changes, swaps, or open shifts' },
  'attendance-corrections': { label: 'Corrections', description: 'Correct missing or inaccurate attendance records' },
  overtime: { label: 'Overtime', description: 'Submit and track overtime requests' },
  timesheet: { label: 'Timesheet', description: 'Allocate worked time, submit the week, and respond to review feedback' },
  documents: { label: 'Document', description: 'Secure HR documents and requests' },
  performance: { label: 'Performance', description: 'Goals, check-ins, and reviews' },
  team: { label: 'My Team', description: 'Direct reports and approvals' },
};

export function EssShell({
  view,
  employee,
  backgroundLoading,
  error,
  onRetry,
  children,
}: {
  view: EssView;
  employee: EssEmployee;
  backgroundLoading: boolean;
  error: string | null;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  const current = viewMeta[view];
  return (
    <main className="min-h-full bg-[hsl(var(--app-page-background,var(--background)))] px-3 py-4 text-foreground sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[1440px] space-y-4">
        <div className={cn('flex items-start justify-between gap-4', view === 'leave' && 'sr-only')}>
          <div>
            <h1 className="text-[clamp(1.35rem,2vw,1.75rem)] font-semibold tracking-tight">{current.label}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{current.description}</p>
          </div>
          {backgroundLoading && <RefreshCw className="mt-1 h-4 w-4 animate-spin text-muted-foreground" aria-label="Refreshing" />}
        </div>
        {error && <ErrorState message={error} onRetry={onRetry} compact />}
        {children}
      </div>
    </main>
  );
}

export function EmployeeSummaryHeader({ employee }: { employee: EssEmployee }) {
  const initials = employee.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  return (
    <header className="relative overflow-hidden rounded-lg border border-border bg-card">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden />
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="h-14 w-14 border border-border">
            {employee.profilePhotoUrl && <AvatarImage src={employee.profilePhotoUrl} alt="" />}
            <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Employee self-service</p>
            <h2 className="truncate text-xl font-semibold">{employee.name}</h2>
            <p className="truncate text-sm text-muted-foreground">
              {employee.employeeNumber} · {employee.jobTitle || 'Role not assigned'} · {employee.department || 'Department not assigned'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:min-w-64">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium">Profile complete</span>
              <span className="text-muted-foreground">{employee.profileCompletion}%</span>
            </div>
            <Progress value={employee.profileCompletion} className="h-1.5" aria-label={`Profile ${employee.profileCompletion}% complete`} />
          </div>
          <StatusBadge status={employee.status} />
        </div>
      </div>
    </header>
  );
}

export function StatusBadge({ status }: { status: unknown }) {
  const normalized = stringValue(status, 'pending').toLowerCase();
  const tone = normalized.includes('approved') || normalized.includes('complete') || normalized === 'active' || normalized === 'present'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
    : normalized.includes('reject') || normalized.includes('cancel') || normalized === 'absent'
      ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200'
      : normalized.includes('return') || normalized.includes('late') || normalized.includes('pending')
        ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
        : 'border-border bg-muted/60 text-muted-foreground';
  return <Badge variant="outline" className={cn('whitespace-nowrap rounded-full capitalize', tone)}>{statusLabel(status)}</Badge>;
}

export function Section({
  title,
  description,
  action,
  required = false,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-border bg-card', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border/60 px-4 py-3.5">
        <div>
          <h2 className="text-sm font-semibold">{title}{required ? <span className="ml-1 text-destructive" title="Required" aria-label="Required">*</span> : null}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function InfoRow({ label, value, permission, required = false }: { label: string; value: React.ReactNode; permission?: string; required?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-border/50 py-3 last:border-0 sm:grid-cols-[minmax(8rem,0.7fr)_1.3fr] sm:gap-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {label}{required ? <span className="ml-1 text-destructive" title="Required" aria-label="Required">*</span> : null}
        {permission === 'hr_controlled' && <ShieldCheck className="h-3.5 w-3.5" aria-label="Controlled by HR" />}
      </div>
      <div className="min-w-0 text-sm font-medium">{value || '—'}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
      <Check className="mb-3 h-5 w-5 text-muted-foreground" aria-hidden />
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, compact = false }: { message: string; onRetry: () => void; compact?: boolean }) {
  return (
    <div role="alert" className={cn('rounded-lg border border-destructive/30 bg-destructive/5 p-5', compact && 'p-3')}>
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Something needs attention</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
}

export function MissingEmployeePlaceholder({ message }: { message: string }) {
  return (
    <div className="flex max-w-md flex-col items-center text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-muted text-muted-foreground" aria-hidden>
        <UserRoundX className="h-10 w-10" strokeWidth={2.25} />
      </div>
      <h1 className="mt-5 text-lg font-semibold tracking-tight">Employee record unavailable</h1>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{message}</p>
    </div>
  );
}

export function EssLoadingState() {
  return (
    <main className="px-3 py-4 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[1440px] space-y-4" aria-label="Loading employee self-service">
        <Skeleton className="h-12 rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-lg lg:col-span-2" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    </main>
  );
}

export function MetricStrip({ items }: { items: Array<{ label: string; value: React.ReactNode; icon?: React.ElementType }> }) {
  return (
    <div className="grid divide-y divide-border overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
      {items.map(item => {
        const Icon = item.icon || Gauge;
        return (
          <div key={item.label} className="flex items-center gap-3 px-4 py-3">
            <Icon className="h-4 w-4 text-primary" aria-hidden />
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{item.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ApprovalTimeline({ activities }: { activities: EssRow[] }) {
  if (!activities.length) return <EmptyState title="No activity yet" description="Actions and comments will appear here." />;
  return (
    <ol className="space-y-0" aria-label="Request activity">
      {activities.map((activity, index) => (
        <li key={`${stringValue(activity.createdAt)}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
          {index < activities.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-border" aria-hidden />}
          <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-background bg-primary" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium capitalize">{statusLabel(activity.action)}</p>
            {Boolean(activity.comment) && <p className="mt-0.5 text-sm text-muted-foreground">{stringValue(activity.comment)}</p>}
            <p className="mt-1 text-xs text-muted-foreground">{dateValue(activity.createdAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function RecordLink({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 text-primary">{children}<ChevronRight className="h-3.5 w-3.5" /></span>;
}
