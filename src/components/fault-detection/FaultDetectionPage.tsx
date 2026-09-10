'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, CheckCircle2, ChevronDown, CircleAlert, Clock3, Filter, RefreshCw, Search, Sparkles, UserRoundSearch } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FaultDetectionResponse, FaultSeverity, FaultStatus, OperationalFault } from './fault-detection-types';

const severityStyle: Record<FaultSeverity, string> = {
  Critical: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200',
  High: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200',
  Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getFaultSourceGroup(source: string) {
  if (source === 'Conduct cases') return 'Conduct cases';
  if (source === 'Account activity') return 'Account activity';
  return 'Attendance anomalies';
}

export function FaultDetectionPage() {
  const [data, setData] = useState<FaultDetectionResponse | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'All' | FaultStatus>('All');
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const response = await fetch('/api/fault-detection', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || 'Unable to load employee signals');
      setData(payload as FaultDetectionResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load employee signals');
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    void runScan();
  }, [runScan]);

  const faults = data?.faults ?? [];
  const visibleFaults = useMemo(() => faults.filter((fault) => {
    const matchesStatus = status === 'All' || fault.status === status;
    const needle = query.trim().toLowerCase();
    return matchesStatus && (
      !needle
      || `${fault.title} ${fault.detail} ${fault.source} ${fault.id} ${fault.affected}`.toLowerCase().includes(needle)
    );
  }), [faults, query, status]);

  const groupedFaults = useMemo(() => {
    const groups: Array<{ label: string; faults: OperationalFault[] }> = [
      { label: 'Conduct cases', faults: [] },
      { label: 'Account activity', faults: [] },
      { label: 'Attendance anomalies', faults: [] },
    ];

    for (const fault of visibleFaults) {
      const label = getFaultSourceGroup(fault.source);
      const group = groups.find(item => item.label === label);
      group?.faults.push(fault);
    }

    return groups.filter(group => group.faults.length > 0);
  }, [visibleFaults]);

  const openCount = faults.length;
  const criticalCount = faults.filter((fault) => fault.severity === 'Critical').length;
  const recommendation = faults[0];

  return (
    <main className="min-h-full bg-[linear-gradient(180deg,hsl(var(--muted)/.34),transparent_280px)] px-4 py-5 text-foreground sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1480px]">
        <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <UserRoundSearch className="h-4 w-4 text-primary" /> Employee risk review
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Employee Fault Detection</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review employee conduct cases and unusual account or attendance activity. Every signal requires human verification before action is taken.
            </p>
          </div>
          <Button size="lg" onClick={() => void runScan()} disabled={scanning} className="self-start lg:self-auto">
            <RefreshCw className={cn('mr-2 h-4 w-4', scanning && 'animate-spin')} />
            {scanning ? 'Reviewing signals...' : 'Refresh employee signals'}
          </Button>
        </header>

        <section className="grid gap-px overflow-hidden border-x border-b border-border bg-border sm:grid-cols-3" aria-label="Fault summary">
          <Summary
            label="Open signals"
            value={openCount}
            note="Awaiting HR review"
            icon={<CircleAlert className="h-5 w-5" />}
            tone="danger"
          />
          <Summary
            label="Critical"
            value={criticalCount}
            note="Prioritize human review"
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="warning"
          />
          <Summary
            label="Last full scan"
            value={data ? relativeTime(data.scannedAt) : '—'}
            note={data ? `${data.monitors.length} employee signal sources checked` : 'Waiting for signal results'}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="good"
          />
        </section>

        {error && (
          <div role="alert" className="mt-6 flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void runScan()}>Retry</Button>
          </div>
        )}

        <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Employee review queue</h2>
                <p className="text-sm text-muted-foreground">{visibleFaults.length} signal{visibleFaults.length === 1 ? '' : 's'} shown</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Search employee or signal"
                    className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring sm:w-56"
                  />
                </label>
                <label className="relative block">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={status}
                    onChange={event => setStatus(event.target.value as 'All' | FaultStatus)}
                    className="h-10 w-full appearance-none rounded-md border border-input bg-background pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-40"
                  >
                    {['All', 'Open', 'Investigating'].map(value => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </label>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
              {scanning && !data ? (
                <div className="px-6 py-16 text-center">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">Reviewing employee signals...</p>
                </div>
              ) : groupedFaults.length ? (
                <div className="flex flex-col">
                  {groupedFaults.map((group) => (
                    <FaultSourceGroup key={group.label} label={group.label} faults={group.faults} />
                  ))}
                </div>
              ) : (
                <div className="px-6 py-16 text-center">
                  <CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" />
                  <h3 className="mt-3 font-semibold">No employee signals match</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Try another filter, or refresh to check for recent activity.</p>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Recommended next step</h2>
              </div>
              {recommendation ? (
                <>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Review “{recommendation.title}” first. Confirm the evidence and context before contacting the employee or changing a case.
                  </p>
                  <Button asChild variant="outline" className="mt-4 w-full">
                    <Link href={recommendation.actionHref}>
                      {recommendation.actionLabel}
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  No employee signals currently require review.
                </p>
              )}
            </div>

            <div className="border-t border-border pt-5">
              <h2 className="text-sm font-semibold">Signal coverage</h2>
              <div className="mt-4 space-y-4">
                {data?.monitors.map((monitor) => (
                  <Coverage key={monitor.label} label={monitor.label} value={monitor.total ? Math.round((monitor.healthy / monitor.total) * 100) : 0} />
                )) ?? <p className="text-xs text-muted-foreground">Coverage appears after the first scan.</p>}
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Signals support investigation; they are not proof of employee misconduct.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function getFaultSourceGroupLabelClass(label: string) {
  if (label === 'Conduct cases') return 'text-rose-700 border-rose-200/70 bg-rose-50/70 dark:text-rose-200 dark:border-rose-900/50 dark:bg-rose-950/30';
  if (label === 'Account activity') return 'text-amber-700 border-amber-200/70 bg-amber-50/70 dark:text-amber-200 dark:border-amber-900/50 dark:bg-amber-950/30';
  return 'text-sky-700 border-sky-200/70 bg-sky-50/70 dark:text-sky-200 dark:border-sky-900/50 dark:bg-sky-950/30';
}

function FaultSourceGroup({ label, faults }: { label: string; faults: OperationalFault[] }) {
  return (
    <section className="px-4 py-4 sm:px-5">
      <div className={cn('mb-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', getFaultSourceGroupLabelClass(label))}>
        {label}
        <span className="ml-2 rounded-full border px-1.5 py-0.5 text-[11px]">{faults.length}</span>
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-card">
        {faults.map((fault, index) => (
          <FaultRow key={fault.id} fault={fault} divided={index > 0} />
        ))}
      </div>
    </section>
  );
}

function FaultRow({ fault, divided }: { fault: OperationalFault; divided: boolean }) {
  return (
    <article className={cn('group px-4 py-5 transition-colors hover:bg-muted/35 sm:px-5', divided && 'border-t border-border')}>
      <div className="flex gap-3 sm:gap-4">
        <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', severityStyle[fault.severity])}>
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold leading-5">{fault.title}</h3>
                <span className={cn('rounded px-2 py-0.5 text-[11px] font-semibold', severityStyle[fault.severity])}>
                  {fault.severity}
                </span>
              </div>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{fault.detail}</p>
            </div>
            <span className={cn('shrink-0 text-xs font-semibold', fault.status === 'Investigating' ? 'text-amber-700 dark:text-amber-300' : 'text-foreground')}>
              {fault.status}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span>{fault.source}</span>
            <span className="flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {relativeTime(fault.detectedAt)}
            </span>
            <span>{fault.affected}</span>
            <Button asChild variant="ghost" size="sm" className="ml-auto">
              <Link href={fault.actionHref}>
                {fault.actionLabel}
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Summary({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: React.ReactNode;
  tone: 'danger' | 'warning' | 'good';
}) {
  const tones = {
    danger: 'text-red-700 dark:text-red-300',
    warning: 'text-amber-700 dark:text-amber-300',
    good: 'text-emerald-700 dark:text-emerald-300',
  };
  return (
    <div className="bg-background px-5 py-5 sm:px-6">
      <div className={cn('flex items-center gap-2 text-sm font-medium', tones[tone])}>
        {icon}
        {label}
      </div>
      <div className="mt-3 flex items-end gap-3">
        <strong className="text-3xl font-semibold tracking-tight">{value}</strong>
        <span className="pb-1 text-xs text-muted-foreground">{note}</span>
      </div>
    </div>
  );
}

function Coverage({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', value === 100 ? 'bg-emerald-500' : 'bg-amber-500')} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}


