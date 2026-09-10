"use client";

import * as React from 'react';
import Image from 'next/image';
import { AlertTriangle, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, ChevronDown, Clock3, ExternalLink, Filter, GraduationCap, HeartPulse, History, RefreshCw, Scale, Search, ShieldCheck, ShieldAlert, Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { HrisEmptyState, HrisSurface } from '@/components/hris/HrisWorkspacePrimitives';
import { cn } from '@/lib/utils';

type Row = Record<string, unknown>;

interface Props {
  data: { requests: Row[]; balances: Row[] };
  canManage: boolean;
  submitting: boolean;
  act: (body: Row, successMessage: string) => Promise<unknown>;
}

const pendingStatuses = new Set(['pending', 'submitted', 'pending_approval', 'pending_manager_approval', 'pending_department_approval', 'pending_hr_approval']);

const value = (input: unknown, fallback = '—') => input === null || input === undefined || input === '' ? fallback : String(input);
const number = (input: unknown) => Number.isFinite(Number(input)) ? Number(input) : 0;
const isPending = (row: Row) => pendingStatuses.has(value(row.status, '').toLowerCase());
const person = (row: Row) => `${value(row.first_name, 'Employee')} ${value(row.last_name, '')}`.trim();
const initials = (row: Row) => `${value(row.first_name, '').charAt(0)}${value(row.last_name, '').charAt(0)}`.toUpperCase() || 'EE';
const dayMonth = (input: unknown) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(new Date(String(input)));
const dateRange = (row: Row) => `${dayMonth(row.start_date)} – ${dayMonth(row.end_date)} ${new Date(String(row.end_date)).getFullYear()}`;

const dateRangeHeading = (row: Row) => {
  const start = new Date(String(row.start_date));
  const end = new Date(String(row.end_date));
  const startMonth = new Intl.DateTimeFormat('en', { month: 'short' }).format(start);
  const endMonth = new Intl.DateTimeFormat('en', { month: 'short' }).format(end);
  return startMonth === endMonth
    ? `${startMonth} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`
    : `${startMonth} ${start.getDate()}–${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
};

export function LeaveDecisionQueueReference({ data, canManage, submitting, act }: Props) {
  const [status, setStatus] = React.useState('pending');
  const [query, setQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [selected, setSelected] = React.useState<Row | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const requests = data.requests;
  const balances = data.balances;
  const filtered = requests.filter(row => (status === 'all' || (status === 'pending' ? isPending(row) : row.status === status)) && `${person(row)} ${value(row.policy_name, '')}`.toLowerCase().includes(query.toLowerCase()));
  const available = balances.reduce((sum, row) => sum + number(row.available), 0);
  const metricValues = [available, requests.filter(isPending).length, requests.filter(row => row.status === 'approved').length, balances.reduce((sum, row) => sum + number(row.expiring), 0)];
  const selectedRows = filtered.filter(row => selectedIds.has(value(row.id)));
  const allVisibleSelected = filtered.length > 0 && filtered.every(row => selectedIds.has(value(row.id)));
  const toggleSelected = (id: string) => setSelectedIds(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const toggleAllVisible = () => setSelectedIds(current => { const next = new Set(current); if (allVisibleSelected) filtered.forEach(row => next.delete(value(row.id))); else filtered.forEach(row => next.add(value(row.id))); return next; });
  const bulkCommit = async (decision: 'approved' | 'returned_for_revision' | 'rejected') => {
    for (const row of selectedRows) {
      await act({ action: 'request_decision', id: row.id, decision, expectedVersion: row.version, comment: decision === 'approved' ? null : 'Bulk decision from the leave request queue.' }, `Leave request ${decision.replace(/_/g, ' ')}.`);
    }
    setSelectedIds(new Set());
  };

  return <div className="min-w-0 space-y-2">
      <div className="flex h-11 items-stretch justify-start gap-1 overflow-x-auto py-1">
        <SummaryFilter icon={CalendarDays} tone="blue" label="Available" count={metricValues[0]} active={status === 'all'} onClick={() => setStatus('all')} />
        <SummaryFilter icon={Clock3} tone="amber" label="Needs action" count={metricValues[1]} active={status === 'pending'} onClick={() => setStatus('pending')} />
        <SummaryFilter icon={CheckCircle2} tone="green" label="Upcoming" count={metricValues[2]} active={status === 'approved'} onClick={() => setStatus('approved')} />
        <SummaryFilter icon={ShieldAlert} tone="violet" label="Expiring soon" count={metricValues[3]} active={false} onClick={() => setStatus('all')} />
      </div>

      <HrisSurface className="min-w-0 overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2"><h2 className="font-semibold">Decision Queue</h2><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{filtered.length}</span></div><p className="mt-1 text-sm text-muted-foreground">Review requests, confirm coverage, and respond.</p></div>
          <div className="flex flex-wrap items-center justify-end gap-2">{selectedRows.length > 0 && <div className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 p-1"><span className="px-2 text-xs font-semibold text-primary">{selectedRows.length} selected</span><Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-emerald-400" disabled={submitting} onClick={() => void bulkCommit('approved')}><Check className="mr-1 h-4 w-4" />Approve</Button><Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-amber-400" disabled={submitting} onClick={() => void bulkCommit('returned_for_revision')}><RefreshCw className="mr-1 h-4 w-4" />Return</Button><Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-rose-400" disabled={submitting} onClick={() => void bulkCommit('rejected')}><X className="mr-1 h-4 w-4" />Reject</Button></div>}<Button variant="outline" size="sm" className="h-9" onClick={() => setShowFilters(current => !current)}><Filter className="mr-2 h-4 w-4" />Filters</Button><select aria-label="Filter by status" className="h-9 w-40 rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={event => setStatus(event.target.value)}><option value="pending">Status: Pending</option><option value="all">Status: All</option><option value="approved">Status: Approved</option><option value="rejected">Status: Rejected</option></select></div>
        </div>
        {showFilters && <div className="border-b border-border/70 bg-muted/15 px-5 py-3"><div className="relative max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search employee or leave type" value={query} onChange={event => setQuery(event.target.value)} /></div></div>}
        {filtered.length ? <>
          <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[900px] table-fixed text-left text-[12px]">
            <thead className="border-b border-border/70 text-[11px] text-muted-foreground"><tr><th className="w-[4%] px-3 py-3 text-center font-medium"><input type="checkbox" aria-label="Select all visible requests" checked={allVisibleSelected} onChange={toggleAllVisible} className="h-4 w-4 rounded border-border accent-primary" /></th><th className="w-[15%] px-3 py-3 font-medium">Employee</th><th className="w-[13%] px-3 py-3 font-medium">Leave Type</th><th className="w-[15%] px-3 py-3 font-medium">Date Range</th><th className="w-[7%] px-3 py-3 font-medium">Duration</th><th className="w-[14%] px-3 py-3 font-medium">Coverage</th><th className="w-[11%] px-3 py-3 font-medium">Status</th><th className="w-[21%] px-4 py-3 text-right font-medium">Actions</th></tr></thead>
            <tbody className="divide-y divide-border/70">{filtered.map((row, index) => <React.Fragment key={value(row.id, String(index))}><tr className="cursor-pointer hover:bg-primary/[0.04]" onClick={() => setSelected(row)}>
              <td className="px-3 py-3 text-center" onClick={event => event.stopPropagation()}><input type="checkbox" aria-label={`Select ${person(row)}`} checked={selectedIds.has(value(row.id))} onChange={() => toggleSelected(value(row.id))} className="h-4 w-4 rounded border-border accent-primary" /></td>
              <td className="px-3 py-3"><div className="flex items-center gap-2.5"><span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold', ['bg-blue-500/25 text-blue-300','bg-cyan-500/25 text-cyan-300','bg-violet-500/25 text-violet-300','bg-amber-500/25 text-amber-300','bg-blue-500/25 text-blue-300','bg-fuchsia-500/25 text-fuchsia-300','bg-green-500/25 text-green-300'][index % 7])}>{initials(row)}</span><div className="min-w-0"><p className="truncate font-semibold">{person(row)}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{value(row.employee_number)}</p></div></div></td>
              <td className="px-3 py-3"><div className="flex items-center gap-2"><LeaveIcon type={row.policy_name} /><span className="truncate">{value(row.policy_name)}</span></div></td>
              <td className="px-3 py-3"><p className="font-medium">{dateRange(row)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{new Intl.DateTimeFormat('en',{weekday:'short'}).format(new Date(String(row.start_date)))} – {new Intl.DateTimeFormat('en',{weekday:'short'}).format(new Date(String(row.end_date)))}</p></td>
              <td className="px-3 py-3 font-medium">{number(row.days)} {number(row.days) === 1 ? 'day' : 'days'}</td>
              <td className={cn('px-3 py-3 leading-4', String(row.coverage).startsWith('Partial') ? 'text-amber-400' : 'text-muted-foreground')}>{value(row.coverage, 'Coverage confirmed')}</td>
              <td className="px-3 py-3"><p className="flex items-center gap-1.5 font-medium"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Pending</p><p className="mt-0.5 text-[10px] text-muted-foreground">Requested {new Date(String(row.submitted_at || row.created_at)).getDate()} Aug</p></td>
              <td className="px-4 py-3"><div className="flex justify-end gap-1.5" onClick={event => event.stopPropagation()}><DecisionButton tone="approve" icon={Check} label="Approve" onClick={() => setSelected(row)} /><DecisionButton tone="return" icon={RefreshCw} label="Return" onClick={() => setSelected(row)} /><DecisionButton tone="reject" icon={X} label="Reject" onClick={() => setSelected(row)} /></div></td>
            </tr>{row.policy_warning ? <tr><td colSpan={8} className="px-3 pb-3 pt-2"><div className="flex items-center gap-2 rounded-md bg-amber-500/15 px-3 py-2 text-[11px] text-amber-300"><AlertTriangle className="h-4 w-4" /><span className="flex-1">{value(row.policy_warning)}</span><button className="font-medium text-blue-400" onClick={() => setSelected(row)}>View policy</button></div></td></tr> : null}</React.Fragment>)}</tbody>
          </table></div>
          <div className="divide-y divide-border/70 lg:hidden">{filtered.map((row, index) => <button key={value(row.id, String(index))} className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setSelected(row)}><span className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">{initials(row)}</span><span className="min-w-0 flex-1"><span className="block truncate font-medium">{person(row)}</span><span className="block truncate text-xs text-muted-foreground">{value(row.policy_name)} · {dateRange(row)}</span></span><span className="text-xs text-amber-400">Pending</span></button>)}</div>
          <div className="border-t border-border/70 px-5 py-4 text-[11px] text-muted-foreground">Showing 1 to {filtered.length} of {filtered.length} requests</div>
        </> : <HrisEmptyState title="No leave requests match" description="Adjust the filters to see more requests." />}
      </HrisSurface>

    <ImpactRequestDrawer request={selected} balances={balances} canManage={canManage} submitting={submitting} act={act} onClose={() => setSelected(null)} />
  </div>;
}

function SummaryFilter({ icon: Icon, tone, label, count, active, onClick }: { icon: React.ComponentType<{ className?: string }>; tone: 'blue' | 'amber' | 'green' | 'violet'; label: string; count: React.ReactNode; active: boolean; onClick: () => void }) {
  const tones = { blue: 'bg-blue-500/15 text-blue-400', amber: 'bg-amber-500/15 text-amber-400', green: 'bg-emerald-500/15 text-emerald-400', violet: 'bg-violet-500/15 text-violet-400' };
  return <button type="button" className={cn('flex min-w-36 flex-none items-center justify-start gap-2 rounded-md border px-3 py-1 text-left transition-colors', active ? 'border-primary/45 bg-primary/10' : 'border-transparent hover:bg-muted/40')} onClick={onClick}><span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-md', tones[tone])}><Icon className="h-3.5 w-3.5" /></span><span className="text-[11px] font-medium text-muted-foreground">{label}</span><span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">{count}</span></button>;
}

function LeaveIcon({ type }: { type: unknown }) { const lower = String(type).toLowerCase(); const Icon = lower.includes('personal') ? HeartPulse : lower.includes('exam') ? GraduationCap : BriefcaseBusiness; return <Icon className={cn('h-4 w-4', lower.includes('personal') ? 'text-rose-400' : lower.includes('exam') ? 'text-orange-400' : 'text-amber-400')} />; }

function DecisionButton({ tone, icon: Icon, label, onClick }: { tone: 'approve' | 'return' | 'reject'; icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  const tones = { approve: 'border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300', return: 'border-amber-500/60 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300', reject: 'border-rose-500/60 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300' };
  return <Button size="sm" variant="outline" className={cn('h-8 px-2 text-[10px]', tones[tone])} onClick={onClick}><Icon className="mr-1 h-[18px] w-[18px]" />{label}</Button>;
}

function RequestDrawer({ request, balances, canManage, submitting, act, onClose }: { request: Row | null; balances: Row[]; canManage: boolean; submitting: boolean; act: Props['act']; onClose: () => void }) {
  const [decision, setDecision] = React.useState<'returned_for_revision' | 'rejected' | null>(null);
  const [comment, setComment] = React.useState('');
  React.useEffect(() => { setDecision(null); setComment(''); }, [request]);
  if (!request) return null;
  const balance = balances.find(row => row.policy_name === request.policy_name) || balances[0];
  const available = number(balance?.available);
  const commit = async (next: 'approved' | 'returned_for_revision' | 'rejected') => {
    const result = await act({ action: 'request_decision', id: request.id, decision: next, expectedVersion: request.version, comment: next === 'approved' ? null : comment.trim() }, `Leave request ${next.replace(/_/g, ' ')}.`);
    if (result) onClose();
  };
  return <Sheet open onOpenChange={open => { if (!open) onClose(); }}><SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-2xl"><SheetHeader className="border-b border-border/70 px-6 py-5 text-left"><div className="flex items-start gap-4 pr-9"><span className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 font-semibold text-primary">{initials(request)}</span><div className="flex-1"><SheetTitle>{person(request)}</SheetTitle><SheetDescription className="mt-1">{value(request.policy_name)} · {value(request.request_id)}</SheetDescription></div><span className="rounded-md border border-amber-500/60 px-2 py-1 text-[11px] text-amber-300">• Pending</span></div></SheetHeader><div className="flex-1 space-y-6 overflow-y-auto px-6 py-6"><DrawerSection title="Request summary"><div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border/70"><Stat label="Dates" value={dateRange(request)} /><Stat label="Duration" value={`${number(request.days)} days`} /><Stat label="Submitted" value={`${dayMonth(request.submitted_at)} 2026`} /></div><div className="mt-4 rounded-xl bg-muted/35 p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Reason</p><p className="mt-2 text-sm">{value(request.reason)}</p></div></DrawerSection><DrawerSection title="Balance impact"><div className="grid grid-cols-3 overflow-hidden rounded-xl border border-border/70"><Stat label="Before commitment" value={`${available + number(request.days)} days`} /><Stat label="This request" value={`−${number(request.days)} days`} /><Stat label="Available now" value={`${available} days`} /></div></DrawerSection><DrawerSection title="Decision support"><div className="divide-y divide-border/70 rounded-xl border border-border/70"><CheckRow label="Balance remains non-negative" detail={`${available} days remain available`} /><CheckRow label="Coverage is recorded" detail={value(request.coverage, 'Coverage confirmed')} /><CheckRow label="Request timeline recorded" detail={`Requested ${dayMonth(request.submitted_at)}`} /></div></DrawerSection>{decision && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"><Label htmlFor="decision-note">{decision === 'rejected' ? 'Reason for rejection' : 'Changes needed'}</Label><Textarea id="decision-note" className="mt-2 min-h-24 bg-background" value={comment} onChange={event => setComment(event.target.value)} placeholder="Add a clear note for the employee" /><div className="mt-3 flex justify-end gap-2"><Button variant="ghost" onClick={() => setDecision(null)}>Cancel</Button><Button disabled={submitting || comment.trim().length < 3} onClick={() => void commit(decision)}>Confirm {decision === 'rejected' ? 'rejection' : 'return'}</Button></div></div>}</div><SheetFooter className="border-t border-border/70 px-6 py-4">{canManage ? <div className="flex w-full justify-between"><div className="flex gap-2"><Button variant="outline" onClick={() => setDecision('returned_for_revision')}><RefreshCw className="mr-2 h-4 w-4" />Return</Button><Button variant="outline" className="border-destructive/50 text-destructive" onClick={() => setDecision('rejected')}><X className="mr-2 h-4 w-4" />Reject</Button></div><Button onClick={() => void commit('approved')}><Check className="mr-2 h-4 w-4" />Approve request</Button></div> : null}</SheetFooter></SheetContent></Sheet>;
}

function DrawerSection({ title, children }: React.PropsWithChildren<{ title: string }>) { return <section><h3 className="mb-3 font-semibold">{title}</h3>{children}</section>; }
function Stat({ label, value: statValue }: { label: string; value: React.ReactNode }) { return <div className="min-w-0 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1.5 text-sm font-semibold">{statValue}</p></div>; }
function CheckRow({ label, detail }: { label: string; detail: string }) { return <div className="flex gap-3 px-4 py-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{detail}</p></div></div>; }

function ImpactRequestDrawer({ request, balances, canManage, submitting, act, onClose }: { request: Row | null; balances: Row[]; canManage: boolean; submitting: boolean; act: Props['act']; onClose: () => void }) {
  const [decision, setDecision] = React.useState<'returned_for_revision' | 'rejected' | null>(null);
  const [comment, setComment] = React.useState('');
  const [openEvidence, setOpenEvidence] = React.useState<string | null>(null);
  React.useEffect(() => { setDecision(null); setComment(''); setOpenEvidence(null); }, [request]);
  if (!request) return null;

  const balance = balances.find(row => row.policy_name === request.policy_name) || balances[0];
  const available = number(balance?.available);
  const requestedDays = number(request.days);
  const beforeCommitment = available + requestedDays;
  const hasPolicyWarning = Boolean(request.policy_warning);
  const coverage = value(request.coverage, 'Coverage confirmed');
  const coverageOwner = coverage.replace(/^Covered by\s+/i, '') || 'Coverage confirmed';
  const requestedDate = dayMonth(request.submitted_at || request.created_at);

  const commit = async (next: 'approved' | 'returned_for_revision' | 'rejected') => {
    const result = await act({ action: 'request_decision', id: request.id, decision: next, expectedVersion: request.version, comment: next === 'approved' ? null : comment.trim() }, `Leave request ${next.replace(/_/g, ' ')}.`);
    if (result) onClose();
  };

  return <Sheet open onOpenChange={open => { if (!open) onClose(); }}>
    <SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-[610px]">
      <SheetHeader className="border-b border-border/70 px-6 py-5 text-left">
        <div className="flex items-start gap-3 pr-9">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/15 font-semibold text-primary">{initials(request)}</span>
          <div className="min-w-0 flex-1"><SheetTitle>{person(request)}</SheetTitle><SheetDescription className="mt-1">{value(request.policy_name)} · {value(request.request_id)}</SheetDescription></div>
          <span className="mt-0.5 rounded-md border border-amber-500/60 px-2 py-1 text-[11px] font-medium text-amber-300">• Pending</span>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className={cn('flex items-center gap-3 rounded-lg border px-4 py-3', hasPolicyWarning ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/40 bg-emerald-500/10')}>
          {hasPolicyWarning ? <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" /> : <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />}
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{hasPolicyWarning ? 'Review recommended' : 'Low-risk request'}</p><p className="mt-0.5 text-xs text-muted-foreground">{hasPolicyWarning ? value(request.policy_warning) : 'Balance, coverage, and policy checks are clear.'}</p></div>
          <span className="shrink-0 rounded-md border border-border/70 bg-background/25 px-2 py-1 text-[11px] font-medium">{hasPolicyWarning ? '2/3' : '3/3'} checks passed</span>
        </div>

        <div className="py-5">
          <h2 className="text-2xl font-semibold tracking-tight">{dateRangeHeading(request)}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{requestedDays} working {requestedDays === 1 ? 'day' : 'days'}</span><span className="h-4 w-px bg-border" /><span className="flex items-center gap-1.5"><History className="h-4 w-4" />Submitted {requestedDate}</span></div>
        </div>

        <section className="overflow-hidden rounded-xl border border-border/70 bg-muted/[0.12]">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-border/70 p-4 md:border-b-0 md:border-r">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Scale className="h-4 w-4" />Balance impact</h3>
              <div className="mt-4 grid grid-cols-3 gap-3"><ImpactStat label="Before" value={`${beforeCommitment} days`} /><ImpactStat label="Change" value={`−${requestedDays} days`} tone="negative" /><ImpactStat label="After" value={`${available} days`} tone="positive" /></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(8, Math.min(100, beforeCommitment ? (available / beforeCommitment) * 100 : 0))}%` }} /></div>
              <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground"><span>{beforeCommitment}</span><span>{available}</span></div>
            </div>
            <div className="p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" />Team coverage</h3>
              <div className="mt-4 flex items-center gap-3"><Image src="/leaves-riya-patel-avatar.png" alt="Riya Patel" width={40} height={40} className="h-10 w-10 rounded-full object-cover" /><div><p className="text-sm font-medium">{coverageOwner}</p><p className="text-xs text-emerald-400">Coverage confirmed</p></div></div>
              <button type="button" className="mt-4 flex min-h-9 items-center gap-1.5 text-xs font-medium text-primary hover:underline" onClick={() => setOpenEvidence(openEvidence === 'coverage' ? null : 'coverage')}>Open team calendar <ExternalLink className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <div className="border-t border-border/70 p-4"><p className="text-xs text-muted-foreground">Reason</p><p className="mt-1.5 text-sm leading-6">{value(request.reason)}</p></div>
        </section>

        <div className="mt-4 divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70">
          <EvidenceRow icon={ShieldCheck} title="Policy check" summary={hasPolicyWarning ? 'Needs review' : 'Within policy'} tone={hasPolicyWarning ? 'warning' : 'success'} detail={<DetailGrid items={hasPolicyWarning ? [['Requested duration', `${requestedDays} working days`], ['Policy limit', value(request.policy_limit, 'See configured leave policy')], ['Result', value(request.policy_warning)]] : [['Requested duration', `${requestedDays} working days`], ['Policy limit', value(request.policy_limit, 'See configured leave policy')], ['Remaining allowance', `${available} days`]]} />} open={openEvidence === 'policy'} onToggle={() => setOpenEvidence(openEvidence === 'policy' ? null : 'policy')} />
          <EvidenceRow icon={Users} title="Coverage detail" summary={coverage} tone="success" detail={<DetailGrid items={[["Coverage owner", coverageOwner], ['Coverage period', dateRangeHeading(request)], ['Team availability', value(request.team_availability, 'Not provided')], ['Handoff note', value(request.handoff_note, 'Not provided')]]} />} open={openEvidence === 'coverage'} onToggle={() => setOpenEvidence(openEvidence === 'coverage' ? null : 'coverage')} />
          <EvidenceRow icon={History} title="Activity" summary={`Requested ${requestedDate}`} detail={<div className="space-y-3"><ActivityItem time="09:18" label={`${person(request)} submitted the request`} /><ActivityItem time="09:22" label={`${coverageOwner} was recorded for coverage`} /><ActivityItem time="Now" label="Awaiting manager decision" active /></div>} open={openEvidence === 'activity'} onToggle={() => setOpenEvidence(openEvidence === 'activity' ? null : 'activity')} />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between"><Label htmlFor="decision-note">{decision === 'rejected' ? 'Reason for rejection' : decision === 'returned_for_revision' ? 'Changes needed' : 'Decision note (optional)'}</Label><span className="text-[11px] text-muted-foreground">{comment.length} / 250</span></div>
          <Textarea id="decision-note" maxLength={250} className={cn('mt-2 min-h-20 resize-none bg-background', decision === 'rejected' && 'border-destructive/60', decision === 'returned_for_revision' && 'border-amber-500/60')} value={comment} onChange={event => setComment(event.target.value)} placeholder={decision ? 'Add a clear note for the employee…' : 'Add a note for your decision…'} />
        </div>
      </div>

      <SheetFooter className="border-t border-border/70 px-6 py-4">
        {canManage ? decision ? <div className="grid w-full grid-cols-[auto_1fr] gap-2"><Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button><Button className={cn(decision === 'rejected' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')} disabled={submitting || comment.trim().length < 3} onClick={() => void commit(decision)}>Confirm {decision === 'rejected' ? 'rejection' : 'return'}</Button></div> : <div className="w-full space-y-2"><Button className="h-11 w-full" disabled={submitting || hasPolicyWarning} onClick={() => void commit('approved')}><Check className="mr-2 h-4 w-4" />Approve request</Button><div className="grid grid-cols-2 gap-2"><Button variant="outline" className="h-10" onClick={() => setDecision('returned_for_revision')}><RefreshCw className="mr-2 h-4 w-4" />Return</Button><Button variant="outline" className="h-10 border-destructive/50 text-destructive" onClick={() => setDecision('rejected')}><X className="mr-2 h-4 w-4" />Reject</Button></div></div> : null}
      </SheetFooter>
    </SheetContent>
  </Sheet>;
}

function ImpactStat({ label, value: statValue, tone }: { label: string; value: React.ReactNode; tone?: 'positive' | 'negative' }) {
  return <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className={cn('mt-1.5 whitespace-nowrap text-sm font-semibold tabular-nums', tone === 'positive' && 'text-emerald-400', tone === 'negative' && 'text-rose-400')}>{statValue}</p></div>;
}

function EvidenceRow({ icon: Icon, title, summary, detail, tone, open, onToggle }: { icon: React.ComponentType<{ className?: string }>; title: string; summary: string; detail: React.ReactNode; tone?: 'success' | 'warning'; open: boolean; onToggle: () => void }) {
  return <div><button type="button" className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30" aria-expanded={open} onClick={onToggle}><Icon className="h-5 w-5 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1 text-sm font-semibold">{title}</span><span className={cn('max-w-[45%] truncate text-xs', tone === 'success' ? 'text-emerald-400' : tone === 'warning' ? 'text-amber-400' : 'text-muted-foreground')}>{summary}</span><ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} /></button>{open && <div className="border-t border-border/50 bg-muted/20 px-12 py-3 text-xs leading-5 text-muted-foreground">{detail}</div>}</div>;
}

function DetailGrid({ items }: { items: Array<[string, string]> }) {
  return <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-2">{items.map(([label, detailValue]) => <div key={label} className="min-w-0"><dt className="text-[11px] uppercase tracking-wide text-muted-foreground/80">{label}</dt><dd className="mt-0.5 text-xs font-medium text-foreground">{detailValue}</dd></div>)}</dl>;
}

function ActivityItem({ time, label, active = false }: { time: string; label: string; active?: boolean }) {
  return <div className="grid grid-cols-[2.5rem_0.5rem_1fr] items-center gap-2"><span className="text-[11px] tabular-nums text-muted-foreground">{time}</span><span className={cn('h-2 w-2 rounded-full', active ? 'bg-primary' : 'bg-emerald-500')} /><span className={cn('text-xs', active ? 'font-medium text-foreground' : 'text-muted-foreground')}>{label}</span></div>;
}
