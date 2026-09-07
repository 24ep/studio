"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Check,
  Layers3,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Umbrella,
  UserCheck,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  HrisEmptyState,
  HrisMetric,
  HrisResponsiveRecords,
  HrisSectionHeader,
  HrisSurface,
  HrisWorkspaceHeader,
  hrisStatusTone,
} from '@/components/hris/HrisWorkspacePrimitives';
import { cn } from '@/lib/utils';
import { LeaveAllocationGuidedFlow } from '@/components/leaves/LeaveAllocationGuidedFlow';
import { LeaveDecisionQueueReference } from '@/components/leaves/LeaveDecisionQueueReference';
import { AssignmentRulesCommandCenter } from '@/components/leaves/AssignmentRulesCommandCenter';
import { LeaveEncashmentDecisionLedger } from '@/components/leaves/LeaveEncashmentDecisionLedger';

export type LeaveWorkspaceView = 'requests' | 'encashment' | 'control' | 'assignments' | 'allocation';
type Row = Record<string, unknown>;

interface LeaveWorkspaceData {
  metrics: Record<string, number>;
  requests: Row[];
  balances: Row[];
  policies: Row[];
  employees: Row[];
  assignments: Row[];
  encashments: Row[];
  ledger: Row[];
  periods: Row[];
  exceptions: Row[];
  allocationRuns: Row[];
}

export const pageCopy: Record<LeaveWorkspaceView, { eyebrow: string; title: string; description: string }> = {
  requests: {
    eyebrow: '',
    title: 'Time away, without the guesswork',
    description: 'Act on pending requests, protect coverage, and keep your team moving.',
  },
  encashment: {
    eyebrow: 'Leaves · Encashment',
    title: 'Leave encashment',
    description: 'Review requests, verify eligibility and estimated payroll impact, and approve for payment.',
  },
  control: {
    eyebrow: 'Leaves · Operations',
    title: 'Keep every leave balance explainable',
    description: 'Work exceptions, monitor approval bottlenecks, and control periods from an audit-ready operations desk.',
  },
  assignments: {
    eyebrow: 'Leaves · Eligibility',
    title: 'Assignment rules',
    description: 'Find, review, and manage effective-dated assignment rules and their population impact.',
  },
  allocation: {
    eyebrow: '',
    title: 'Leave allocation',
    description: 'Create plans, review employee impact, and track completed balance updates.',
  },
};

function text(value: unknown, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

function number(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUnits(value: unknown) {
  return `${number(value).toFixed(1)} d`;
}

function date(value: unknown, withTime = false) {
  if (!value) return '—';
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return text(value);
  return new Intl.DateTimeFormat('en', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
}

function person(row: Row) {
  return `${text(row.first_name, 'Employee')} ${text(row.last_name, '')}`.trim();
}

function labelize(value: unknown) {
  return text(value).replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function statusTone(status: unknown) {
  return hrisStatusTone(status);
}

function StatusBadge({ value }: { value: unknown }) {
  return (
    <Badge variant="outline" className={cn('whitespace-nowrap font-medium', statusTone(value))}>
      <span aria-hidden className="mr-1.5 text-[9px]">●</span>{labelize(value)}
    </Badge>
  );
}

function Surface({ children, className }: React.PropsWithChildren<{ className?: string }>) {
  return <HrisSurface className={className}>{children}</HrisSurface>;
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return <HrisSectionHeader title={title} description={description} action={action} />;
}

function Empty({ title, description }: { title: string; description: string }) {
  return <HrisEmptyState title={title} description={description} icon={Umbrella} />;
}

function Metric({
  label,
  value,
  helper,
  icon: Icon,
  urgent,
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  urgent?: boolean;
}) {
  return <HrisMetric label={label} value={value} helper={helper} icon={Icon} urgent={urgent} />;
}

function ResponsiveRecords({
  columns,
  rows,
  empty,
  rowKey = 'id',
}: {
  columns: Array<{ key: string; label: string; render?: (row: Row) => React.ReactNode; align?: 'right' }>;
  rows: Row[];
  empty: { title: string; description: string };
  rowKey?: string;
}) {
  return <HrisResponsiveRecords columns={columns} rows={rows} empty={empty} rowKey={rowKey} />;
}

function Field({ label, children, className }: React.PropsWithChildren<{ label: string; className?: string }>) {
  return <div className={cn('space-y-1.5', className)}><Label>{label}</Label>{children}</div>;
}

function NativeSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn('min-h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50', props.className)} />;
}

function useLeavesData(view: LeaveWorkspaceView) {
  const initialData = view === 'encashment' ? {
    metrics: {}, requests: [], balances: [], policies: [], employees: [], assignments: [],
    encashments: [], ledger: [], periods: [], exceptions: [], allocationRuns: [],
  } satisfies LeaveWorkspaceData : null;
  const [data, setData] = React.useState<LeaveWorkspaceData | null>(initialData);
  const [loading, setLoading] = React.useState(view !== 'encashment');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/hr/leaves?view=${view}`, { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Failed to load Leaves.');
      setData(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load Leaves.');
    } finally {
      setLoading(false);
    }
  }, [view]);

  React.useEffect(() => { void load(view === 'encashment'); }, [load, view]);

  const act = React.useCallback(async (body: Row, successMessage: string) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/hr/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'The leave action failed.');
      toast.success(successMessage);
      if (!String(body.action).endsWith('_preview')) await load(true);
      return payload.data;
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'The leave action failed.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [load]);

  return { data, loading, error, submitting, load, act };
}

export function LeaveWorkspacePage({ view, canManage }: { view: LeaveWorkspaceView; canManage: boolean }) {
  const state = useLeavesData(view);
  const copy = pageCopy[view];

  return (
    <main className={cn('min-h-full', view === 'allocation' ? 'bg-background' : 'bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.06),transparent_32rem)]')}>
      <div className={cn('mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-8', view === 'allocation' ? 'py-4' : 'py-5 lg:py-7')}>
        <HrisWorkspaceHeader
          eyebrow={view === 'assignments' ? '' : copy.eyebrow}
          title={copy.title}
          description={copy.description}
          compact={view === 'requests' || view === 'allocation' || view === 'assignments'}
          action={view === 'requests' ? (
            <div><Button asChild size="sm" className="h-8">
              <Link href="/ess/leave"><CalendarDays className="mr-2 h-4 w-4" />Request leave</Link>
            </Button></div>
          ) : view === 'allocation' ? (
            <Button asChild variant="ghost" size="sm"><Link href="/workforce/leave/control-panel"><LogOut className="mr-2 h-4 w-4" />Leave control panel</Link></Button>
          ) : undefined}
        />
        <div className="mt-5">
        {state.loading && view === 'requests' && <LeaveDecisionQueueReference data={{ requests: [], balances: [] }} canManage={canManage} submitting={state.submitting} act={state.act} />}
        {state.loading && view !== 'requests' && <LoadingState />}
        {!state.loading && state.error && (
          <Surface><div role="alert" className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <h2 className="mt-3 font-semibold">Leaves could not be loaded</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{state.error}</p>
            <Button className="mt-4" variant="outline" onClick={() => void state.load()}>Try again</Button>
          </div></Surface>
        )}
        {!state.loading && state.data && (
          <div className="space-y-5">
            {view === 'requests' && <LeaveDecisionQueueReference data={state.data} canManage={canManage} submitting={state.submitting} act={state.act} />}
            {view === 'encashment' && <EncashmentView data={state.data} canManage={canManage} submitting={state.submitting} act={state.act} />}
            {view === 'control' && <ControlView data={state.data} canManage={canManage} submitting={state.submitting} act={state.act} />}
            {view === 'assignments' && <AssignmentRulesCommandCenter data={state.data} canManage={canManage} submitting={state.submitting} act={state.act} />}
            {view === 'allocation' && <LeaveAllocationGuidedFlow data={state.data} canManage={canManage} submitting={state.submitting} act={state.act} />}
          </div>
        )}
        </div>
      </div>
    </main>
  );
}

function LoadingState() {
  return <div className="space-y-4"><div className="grid overflow-hidden rounded-2xl border bg-card sm:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="space-y-3 border-b p-5 sm:border-b-0 sm:border-r"><Skeleton className="h-4 w-24" /><Skeleton className="h-9 w-16" /><Skeleton className="h-3 w-32" /></div>)}</div><Skeleton className="h-[28rem] rounded-2xl" /></div>;
}

interface ViewProps {
  data: LeaveWorkspaceData;
  canManage: boolean;
  submitting: boolean;
  act: (body: Row, successMessage: string) => Promise<unknown>;
}

function RequestActions({ row, submitting, act }: { row: Row; submitting: boolean; act: ViewProps['act'] }) {
  const decide = (decision: string) => void act({
    action: 'request_decision', id: row.id, decision, expectedVersion: row.version,
    comment: decision === 'approved' ? null : window.prompt('Reason for this decision:') || null,
  }, `Leave request ${labelize(decision).toLowerCase()}.`);
  return <div className="flex justify-end gap-1"><Button size="sm" variant="ghost" disabled={submitting} onClick={() => decide('approved')}><Check className="h-4 w-4" /><span className="sr-only">Approve</span></Button><Button size="sm" variant="ghost" disabled={submitting} onClick={() => decide('returned_for_revision')}><RefreshCw className="h-4 w-4" /><span className="sr-only">Return</span></Button><Button size="sm" variant="ghost" disabled={submitting} onClick={() => decide('rejected')}><X className="h-4 w-4" /><span className="sr-only">Reject</span></Button></div>;
}

function EncashmentView({ data, canManage, submitting, act }: ViewProps) {
  const eligibleBalances = data.balances.filter(balance => balance.encashment_eligible === true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState({ balanceId: '', units: '', reason: '', paymentDestinationRef: '' });
  React.useEffect(() => { if (!form.balanceId && eligibleBalances[0]?.id) setForm(current => ({ ...current, balanceId: String(eligibleBalances[0].id) })); }, [eligibleBalances, form.balanceId]);
  const selected = eligibleBalances.find(balance => balance.id === form.balanceId);
  const max = selected ? Math.max(0, Math.min(number(selected.available) - number(selected.minimum_retained_balance), number(selected.maximum_encashment_units) || Number.POSITIVE_INFINITY)) : 0;
  const submit = async () => {
    if (!selected) return;
    const result = await act({
      action: 'create_encashment', employeeId: selected.employee_id, policyId: selected.policy_id,
      requestedUnits: Number(form.units), reason: form.reason, paymentDestinationRef: form.paymentDestinationRef || null,
      acknowledgment: true,
    }, 'Encashment request submitted and balance reserved.');
    if (result) {
      setForm(current => ({ ...current, units: '', reason: '', paymentDestinationRef: '' }));
      setDialogOpen(false);
    }
  };
  return <div className="space-y-4">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New encashment request</DialogTitle>
            <DialogDescription>The balance is reserved immediately; Payroll owns the final payment value.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
          <Field label="Employee and leave balance"><NativeSelect value={form.balanceId} onChange={event => setForm(current => ({ ...current, balanceId: event.target.value }))}><option value="">Select eligible balance</option>{eligibleBalances.map(balance => <option key={text(balance.id)} value={text(balance.id)}>{person(balance)} · {text(balance.policy_name)} · {formatUnits(balance.available)}</option>)}</NativeSelect></Field>
          {selected && <div className="grid grid-cols-3 gap-3 rounded-xl bg-muted/55 p-4 text-sm"><div><p className="text-xs text-muted-foreground">Available</p><p className="mt-1 font-semibold">{formatUnits(selected.available)}</p></div><div><p className="text-xs text-muted-foreground">Protected</p><p className="mt-1 font-semibold">{formatUnits(selected.minimum_retained_balance)}</p></div><div><p className="text-xs text-muted-foreground">Maximum</p><p className="mt-1 font-semibold">{formatUnits(max)}</p></div></div>}
          <Field label="Requested units"><Input type="number" min="0.5" step="0.5" max={max} value={form.units} onChange={event => setForm(current => ({ ...current, units: event.target.value }))} /></Field>
          <Field label="Reason"><Textarea className="min-h-24" value={form.reason} onChange={event => setForm(current => ({ ...current, reason: event.target.value }))} /></Field>
          <Field label="Payment destination reference (optional)"><Input value={form.paymentDestinationRef} onChange={event => setForm(current => ({ ...current, paymentDestinationRef: event.target.value }))} placeholder="Payroll destination reference" /></Field>
          <p className="text-xs leading-5 text-muted-foreground"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />Submitting confirms that the displayed units—not a monetary estimate—are being requested.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button disabled={submitting || !selected || !form.reason.trim() || number(form.units) <= 0 || number(form.units) > max} onClick={() => void submit()}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit and reserve units</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LeaveEncashmentDecisionLedger rows={data.encashments} canManage={canManage} submitting={submitting} onNewRequest={() => setDialogOpen(true)} act={act} />
  </div>;
}

function ControlView({ data, canManage, submitting, act }: ViewProps) {
  const metrics = data.metrics;
  return <div className="space-y-4">
    <Surface className="grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Pending requests" value={number(metrics.pendingRequests)} helper={`${number(metrics.overdueApprovals)} overdue approval(s)`} icon={CalendarClock} urgent={number(metrics.overdueApprovals) > 0} />
      <Metric label="Open exceptions" value={number(metrics.openExceptions)} helper={`${number(metrics.negativeBalances)} negative balance(s)`} icon={AlertTriangle} urgent={number(metrics.openExceptions) > 0} />
      <Metric label="Policy gaps" value={number(metrics.unassignedEmployees)} helper="Active employees without assignment" icon={UserCheck} urgent={number(metrics.unassignedEmployees) > 0} />
      <Metric label="Periods to close" value={number(metrics.periodsAwaitingClosure)} helper="Under review or ready to close" icon={Layers3} />
    </Surface>
    <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,.7fr)]">
      <Surface className="min-w-0 overflow-hidden">
        <SectionHeader title="Exception queue" description="Resolve operational breaks with a documented outcome." />
        <ResponsiveRecords rows={data.exceptions} empty={{ title: 'No open leave exceptions', description: 'Allocation, overlap, sync, and reconciliation exceptions will be listed here.' }} columns={[
          { key: 'exception', label: 'Exception', render: row => <div><p className="font-medium">{labelize(row.exception_type)}</p><p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">{text(row.message)}</p></div> },
          { key: 'employee', label: 'Employee', render: row => person(row) },
          { key: 'severity', label: 'Severity', render: row => <StatusBadge value={row.severity} /> },
          { key: 'age', label: 'Opened', render: row => date(row.created_at) },
          { key: 'action', label: '', align: 'right', render: row => canManage && row.status === 'open' ? <Button size="sm" variant="outline" disabled={submitting} onClick={() => { const resolution = window.prompt('Resolution note:'); if (resolution) void act({ action: 'resolve_exception', id: row.id, resolution }, 'Exception resolved.'); }}>Resolve</Button> : <StatusBadge value={row.status} /> },
        ]} />
      </Surface>
      <Surface className="overflow-hidden">
        <SectionHeader title="Leave periods" description="Closure checks unresolved requests before locking the period." />
        {data.periods.length ? <div className="divide-y divide-border/70">{data.periods.map(period => <article key={text(period.id)} className="p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{text(period.name)}</p><p className="mt-1 text-xs text-muted-foreground">{date(period.start_date)} — {date(period.end_date)}</p></div><StatusBadge value={period.status} /></div>
          {canManage && <div className="mt-4 flex justify-end"><Button size="sm" variant="outline" disabled={submitting} onClick={() => {
            const operation = period.status === 'closed' ? 'reopen' : 'close';
            const reason = window.prompt(`${labelize(operation)} reason:`);
            if (reason) void act({ action: 'period_action', periodId: period.id, operation, reason, expectedVersion: period.version }, `Leave period ${operation}d.`);
          }}>{period.status === 'closed' ? 'Reopen period' : 'Run closure check'}</Button></div>}
        </article>)}</div> : <Empty title="No leave periods configured" description="Create a calendar, fiscal, or custom leave year before running period controls." />}
      </Surface>
    </div>
    <Surface className="overflow-hidden">
      <SectionHeader title="Approval ageing" description="High-density queue for administrators; employee requests remain in Leave Request." />
      <ResponsiveRecords rows={data.requests.filter(request => ['pending', 'submitted', 'pending_approval', 'pending_manager_approval', 'pending_department_approval', 'pending_hr_approval'].includes(text(request.status, '')))} empty={{ title: 'No approvals waiting', description: 'New submitted requests will appear here for operational review.' }} columns={[
        { key: 'employee', label: 'Employee', render: row => <div><p className="font-medium">{person(row)}</p><p className="text-xs text-muted-foreground">{text(row.request_id)}</p></div> },
        { key: 'policy', label: 'Policy', render: row => text(row.policy_name) },
        { key: 'period', label: 'Period', render: row => `${date(row.start_date)} — ${date(row.end_date)}` },
        { key: 'units', label: 'Units', render: row => formatUnits(row.days) },
        { key: 'submitted', label: 'Submitted', render: row => date(row.submitted_at || row.created_at, true) },
        { key: 'action', label: '', align: 'right', render: row => canManage ? <RequestActions row={row} submitting={submitting} act={act} /> : null },
      ]} />
    </Surface>
  </div>;
}
