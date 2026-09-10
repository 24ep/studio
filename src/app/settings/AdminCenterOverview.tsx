"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  HardDrive,
  LoaderCircle,
  MemoryStick,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
  Workflow,
} from 'lucide-react';

import { platformSetupFeatures, type PlatformSetupFeatureStatus } from '@/lib/admin-platform-setup';

import {
  appendHealthProbe,
  formatServerUptime,
  getAdminHealthState,
  toQueueCount,
  type AdminHealthState,
  type HealthProbePoint,
} from './admin-center-overview-model';
import type { SettingsPageItem } from './settings-page-model';
import { AdminCenterProbeChart } from './AdminCenterProbeChart';

const POLL_INTERVAL_MS = 30_000;
const PROBE_STORAGE_KEY = 'admin-center-health-probes';

interface ApiHealthResponse {
  status: 'healthy' | 'unhealthy';
  uptime?: number;
  version?: string;
  timestamp?: string;
}

interface DatabaseHealthResponse {
  status: 'healthy' | 'unhealthy';
  timings?: { connection?: number; basicQuery?: number; tableQuery?: number; total?: number };
  databaseInfo?: {
    uploadQueueStats?: Record<'total_jobs' | 'queued_jobs' | 'processing_jobs' | 'completed_jobs' | 'failed_jobs', string>;
  };
}

interface RuntimeHealthResponse {
  status: 'healthy';
  checkedAt: string;
  uptimeSeconds: number;
  version: string;
  runtime: string;
  memory: { rssBytes: number; heapUsedBytes: number; heapTotalBytes: number; externalBytes: number };
}

interface SetupHealthResponse {
  features: PlatformSetupFeatureStatus[];
  progress: { completed: number; total: number; percentage: number };
}

interface HealthSnapshot {
  api?: ApiHealthResponse;
  database?: DatabaseHealthResponse;
  runtime?: RuntimeHealthResponse;
  setup?: SetupHealthResponse;
  latencyMs?: number;
  checkedAt?: number;
}

export function AdminCenterOverview({
  accessibleItems,
  isLoading,
}: {
  accessibleItems: SettingsPageItem[];
  isLoading: boolean;
}) {
  const { snapshot, probes, loading, refreshing, error, refresh } = useAdminCenterHealth();
  const state = getAdminHealthState({
    apiHealthy: snapshot.api ? snapshot.api.status === 'healthy' : undefined,
    databaseHealthy: snapshot.database ? snapshot.database.status === 'healthy' : undefined,
    loading,
  });
  const setup = snapshot.setup?.progress;
  const queue = snapshot.database?.databaseInfo?.uploadQueueStats;
  const memory = snapshot.runtime?.memory;
  const heapPercent = memory?.heapTotalBytes
    ? Math.min(100, Math.round((memory.heapUsedBytes / memory.heapTotalBytes) * 100))
    : undefined;
  const setupIssues = useMemo(() => {
    const definitions = new Map(platformSetupFeatures.map(feature => [feature.id, feature]));
    return (snapshot.setup?.features || [])
      .filter(feature => !feature.ready)
      .map(feature => ({ ...feature, definition: definitions.get(feature.id) }))
      .filter(item => item.definition)
      .slice(0, 5);
  }, [snapshot.setup]);

  return (
    <div className="min-h-full bg-background dark:bg-[#0b0f14] text-foreground dark:text-[#e7edf4]">
      <header className="border-b border-border dark:border-[#202936] bg-card dark:bg-[#10161e] px-4 py-4 sm:px-5 lg:px-7">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-md border border-border dark:border-[#29405a] bg-info/10 dark:bg-[#142333] text-info dark:text-[#69aaf0]">
                <Server className="h-[17px] w-[17px]" strokeWidth={1.8} />
              </span>
              <div>
                <h1 className="text-base font-semibold tracking-[-0.01em] text-foreground dark:text-white">Admin Center</h1>
                <p className="mt-0.5 text-xs text-muted-foreground dark:text-[#8d9aac]">Platform health, runtime signals, and configuration readiness</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border dark:border-[#2a3442] bg-muted dark:bg-[#151c25] px-3 py-2 text-xs font-medium text-foreground/80 dark:text-[#b8c3d1]">
              Production
            </span>
            <span className="rounded-md border border-border dark:border-[#2a3442] bg-muted dark:bg-[#151c25] px-3 py-2 text-xs text-muted-foreground dark:text-[#8d9aac]">
              Live · 30s refresh
            </span>
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border dark:border-[#315b82] bg-info/10 dark:bg-[#15324c] px-3 text-xs font-semibold text-info dark:text-[#cde7ff] transition hover:bg-info/20 dark:hover:bg-[#1a3c5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5aa7ef] disabled:cursor-wait disabled:opacity-70"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-5 lg:px-7 lg:py-6">
        <StatusBand state={state} checkedAt={snapshot.checkedAt} error={error} />

        <section aria-label="Platform health metrics" className="mt-4 grid gap-px overflow-hidden rounded-lg border border-border dark:border-[#222c39] bg-border dark:bg-[#222c39] sm:grid-cols-2 xl:grid-cols-5">
          <Metric icon={Activity} label="API probe" value={snapshot.latencyMs === undefined ? '—' : `${snapshot.latencyMs} ms`} note="Browser to application" tone="blue" />
          <Metric icon={Database} label="Database" value={snapshot.database?.timings?.total === undefined ? '—' : `${snapshot.database.timings.total} ms`} note="Connection + queries" tone={snapshot.database?.status === 'unhealthy' ? 'red' : 'green'} />
          <Metric icon={Clock3} label="Server uptime" value={formatServerUptime(snapshot.runtime?.uptimeSeconds ?? snapshot.api?.uptime)} note={snapshot.runtime?.runtime || 'Current process'} tone="purple" />
          <Metric icon={Workflow} label="Queue" value={queue ? `${toQueueCount(queue.queued_jobs)} waiting` : '—'} note={queue ? `${toQueueCount(queue.processing_jobs)} processing · ${toQueueCount(queue.failed_jobs)} failed` : 'Upload jobs'} tone={toQueueCount(queue?.failed_jobs) > 0 ? 'amber' : 'green'} />
          <Metric icon={Settings2} label="Setup health" value={setup ? `${setup.percentage}%` : '—'} note={setup ? `${setup.completed} of ${setup.total} required` : `${accessibleItems.length} accessible settings`} tone={setup && setup.percentage < 100 ? 'amber' : 'green'} />
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.75fr)]">
          <Panel title="Live probe latency" subtitle="Real round-trip samples collected while this console is open" action={<span className="text-[11px] text-muted-foreground dark:text-[#77869a]">Last {probes.length} probes</span>}>
            <AdminCenterProbeChart probes={probes} />
          </Panel>
          <Panel title="Setup health" subtitle="Required platform configuration" action={<Link href="/settings?adminTab=hr-setup" className="text-[11px] font-semibold text-info dark:text-[#71b5f5] hover:text-info dark:hover:text-[#a6d4ff]">Open setup</Link>}>
            <SetupGauge progress={setup} />
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Panel title="Service health" subtitle="Checks from the running application" action={<Link href="/system-status" className="inline-flex items-center gap-1 text-[11px] font-semibold text-info dark:text-[#71b5f5] hover:text-info dark:hover:text-[#a6d4ff]">System status <ExternalLink className="h-3 w-3" /></Link>}>
            <ServiceTable snapshot={snapshot} loading={loading || isLoading} />
          </Panel>
          <Panel title="Runtime resources" subtitle="Current Node.js process memory" action={<span className="text-[11px] text-muted-foreground dark:text-[#77869a]">{snapshot.runtime?.version ? `v${snapshot.runtime.version}` : 'Application server'}</span>}>
            <RuntimeResources memory={memory} heapPercent={heapPercent} />
          </Panel>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Panel title="Setup attention" subtitle="Incomplete configuration that can affect platform readiness">
            <SetupAttention issues={setupIssues} loading={!snapshot.setup && loading} />
          </Panel>
          <Panel title="Operations notes" subtitle="How to interpret this console">
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Note icon={Activity} title="Live signals" text="Latency and runtime values come from the active application process and refresh every 30 seconds." />
              <Note icon={ShieldCheck} title="Safe checks" text="Storage write tests are intentionally not run automatically. Use System Status for an on-demand check." />
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}

function useAdminCenterHealth() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot>({});
  const [probes, setProbes] = useState<HealthProbePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const mounted = useRef(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(PROBE_STORAGE_KEY);
      if (stored) setProbes(JSON.parse(stored) as HealthProbePoint[]);
    } catch {
      sessionStorage.removeItem(PROBE_STORAGE_KEY);
    }
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    const fetchJson = async <T,>(url: string): Promise<T> => {
      const response = await fetch(url, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || payload.error || `Health check failed (${response.status})`);
      return payload as T;
    };

    let apiLatencyMs: number | undefined;
    const fetchApiHealth = async () => {
      const startedAt = performance.now();
      try {
        return await fetchJson<ApiHealthResponse>('/api/health');
      } finally {
        apiLatencyMs = Math.max(1, Math.round(performance.now() - startedAt));
      }
    };

    const [apiResult, databaseResult, runtimeResult, setupResult] = await Promise.allSettled([
      fetchApiHealth(),
      fetchJson<DatabaseHealthResponse>('/api/health/database'),
      fetchJson<RuntimeHealthResponse>('/api/health/runtime'),
      fetchJson<SetupHealthResponse>('/api/settings/platform-setup/status'),
    ]);
    const latencyMs = apiLatencyMs ?? 0;
    const checkedAt = Date.now();
    if (!mounted.current) return;

    setSnapshot(previous => ({
      api: apiResult.status === 'fulfilled' ? apiResult.value : { status: 'unhealthy' },
      database: databaseResult.status === 'fulfilled' ? databaseResult.value : { status: 'unhealthy' },
      runtime: runtimeResult.status === 'fulfilled' ? runtimeResult.value : previous.runtime,
      setup: setupResult.status === 'fulfilled' ? setupResult.value : previous.setup,
      latencyMs,
      checkedAt,
    }));
    const failed = [apiResult, databaseResult, runtimeResult, setupResult].filter(result => result.status === 'rejected');
    setError(failed.length ? `${failed.length} health ${failed.length === 1 ? 'check is' : 'checks are'} unavailable` : undefined);
    setProbes(previous => {
      const next = appendHealthProbe(previous, { checkedAt, latencyMs });
      sessionStorage.setItem(PROBE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, [load]);

  useVisibilityInterval(load, POLL_INTERVAL_MS, true);

  return { snapshot, probes, loading, refreshing, error, refresh: () => void load() };
}

function StatusBand({ state, checkedAt, error }: { state: AdminHealthState; checkedAt?: number; error?: string }) {
  const content = {
    operational: { icon: CheckCircle2, title: 'All checked systems operational', detail: 'Application and database probes are responding normally', color: 'hsl(var(--success))', border: 'hsl(var(--success) / 0.35)', bg: 'hsl(var(--success) / 0.08)' },
    degraded: { icon: AlertTriangle, title: 'Platform health degraded', detail: error || 'One or more supporting services need attention', color: 'hsl(var(--warning))', border: 'hsl(var(--warning) / 0.4)', bg: 'hsl(var(--warning) / 0.1)' },
    unavailable: { icon: AlertTriangle, title: 'Application unavailable', detail: error || 'The application health probe did not respond', color: 'hsl(var(--destructive))', border: 'hsl(var(--destructive) / 0.35)', bg: 'hsl(var(--destructive) / 0.08)' },
    checking: { icon: LoaderCircle, title: 'Checking platform health', detail: 'Collecting live signals from this server', color: 'hsl(var(--info))', border: 'hsl(var(--info) / 0.35)', bg: 'hsl(var(--info) / 0.08)' },
  }[state];
  const Icon = content.icon;

  return (
    <section className="flex flex-col justify-between gap-3 rounded-lg border px-4 py-3.5 sm:flex-row sm:items-center" style={{ borderColor: content.border, backgroundColor: content.bg }} aria-live="polite">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 shrink-0 ${state === 'checking' ? 'animate-spin' : ''}`} style={{ color: content.color }} />
        <div>
          <h2 className="text-sm font-semibold text-foreground dark:text-white">{content.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground dark:text-[#9eabb9]">{content.detail}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-[#8d9aac]">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: content.color }} />
        {checkedAt ? `Checked ${new Date(checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Starting checks'}
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof Activity; label: string; value: string; note: string; tone: 'blue' | 'green' | 'amber' | 'red' | 'purple' }) {
  const colors = { blue: 'hsl(var(--info))', green: 'hsl(var(--success))', amber: 'hsl(var(--warning))', red: 'hsl(var(--destructive))', purple: 'hsl(var(--chart-5))' };
  return (
    <div className="min-h-[112px] bg-card dark:bg-[#111821] p-4">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground dark:text-[#7f8da0]">
        <Icon className="h-3.5 w-3.5" style={{ color: colors[tone] }} strokeWidth={1.8} /> {label}
      </div>
      <div className="mt-3 text-[22px] font-semibold tracking-[-0.035em] text-foreground dark:text-white">{value}</div>
      <p className="mt-1 truncate text-[11px] text-muted-foreground dark:text-[#748296]">{note}</p>
    </div>
  );
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border dark:border-[#222c39] bg-card dark:bg-[#111821]">
      <div className="flex min-h-[62px] items-center justify-between gap-3 border-b border-border dark:border-[#222c39] px-4 py-3">
        <div>
          <h2 className="text-[13px] font-semibold text-foreground dark:text-[#eef3f8]">{title}</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground dark:text-[#77869a]">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SetupGauge({ progress }: { progress?: SetupHealthResponse['progress'] }) {
  const percentage = progress?.percentage ?? 0;
  return (
    <div className="flex min-h-[248px] items-center justify-center gap-8 p-5">
      <div className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(hsl(var(--success)) ${percentage * 3.6}deg, hsl(var(--muted)) 0deg)` }}>
        <div className="grid h-[108px] w-[108px] place-items-center rounded-full bg-card dark:bg-[#111821] text-center">
          <div><div className="text-3xl font-semibold tracking-[-0.04em] text-foreground dark:text-white">{progress ? `${percentage}%` : '—'}</div><div className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-foreground dark:text-[#758397]">Ready</div></div>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground dark:text-[#8e9bad]">Required configuration</p>
        <p className="mt-2 text-xl font-semibold text-foreground dark:text-white">{progress ? `${progress.completed} / ${progress.total}` : 'Loading'}</p>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground dark:text-[#77869a]">Complete the remaining setup items to make every enabled workflow ready for your team.</p>
      </div>
    </div>
  );
}

function ServiceTable({ snapshot, loading }: { snapshot: HealthSnapshot; loading: boolean }) {
  const services = [
    { name: 'Application API', detail: snapshot.runtime?.runtime || 'Web application', status: snapshot.api?.status === 'healthy' ? 'Operational' : loading ? 'Checking' : 'Unavailable', latency: snapshot.latencyMs },
    { name: 'PostgreSQL database', detail: 'Primary data store', status: snapshot.database?.status === 'healthy' ? 'Operational' : loading ? 'Checking' : 'Degraded', latency: snapshot.database?.timings?.total },
    { name: 'Background queue', detail: `${toQueueCount(snapshot.database?.databaseInfo?.uploadQueueStats?.queued_jobs)} jobs waiting`, status: toQueueCount(snapshot.database?.databaseInfo?.uploadQueueStats?.failed_jobs) > 0 ? 'Attention' : snapshot.database ? 'Operational' : 'Checking' },
    { name: 'Platform configuration', detail: snapshot.setup ? `${snapshot.setup.progress.completed} required items ready` : 'Setup readiness', status: snapshot.setup?.progress.percentage === 100 ? 'Operational' : snapshot.setup ? 'Attention' : 'Checking' },
  ];
  return (
    <div className="divide-y divide-border dark:divide-[#202a36]">
      {services.map(service => <ServiceRow key={service.name} {...service} />)}
    </div>
  );
}

function ServiceRow({ name, detail, status, latency }: { name: string; detail: string; status: string; latency?: number }) {
  const color = status === 'Operational' ? 'hsl(var(--success))' : status === 'Checking' ? 'hsl(var(--info))' : status === 'Attention' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';
  return (
    <div className="grid min-h-[61px] grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-4 py-3">
      <div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground dark:text-[#dfe7ef]">{name}</p><p className="mt-1 truncate text-[10px] text-muted-foreground dark:text-[#718095]">{detail}</p></div>
      <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color }}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />{status}</div>
      <div className="w-14 text-right font-mono text-[10px] text-muted-foreground dark:text-[#77869a]">{latency === undefined ? '—' : `${latency} ms`}</div>
    </div>
  );
}

function RuntimeResources({ memory, heapPercent }: { memory?: RuntimeHealthResponse['memory']; heapPercent?: number }) {
  const formatMemory = (bytes?: number) => bytes === undefined ? '—' : `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  const resources = [
    { label: 'Heap usage', value: heapPercent === undefined ? '—' : `${heapPercent}%`, detail: `${formatMemory(memory?.heapUsedBytes)} of ${formatMemory(memory?.heapTotalBytes)}`, percent: heapPercent || 0, icon: MemoryStick, color: 'hsl(var(--info))' },
    { label: 'Resident memory', value: formatMemory(memory?.rssBytes), detail: 'Process RSS', percent: memory ? Math.min(100, Math.round(memory.rssBytes / 1024 / 1024 / 10.24)) : 0, icon: Server, color: 'hsl(var(--chart-5))' },
    { label: 'External memory', value: formatMemory(memory?.externalBytes), detail: 'Native and buffer data', percent: memory ? Math.min(100, Math.round(memory.externalBytes / Math.max(memory.rssBytes, 1) * 100)) : 0, icon: HardDrive, color: 'hsl(var(--success))' },
  ];
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-3">
      {resources.map(resource => {
        const Icon = resource.icon;
        return <div key={resource.label} className="rounded-md border border-border dark:border-[#222c39] bg-muted/40 dark:bg-[#0d141c] p-3.5"><div className="flex items-center justify-between"><Icon className="h-4 w-4" style={{ color: resource.color }} /><span className="text-base font-semibold text-foreground dark:text-white">{resource.value}</span></div><p className="mt-4 text-[11px] font-semibold text-muted-foreground dark:text-[#a8b3c1]">{resource.label}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted dark:bg-[#26313e]"><div className="h-full rounded-full" style={{ width: `${resource.percent}%`, backgroundColor: resource.color }} /></div><p className="mt-2 truncate text-[10px] text-muted-foreground dark:text-[#657488]">{resource.detail}</p></div>;
      })}
    </div>
  );
}

function SetupAttention({ issues, loading }: { issues: Array<PlatformSetupFeatureStatus & { definition: (typeof platformSetupFeatures)[number] | undefined }>; loading: boolean }) {
  if (loading) return <div className="flex h-32 items-center justify-center text-xs text-muted-foreground dark:text-[#718095]"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Checking configuration</div>;
  if (!issues.length) return <div className="flex h-32 flex-col items-center justify-center text-center"><CheckCircle2 className="h-6 w-6 text-success" /><p className="mt-2 text-xs font-semibold text-foreground dark:text-[#dfe7ef]">Required setup is complete</p></div>;
  return (
    <div className="divide-y divide-border dark:divide-[#202a36]">
      {issues.map(issue => (
        <Link key={issue.id} href={issue.definition?.href || '/settings'} className="group flex min-h-[58px] items-center gap-3 px-4 py-3 hover:bg-muted dark:hover:bg-[#151e28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5aa7ef]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-warning" />
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-foreground dark:text-[#dfe7ef]">{issue.definition?.title}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground dark:text-[#718095]">{issue.definition?.description}</span></span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground dark:text-[#627186] transition-transform group-hover:translate-x-0.5 group-hover:text-info dark:hover:text-[#89bff2]" />
        </Link>
      ))}
    </div>
  );
}

function Note({ icon: Icon, title, text }: { icon: typeof Activity; title: string; text: string }) {
  return <div className="rounded-md border border-border dark:border-[#222c39] bg-muted/40 dark:bg-[#0d141c] p-3.5"><Icon className="h-4 w-4 text-info dark:text-[#69aaf0]" /><h3 className="mt-3 text-xs font-semibold text-foreground dark:text-[#dfe7ef]">{title}</h3><p className="mt-1.5 text-[11px] leading-5 text-muted-foreground dark:text-[#718095]">{text}</p></div>;
}
