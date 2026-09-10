import * as React from 'react';
import { Inbox } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type HrisRecord = Record<string, unknown>;

function displayText(value: unknown, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

function labelize(value: unknown) {
  return displayText(value).replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

export function hrisStatusTone(status: unknown) {
  const value = displayText(status, '').toLowerCase();
  if (['approved', 'active', 'completed', 'paid', 'closed', 'resolved', 'released', 'published', 'verified', 'ready', 'billable', 'exported_to_payroll', 'finalized', 'reconciled', 'posted', 'settled', 'fully_settled', 'acknowledged', 'on_track'].includes(value)) return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
  if (['rejected', 'cancelled', 'payment_failed', 'critical', 'error', 'failed', 'blocked', 'expired', 'overdue', 'terminated', 'exceptions_pending', 'returned_for_correction', 'exception_found', 'blocking', 'posting_failed', 'validation_failed', 'disputed', 'returned_for_revision', 'at_risk'].includes(value)) return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200';
  if (['draft', 'planned', 'archived', 'inactive', 'not_started', 'none'].includes(value)) return 'border-border bg-muted text-muted-foreground';
  if (['in_progress', 'processing', 'submitted', 'under_review', 'working_remotely', 'on_leave', 'collecting_inputs', 'payment_processing', 'reimbursement_processing', 'queued', 'ready_for_review', 'ready_to_export', 'ready_for_release', 'calibration_in_progress', 'manager_review_in_progress', 'self_assessment_in_progress'].includes(value)) return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200';
  return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100';
}

export function HrisStatusBadge({ value, className }: { value: unknown; className?: string }) {
  const label = labelize(value);
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap font-medium', hrisStatusTone(value), className)} aria-label={`Status: ${label}`}>
      <span aria-hidden className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

export function HrisSurface({ children, className, ...props }: React.ComponentPropsWithoutRef<'section'>) {
  return <section className={cn('rounded-2xl border border-border/80 bg-card', className)} {...props}>{children}</section>;
}

export function HrisWorkspaceHeader({
  eyebrow,
  title,
  description,
  action,
  leading,
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  leading?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <header className={cn('flex flex-col pb-1 pt-1 sm:flex-row sm:items-end sm:justify-between', compact ? 'gap-2' : 'gap-4')}>
      <div className={cn('flex min-w-0 items-start', compact ? 'gap-2' : 'gap-4')}>
        {leading}
        <div className="min-w-0 max-w-3xl">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
          <h1 className={cn('font-semibold tracking-[-0.025em] text-foreground', compact ? 'mt-0 text-xl sm:text-2xl' : 'mt-2 text-2xl sm:text-3xl')}>{title}</h1>
          <p className={cn('max-w-2xl text-sm text-muted-foreground', compact ? 'mt-1 leading-5' : 'mt-2 leading-6')}>{description}</p>
        </div>
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </header>
  );
}

export function HrisSectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function HrisEmptyState({ title, description, action, icon: Icon = Inbox }: { title: string; description: string; action?: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="grid min-h-44 place-items-center px-6 py-10 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-muted"><Icon className="h-5 w-5 text-muted-foreground" aria-hidden /></div>
        <h3 className="font-medium">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        {action && <div className="mt-4 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

export function HrisMetric({ label, value, helper, icon: Icon, urgent }: { label: string; value: React.ReactNode; helper: string; icon: React.ComponentType<{ className?: string }>; urgent?: boolean }) {
  return (
    <div className="min-w-0 border-b border-border/70 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{label}</p><Icon className={cn('h-4 w-4', urgent ? 'text-amber-600' : 'text-primary')} aria-hidden /></div>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{helper}</p>
    </div>
  );
}

interface HrisRecordColumn {
  key: string;
  label: string;
  render?: (row: HrisRecord) => React.ReactNode;
  align?: 'right';
}

export function HrisResponsiveRecords({ columns, rows, empty, rowKey = 'id', caption }: { columns: HrisRecordColumn[]; rows: HrisRecord[]; empty: { title: string; description: string; action?: React.ReactNode }; rowKey?: string; caption?: string }) {
  if (!rows.length) return <HrisEmptyState {...empty} />;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-muted/45 text-xs text-muted-foreground"><tr>{columns.map(column => <th key={column.key} scope="col" className={cn('px-5 py-3 font-medium', column.align === 'right' && 'text-right')}>{column.label}</th>)}</tr></thead>
          <tbody className="divide-y divide-border/70">{rows.map((row, index) => <tr key={displayText(row[rowKey], String(index))} className="transition-colors hover:bg-muted/25">{columns.map(column => <td key={column.key} className={cn('px-5 py-4 align-top', column.align === 'right' && 'text-right')}>{column.render ? column.render(row) : displayText(row[column.key])}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="divide-y divide-border/70 md:hidden">{rows.map((row, index) => <article key={displayText(row[rowKey], String(index))} className="space-y-3 p-4">{columns.map((column, columnIndex) => <div key={column.key} className={cn(columnIndex === 0 ? 'block' : 'flex items-start justify-between gap-4')}>{columnIndex > 0 && <span className="text-xs text-muted-foreground">{column.label}</span>}<div className={cn('text-sm', columnIndex > 0 && 'text-right')}>{column.render ? column.render(row) : displayText(row[column.key])}</div></div>)}</article>)}</div>
    </>
  );
}
