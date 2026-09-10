'use client';

import * as React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Clock3, Download, Loader2, RefreshCw, UserRound, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';
import { getJsonArray, readJsonObject } from '@/lib/response-json';

interface QueueJob {
  id: string;
  operation: 'import' | 'export';
  entityType: 'applicants' | 'positions';
  format: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  originalFileName: string | null;
  outputFileName: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  requestedByName: string;
  requestedByEmail: string;
}

function isQueueJob(value: unknown): value is QueueJob {
  return Boolean(value && typeof value === 'object' && 'id' in value && 'status' in value);
}

export function DataOperationQueue() {
  const [jobs, setJobs] = React.useState<QueueJob[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await fetch('/api/data-operations/jobs', { cache: 'no-store' });
      const data = await readJsonObject(response);
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not load the operation queue.');
      setJobs(((getJsonArray(data, 'jobs') ?? []) as unknown[]).filter(isQueueJob));
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load the operation queue.');
    } finally { if (!quiet) setLoading(false); }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const hasActiveJobs = React.useMemo(() => (
    jobs.some((job) => job.status === 'pending' || job.status === 'processing')
  ), [jobs]);
  const pollIntervalMs = React.useMemo(() => {
    if (hasActiveJobs) return 3000;
    if (loading) return 10000;
    return 30000;
  }, [hasActiveJobs, loading]);

  useVisibilityInterval(() => {
    void load(true);
  }, pollIntervalMs, true);

  const counts = React.useMemo(() => ({
    active: jobs.filter((job) => job.status === 'pending' || job.status === 'processing').length,
    completed: jobs.filter((job) => job.status === 'completed').length,
    failed: jobs.filter((job) => job.status === 'failed').length,
  }), [jobs]);

  return <section className="overflow-hidden rounded-xl border bg-background">
    <div className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Durable work queue</p><h2 className="mt-1 text-lg font-semibold">Import &amp; export jobs</h2><p className="mt-1 text-sm text-muted-foreground">Queued work is processed within admin limits. Export files stay here when ready.</p></div>
      <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />Refresh</Button>
    </div>
    <div className="grid grid-cols-3 border-b bg-muted/15">
      <QueueCount label="Active" value={counts.active} /><QueueCount label="Completed" value={counts.completed} /><QueueCount label="Needs attention" value={counts.failed} />
    </div>
    {loading ? <div className="grid min-h-56 place-items-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading jobs…</div>
      : error ? <div className="p-8 text-center text-sm text-destructive">{error}</div>
      : jobs.length === 0 ? <div className="p-10 text-center"><Clock3 className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">No data jobs yet</p><p className="mt-1 text-sm text-muted-foreground">Create an import or export and it will appear here before processing starts.</p></div>
      : <div className="divide-y">{jobs.map((job) => <QueueRow key={job.id} job={job} />)}</div>}
  </section>;
}

function QueueCount({ label, value }: { label: string; value: number }) { return <div className="px-5 py-3"><span className="text-lg font-semibold tabular-nums">{value}</span><span className="ml-2 text-xs text-muted-foreground">{label}</span></div>; }

function QueueRow({ job }: { job: QueueJob }) {
  const Icon = job.operation === 'import' ? ArrowUpFromLine : ArrowDownToLine;
  const status = STATUS[job.status];
  const StatusIcon = status.icon;
  const result = job.result || {};
  const resultText = job.status === 'completed'
    ? job.operation === 'export' ? `${Number(result.exportCount || 0)} records prepared` : `${Number(result.created || result.success || 0)} created · ${Number(result.updated || 0)} updated · ${Number(result.skipped || result.failed || 0)} skipped`
    : job.error || (job.status === 'processing' ? `Processing · ${job.progress}%` : 'Waiting for an available worker');
  return <article className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(220px,1fr)_minmax(180px,.7fr)_150px_auto] md:items-center">
    <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium capitalize">{job.operation} {job.entityType}</p><p className="truncate text-xs text-muted-foreground">{job.originalFileName || job.outputFileName || (job.format ? `${job.format.toUpperCase()} export` : 'Data operation')}</p></div></div>
    <div className="min-w-0"><p className="flex items-center gap-1.5 truncate text-sm"><UserRound className="h-3.5 w-3.5 text-muted-foreground" />{job.requestedByName}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{job.requestedByEmail} · {new Date(job.createdAt).toLocaleString()}</p></div>
    <div><span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', status.className)}><StatusIcon className={cn('h-3.5 w-3.5', job.status === 'processing' && 'animate-spin')} />{status.label}</span><p className="mt-1.5 text-xs text-muted-foreground">{resultText}</p></div>
    <div className="md:text-right">{job.operation === 'export' && job.status === 'completed' ? <Button size="sm" variant="outline" asChild><a href={`/api/data-operations/jobs/${job.id}/download`}><Download className="mr-2 h-4 w-4" />Download</a></Button> : <span className="text-xs text-muted-foreground">#{job.id.slice(0, 8)}</span>}</div>
  </article>;
}

const STATUS = {
  pending: { label: 'Queued', icon: Clock3, className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  processing: { label: 'Processing', icon: Loader2, className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'Cancelled', icon: XCircle, className: 'bg-muted text-muted-foreground' },
} as const;
