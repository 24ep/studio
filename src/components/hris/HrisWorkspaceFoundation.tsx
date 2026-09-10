'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Download,
  FileClock,
  Filter,
  History,
  Loader2,
  LockKeyhole,
  Search,
  WifiOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { HrisWorkspaceState, HrisWorkspaceStateKind } from '@/lib/hris/workspace-contracts';
import { cn } from '@/lib/utils';
import { HrisEmptyState, HrisStatusBadge } from './HrisWorkspacePrimitives';

export function HrisAttentionStrip({
  title,
  description,
  count,
  severity = 'warning',
  owner,
  dueLabel,
  action,
}: {
  title: string;
  description: string;
  count?: number;
  severity?: 'info' | 'warning' | 'critical' | 'success';
  owner?: string;
  dueLabel?: string;
  action?: React.ReactNode;
}) {
  const styles = {
    info: 'border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/35 dark:text-blue-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-100',
    critical: 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-100',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-100',
  }[severity];
  const Icon = severity === 'success' ? CheckCircle2 : severity === 'critical' ? CircleAlert : AlertTriangle;

  return (
    <section className={cn('flex flex-col gap-4 border-y px-4 py-3 sm:flex-row sm:items-center sm:justify-between', styles)} aria-label="Attention summary">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            {typeof count === 'number' && <span className="rounded-full border border-current/20 px-2 py-0.5 text-xs font-semibold tabular-nums">{count}</span>}
          </div>
          <p className="mt-0.5 text-sm opacity-80">{description}</p>
          {(owner || dueLabel) && <p className="mt-1 text-xs font-medium opacity-75">{owner && `Owner: ${owner}`}{owner && dueLabel && ' · '}{dueLabel}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </section>
  );
}

export function HrisFilterBar({
  query,
  onQueryChange,
  placeholder = 'Search records',
  activeFilterCount = 0,
  onClear,
  filters,
  actions,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  activeFilterCount?: number;
  onClear?: () => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/70 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1 sm:max-w-sm">
          <span className="sr-only">{placeholder}</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={event => onQueryChange(event.target.value)} placeholder={placeholder} className="min-h-11 pl-9" />
        </label>
        {filters}
        {activeFilterCount > 0 && onClear && (
          <Button type="button" variant="ghost" className="min-h-11 justify-start" onClick={onClear}>
            <Filter className="mr-2 h-4 w-4" />Clear {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'}
          </Button>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function HrisRecordDrawer({
  open,
  onOpenChange,
  title,
  description,
  status,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  status?: unknown;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border/70 px-5 py-5 pr-14 text-left">
          <div className="flex flex-wrap items-center gap-2"><SheetTitle>{title}</SheetTitle>{status !== undefined && <HrisStatusBadge value={status} />}</div>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <SheetFooter className="border-t border-border/70 px-5 py-4">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}

export interface HrisTimelineItem {
  id: string;
  title: string;
  description?: string | null;
  actor?: string | null;
  timestamp?: string | null;
  status?: unknown;
  metadata?: React.ReactNode;
}

export function HrisTimeline({ items, label = 'Activity timeline', emptyTitle = 'No activity yet', emptyDescription = 'Recorded decisions and changes will appear here.' }: { items: HrisTimelineItem[]; label?: string; emptyTitle?: string; emptyDescription?: string }) {
  if (!items.length) return <HrisEmptyState icon={History} title={emptyTitle} description={emptyDescription} />;
  return (
    <ol aria-label={label} className="space-y-0">
      {items.map((item, index) => (
        <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
          {index < items.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-border" aria-hidden />}
          <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-[3px] border-background bg-primary ring-1 ring-border" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-medium">{item.title}</p>{item.status !== undefined && <HrisStatusBadge value={item.status} />}</div>
            {item.description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>}
            <p className="mt-1 text-xs text-muted-foreground">{[item.actor, formatHrisDateTime(item.timestamp)].filter(Boolean).join(' · ')}</p>
            {item.metadata}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function HrisBulkActionBar({ selectedCount, children, onClear }: { selectedCount: number; children: React.ReactNode; onClear: () => void }) {
  if (!selectedCount) return null;
  return (
    <div className="sticky bottom-3 z-20 mx-3 flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 shadow-lg sm:flex-row sm:items-center sm:justify-between dark:border-slate-600">
      <div><p className="text-sm font-semibold">{selectedCount} selected</p><button type="button" onClick={onClear} className="mt-0.5 text-xs text-slate-300 underline-offset-4 hover:underline">Clear selection</button></div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function HrisFormSection({ title, description, required, children }: { title: string; description?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-border/70 py-5 first:border-t-0 first:pt-0">
      <legend className="w-full"><span className="text-sm font-semibold">{title}</span>{required && <span className="ml-1 text-destructive" aria-label="required">*</span>}{description && <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>}</legend>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function HrisCalculationBreakdown({ result, currency, items, warnings = [] }: { result: number; currency?: string; items: Array<{ label: string; value: number; operation?: string }>; warnings?: string[] }) {
  const number = new Intl.NumberFormat(undefined, currency ? { style: 'currency', currency } : { maximumFractionDigits: 2 });
  return (
    <section className="border-y border-border/70" aria-label="Calculation breakdown">
      <div className="flex items-center gap-2 px-4 py-3"><Calculator className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold">Calculation breakdown</h3></div>
      <dl className="divide-y divide-border/60 border-y border-border/60 bg-muted/20">{items.map(item => <div key={item.label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><dt>{item.operation && <span className="mr-2 text-muted-foreground">{item.operation}</span>}{item.label}</dt><dd className="font-medium tabular-nums">{number.format(item.value)}</dd></div>)}</dl>
      <div className="flex items-center justify-between gap-4 px-4 py-4"><span className="font-semibold">Result</span><strong className="text-lg tabular-nums">{number.format(result)}</strong></div>
      {warnings.map(warning => <p key={warning} className="border-t border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">{warning}</p>)}
    </section>
  );
}

const stateIcon: Record<HrisWorkspaceStateKind, React.ComponentType<{ className?: string }>> = {
  loading: Loader2,
  empty: FileClock,
  filtered_empty: Search,
  partial: AlertTriangle,
  error: CircleAlert,
  permission_denied: LockKeyhole,
  offline: WifiOff,
  conflict: AlertTriangle,
  archived: FileClock,
  processing: Loader2,
};

export function HrisWorkspaceStatePanel({ state, action }: { state: HrisWorkspaceState; action?: React.ReactNode }) {
  const Icon = stateIcon[state.kind];
  return (
    <div role={['error', 'permission_denied', 'conflict'].includes(state.kind) ? 'alert' : 'status'} className="grid min-h-44 place-items-center border-y border-border/70 px-6 py-10 text-center">
      <div className="max-w-md"><Icon className={cn('mx-auto h-6 w-6 text-muted-foreground', ['loading', 'processing'].includes(state.kind) && 'animate-spin')} aria-hidden /><h3 className="mt-3 font-semibold">{state.title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{state.description}</p>{state.supportReference && <p className="mt-2 text-xs text-muted-foreground">Reference: {state.supportReference}</p>}{action && <div className="mt-4 flex justify-center">{action}</div>}</div>
    </div>
  );
}

export function HrisExportDialog({ open, onOpenChange, title = 'Export records', description = 'The export uses your current scope, filters, and field permissions.', formats = ['csv', 'xlsx'], onExport, busy = false }: { open: boolean; onOpenChange: (open: boolean) => void; title?: string; description?: string; formats?: string[]; onExport: (format: string) => void; busy?: boolean }) {
  const [format, setFormat] = React.useState(formats[0] || 'csv');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dialogId="hris-export-dialog">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        <label className="grid gap-2 py-4 text-sm font-medium">Format<select value={format} onChange={event => setFormat(event.target.value)} className="min-h-11 rounded-md border border-input bg-background px-3">{formats.map(value => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select></label>
        <p className="text-xs leading-5 text-muted-foreground">Sensitive fields remain masked. The request and download are recorded in the audit history.</p>
        <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button><Button type="button" onClick={() => onExport(format)} disabled={busy}><Download className="mr-2 h-4 w-4" />{busy ? 'Preparing…' : 'Export'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useHrisUnsavedChangesGuard(dirty: boolean, message = 'You have unsaved changes. Leave without saving?') {
  React.useEffect(() => {
    if (!dirty) return undefined;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  return React.useCallback(() => !dirty || window.confirm(message), [dirty, message]);
}

function formatHrisDateTime(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}
