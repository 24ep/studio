"use client";

import * as React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  CloudOff,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  HrisEmptyState,
  HrisWorkspaceHeader,
  hrisStatusTone,
} from '@/components/hris/HrisWorkspacePrimitives';
import { useDynamicZIndex } from '@/contexts/ZIndexContext';
import { cn } from '@/lib/utils';
import { formatDate, stringValue, type ShiftRecord } from './shift-types';

const statusTone: Record<string, string> = {
  draft: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
  scheduled: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
  submitted: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
  pending_approval: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  awaiting_employee: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200',
  ready_for_review: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200',
  published: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  applied: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  present: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  checked_out: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  late: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  on_break: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  missing_record: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
  absent: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
  exception: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
  returned: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200',
  returned_for_revision: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-200',
  locked: 'border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
  closed: 'border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
};

export function ShiftStatusBadge({ status, className }: { status: unknown; className?: string }) {
  const key = stringValue(status, 'unknown').toLowerCase().replace(/\s+/g, '_');
  return (
    <Badge
      variant="outline"
      className={cn(
        'min-h-6 rounded-full px-2 text-[11px] font-semibold leading-4',
        statusTone[key] || hrisStatusTone(key),
        className,
      )}
    >
      <CircleDot className="mr-1 h-3 w-3" aria-hidden />
      {key.replace(/_/g, ' ')}
    </Badge>
  );
}

export function ShiftPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 pb-4 dark:border-zinc-800">
      <HrisWorkspaceHeader eyebrow={eyebrow} title={title} description={description} action={actions} />
    </div>
  );
}

export function MetricRail({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode; detail?: string; alert?: boolean }>;
}) {
  return (
    <section className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-white sm:grid-cols-3 xl:grid-cols-6 dark:border-zinc-800 dark:bg-zinc-950">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            'min-w-0 px-3 py-3 sm:px-4',
            index > 0 && 'border-l border-slate-100 dark:border-zinc-800',
            index > 1 && 'max-sm:border-t',
            item.alert && 'bg-amber-50/70 dark:bg-amber-950/15',
          )}
        >
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-500">{item.label}</p>
          <p className={cn('mt-1 text-xl font-bold tabular-nums text-slate-950 dark:text-zinc-50', item.alert && 'text-amber-800 dark:text-amber-200')}>{item.value}</p>
          {item.detail && <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-zinc-500">{item.detail}</p>}
        </div>
      ))}
    </section>
  );
}

export function DateNavigator({
  value,
  onChange,
  label,
  stepDays = 1,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  stepDays?: number;
}) {
  const move = (direction: number) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + direction * stepDays);
    onChange(date.toISOString().slice(0, 10));
  };
  return (
    <div className="inline-flex min-h-10 items-center rounded-md border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-r-none" onClick={() => move(-1)} aria-label={`Previous ${stepDays === 1 ? 'day' : 'period'}`}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <label className="relative flex h-10 min-w-36 items-center justify-center border-x border-slate-200 px-3 text-sm font-semibold dark:border-zinc-800">
        <CalendarDays className="mr-2 h-4 w-4 text-slate-400" aria-hidden />
        <span>{label || formatDate(value, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <input
          className="absolute inset-0 cursor-pointer opacity-0"
          type="date"
          value={value}
          onChange={event => onChange(event.target.value)}
          aria-label="Choose date"
        />
      </label>
      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-l-none" onClick={() => move(1)} aria-label={`Next ${stepDays === 1 ? 'day' : 'period'}`}>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input className="h-10 bg-white pl-9 dark:bg-zinc-950" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function LoadingState({ label = 'Loading live workforce data…' }: { label?: string }) {
  return (
    <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/60 text-sm text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-400">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50/60 px-6 text-center dark:border-rose-900 dark:bg-rose-950/20">
      {offline ? <CloudOff className="h-6 w-6 text-rose-600" /> : <AlertCircle className="h-6 w-6 text-rose-600" />}
      <h2 className="mt-3 font-semibold text-rose-950 dark:text-rose-100">{offline ? 'You appear to be offline' : 'Shift data could not be loaded'}</h2>
      <p className="mt-1 max-w-md text-sm text-rose-800 dark:text-rose-300">{message}</p>
      <Button className="mt-4" variant="outline" onClick={onRetry}><RefreshCw className="mr-2 h-4 w-4" />Try again</Button>
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
  return <HrisEmptyState title={title} description={description} action={action} icon={CheckCircle2} />;
}

export function PermissionBanner({ scope }: { scope: string }) {
  if (scope === 'global') return null;
  return (
    <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>
        Data scope: <strong>{scope}</strong>. The server applies company, reporting-line, and self-record restrictions to every query and action.
      </span>
    </div>
  );
}

export function DetailDrawer({
  title,
  open,
  onClose,
  children,
  variant = 'edge',
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: 'edge' | 'floating' | 'inline';
}) {
  const { contentZIndex, overlayZIndex } = useDynamicZIndex('shift-detail-drawer', 'drawer');

  React.useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  const floating = variant === 'floating';
  const inline = variant === 'inline';

  if (inline) {
    return (
      <aside className="flex min-h-[690px] w-full flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl dark:border-zinc-700 dark:bg-[#0b1623]" role="dialog" aria-label={title}>
        <div className="flex min-h-12 items-center justify-between border-b border-slate-200 px-4 dark:border-zinc-700">
          <h2 className="font-semibold text-slate-950 dark:text-zinc-50">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close detail"><X className="h-4 w-4" /></Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    );
  }

  return (
    <div
      data-state="open"
      className={cn(
        'fixed inset-0 flex justify-end',
        floating
          ? 'bg-slate-950/70 p-3 backdrop-blur-[1.5px] sm:p-4 lg:p-6'
          : 'bg-slate-950/25',
      )}
      style={{ zIndex: overlayZIndex }}
      role="presentation"
      onClick={event => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <aside
        className={cn(
          'flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-zinc-950',
          floating
            ? 'max-w-[386px] rounded-xl border border-slate-300 dark:border-zinc-700'
            : 'max-w-lg overflow-y-auto border-l border-slate-200 dark:border-zinc-800',
        )}
        style={{ zIndex: contentZIndex }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={event => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex min-h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
          <h2 className="font-semibold text-slate-950 dark:text-zinc-50">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close detail"><X className="h-4 w-4" /></Button>
        </div>
        <div className={cn('p-4 sm:p-5', floating && 'min-h-0 flex-1 overflow-y-auto')}>{children}</div>
      </aside>
    </div>
  );
}

export function PolicyWarnings({ warnings }: { warnings: unknown }) {
  const values = Array.isArray(warnings) ? warnings : [];
  if (values.length === 0) return null;
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/25">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
        <AlertCircle className="h-4 w-4" />Policy review
      </div>
      <ul className="mt-2 space-y-1 pl-5 text-xs text-amber-800 dark:text-amber-200">
        {values.map((warning, index) => <li key={index} className="list-disc">{stringValue(warning)}</li>)}
      </ul>
    </div>
  );
}

export function KeyValueList({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="divide-y divide-slate-100 text-sm dark:divide-zinc-800">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 py-2.5">
          <dt className="text-slate-500 dark:text-zinc-500">{label}</dt>
          <dd className="min-w-0 text-right font-medium text-slate-900 dark:text-zinc-100">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmployeeAvatar({ row }: { row: ShiftRecord }) {
  const name = stringValue(row.preferred_name || row.first_name, 'E');
  const url = row.profile_photo_url ? String(row.profile_photo_url) : '';
  return url ? (
    <img src={url} alt="" className="h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-zinc-700" />
  ) : (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200" aria-hidden>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
