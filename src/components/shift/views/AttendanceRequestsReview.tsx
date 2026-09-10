"use client";

import * as React from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Link2,
  Paperclip,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { EmployeeAvatar, EmptyState, ErrorState, PermissionBanner } from '../ShiftShared';
import {
  employeeName,
  formatDate,
  formatTime,
  numberValue,
  stringValue,
  type ShiftCapabilities,
  type ShiftRecord,
} from '../shift-types';

type QueueKey = 'review' | 'warnings' | 'returned' | 'approved';

type AttendanceRequestsReviewProps = {
  requests: ShiftRecord[];
  capabilities: ShiftCapabilities;
  refreshing: boolean;
  saving: boolean;
  error: string | null;
  onRefresh: () => void;
  onDecision: (body: Record<string, unknown>, message: string) => Promise<unknown>;
};

const designPreviewRequests: ShiftRecord[] = [
  {
    id: '00000000-0000-4000-8000-000000000001', request_id: 'ACR-0813-001', version: 1,
    first_name: 'Maya', last_name: 'Chen', job_title: 'Product Designer', department_name: 'Product Design', profile_photo_url: '/learning/certificates/maya-chen-avatar.png',
    title: 'missing check-out · 2026-08-12', reason: 'I was assisting a customer in a late review and forgot to check out.', status: 'pending_approval', submitted_at: '2026-08-13T09:15:00+07:00',
    policy_warnings: ['Worked time exceeds 10h/day policy (8h 41m)'],
    original_values: { workDate: '2026-08-12', clockIn: '2026-08-12T09:01:00+07:00', clockOut: null, breakStart: '2026-08-12T12:30:00+07:00', breakEnd: '2026-08-12T13:00:00+07:00', breakMinutes: 30, workLocation: 'Office · New York' },
    requested_values: { workDate: '2026-08-12', clockIn: '2026-08-12T09:01:00+07:00', clockOut: '2026-08-12T18:12:00+07:00', breakStart: '2026-08-12T12:30:00+07:00', breakEnd: '2026-08-12T13:00:00+07:00', breakMinutes: 30, workLocation: 'Office · New York' },
    attachments: [{ name: 'Customer review notes.pdf', size: '312 KB', url: '#' }],
    activity: [
      { action: 'Maya Chen submitted request', createdAt: '2026-08-13T09:15:00+07:00' },
      { action: 'Request routed to you (Product Design)', createdAt: '2026-08-13T09:16:00+07:00' },
      { action: 'Policy check completed', createdAt: '2026-08-13T09:16:00+07:00' },
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000002', request_id: 'ACR-0813-002', version: 1,
    first_name: 'Daniel', last_name: 'Perez', job_title: 'Customer Success', department_name: 'Customer Success',
    title: 'missing check-in · 2026-08-13', reason: 'The mobile time clock did not register my arrival.', status: 'pending_approval', submitted_at: '2026-08-13T08:42:00+07:00',
    original_values: { workDate: '2026-08-13', clockIn: null, clockOut: '2026-08-13T18:04:00+07:00', breakMinutes: 45 },
    requested_values: { workDate: '2026-08-13', clockIn: '2026-08-13T08:55:00+07:00', clockOut: '2026-08-13T18:04:00+07:00', breakMinutes: 45 },
  },
  {
    id: '00000000-0000-4000-8000-000000000003', request_id: 'ACR-0812-003', version: 1,
    first_name: 'Aisha', last_name: 'Patel', job_title: 'Marketing Specialist', department_name: 'Marketing', profile_photo_url: '/leaves-riya-patel-avatar.png',
    title: 'early check-out · 2026-08-11', reason: 'Please correct the premature check-out event.', status: 'pending_approval', submitted_at: '2026-08-12T18:03:00+07:00',
    original_values: { workDate: '2026-08-11', clockIn: '2026-08-11T09:02:00+07:00', clockOut: '2026-08-11T15:12:00+07:00', breakMinutes: 30 },
    requested_values: { workDate: '2026-08-11', clockIn: '2026-08-11T09:02:00+07:00', clockOut: '2026-08-11T17:30:00+07:00', breakMinutes: 30 },
  },
  {
    id: '00000000-0000-4000-8000-000000000004', request_id: 'ACR-0812-004', version: 1,
    first_name: 'Noah', last_name: 'Kim', job_title: 'Software Engineer', department_name: 'Engineering',
    title: 'incorrect work time · 2026-08-10', reason: 'Recorded time should include the customer incident call.', status: 'policy_warning', submitted_at: '2026-08-12T14:21:00+07:00',
    policy_warnings: ['Requested worked time exceeds the configured daily limit.'],
    original_values: { workDate: '2026-08-10', clockIn: '2026-08-10T09:00:00+07:00', clockOut: '2026-08-10T18:00:00+07:00', breakMinutes: 60 },
    requested_values: { workDate: '2026-08-10', clockIn: '2026-08-10T08:30:00+07:00', clockOut: '2026-08-10T20:00:00+07:00', breakMinutes: 45 },
  },
  {
    id: '00000000-0000-4000-8000-000000000005', request_id: 'ACR-0811-005', version: 1,
    first_name: 'Sofia', last_name: 'Alvarez', job_title: 'Finance Analyst', department_name: 'Finance',
    title: 'missing check-out · 2026-08-07', reason: 'Check-out was missed.', status: 'returned_for_revision', submitted_at: '2026-08-11T11:10:00+07:00',
    original_values: { workDate: '2026-08-07', clockIn: '2026-08-07T09:00:00+07:00', clockOut: null, breakMinutes: 45 },
    requested_values: { workDate: '2026-08-07', clockIn: '2026-08-07T09:00:00+07:00', clockOut: '2026-08-07T18:00:00+07:00', breakMinutes: 45 },
  },
  {
    id: '00000000-0000-4000-8000-000000000006', request_id: 'ACR-0810-006', version: 1,
    first_name: 'Ethan', last_name: 'Brown', job_title: 'Sales Manager', department_name: 'Sales',
    title: 'incorrect work time · 2026-08-06', reason: 'Customer call ran beyond the logged shift.', status: 'approved', submitted_at: '2026-08-10T16:05:00+07:00',
    original_values: { workDate: '2026-08-06', clockIn: '2026-08-06T09:00:00+07:00', clockOut: '2026-08-06T17:00:00+07:00', breakMinutes: 60 },
    requested_values: { workDate: '2026-08-06', clockIn: '2026-08-06T09:00:00+07:00', clockOut: '2026-08-06T18:00:00+07:00', breakMinutes: 60 },
  },
  {
    id: '00000000-0000-4000-8000-000000000007', request_id: 'ACR-0809-007', version: 1,
    first_name: 'Priya', last_name: 'Nair', job_title: 'People Partner', department_name: 'People Ops',
    title: 'incorrect break time · 2026-08-05', reason: 'Break duration was captured twice.', status: 'policy_warning', submitted_at: '2026-08-09T09:32:00+07:00',
    policy_warnings: ['Requested break change requires review.'],
    original_values: { workDate: '2026-08-05', clockIn: '2026-08-05T09:00:00+07:00', clockOut: '2026-08-05T18:00:00+07:00', breakMinutes: 90 },
    requested_values: { workDate: '2026-08-05', clockIn: '2026-08-05T09:00:00+07:00', clockOut: '2026-08-05T18:00:00+07:00', breakMinutes: 45 },
  },
  {
    id: '00000000-0000-4000-8000-000000000008', request_id: 'ACR-0808-008', version: 1,
    first_name: 'Liam', last_name: "O'Connor", job_title: 'Operations Lead', department_name: 'Operations',
    title: 'missing check-in · 2026-08-04', reason: 'Badge reader was offline.', status: 'approved', submitted_at: '2026-08-08T10:18:00+07:00',
    original_values: { workDate: '2026-08-04', clockIn: null, clockOut: '2026-08-04T18:00:00+07:00', breakMinutes: 45 },
    requested_values: { workDate: '2026-08-04', clockIn: '2026-08-04T09:00:00+07:00', clockOut: '2026-08-04T18:00:00+07:00', breakMinutes: 45 },
  },
];

const queueItems: Array<{ key: QueueKey; label: string; icon: React.ElementType }> = [
  { key: 'review', label: 'Needs review', icon: Link2 },
  { key: 'warnings', label: 'Policy warnings', icon: AlertTriangle },
  { key: 'returned', label: 'Returned', icon: RotateCcw },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
];

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function arrayOfRecords(value: unknown): ShiftRecord[] {
  return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') as ShiftRecord[] : [];
}

function humanize(value: unknown, fallback = 'Attendance correction') {
  return stringValue(value, fallback)
    .replace(/\s*[·|]\s*\d{4}-\d{2}-\d{2}.*$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function requestStatus(row: ShiftRecord) {
  return stringValue(row.status, 'pending_approval').toLowerCase();
}

function matchesQueue(row: ShiftRecord, queue: QueueKey) {
  const status = requestStatus(row);
  if (queue === 'approved') return ['approved', 'completed', 'processing'].includes(status);
  if (queue === 'returned') return ['returned_for_revision', 'returned'].includes(status);
  if (queue === 'warnings') return status === 'policy_warning';
  return ['pending_approval', 'submitted'].includes(status);
}

function submittedDate(row: ShiftRecord) {
  return new Date(String(row.submitted_at || row.created_at || 0));
}

function dayGroup(row: ShiftRecord, designPreview: boolean) {
  if (designPreview) {
    const day = Number(String(row.submitted_at).slice(8, 10));
    if (day === 13) return 'Today';
    if (day === 12) return 'Yesterday';
    return 'Earlier';
  }
  const date = submittedDate(row);
  if (Number.isNaN(date.getTime())) return 'Earlier';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (day === today) return 'Today';
  if (day === today - 86_400_000) return 'Yesterday';
  return 'Earlier';
}

function workDate(row: ShiftRecord) {
  return objectValue(row.requested_values).workDate || objectValue(row.original_values).workDate;
}

function statusMeta(row: ShiftRecord) {
  const status = requestStatus(row);
  if (['approved', 'completed', 'processing'].includes(status)) return { label: 'Approved', className: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' };
  if (['returned_for_revision', 'returned'].includes(status)) return { label: 'Returned', className: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' };
  if (status === 'policy_warning') return { label: 'Policy warning', className: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' };
  return { label: 'Needs review', className: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-400' };
}

export function AttendanceRequestsReview({ requests, capabilities, refreshing, saving, error, onRefresh, onDecision }: AttendanceRequestsReviewProps) {
  const [designPreview, setDesignPreview] = React.useState(false);
  React.useEffect(() => setDesignPreview(process.env.NODE_ENV !== 'production' && window.location.hash === '#design-preview'), []);
  const displayedRequests = requests.length || !designPreview ? requests : designPreviewRequests;
  const [queue, setQueue] = React.useState<QueueKey>('review');
  const [team, setTeam] = React.useState('all');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState('');

  const teams = React.useMemo(() => Array.from(new Set(displayedRequests.map(row => stringValue(row.department_name, '')).filter(Boolean))).sort(), [displayedRequests]);
  const counts = React.useMemo(() => designPreview ? { review: 6, warnings: 2, returned: 2, approved: 18 } : ({
    review: displayedRequests.filter(row => matchesQueue(row, 'review')).length,
    warnings: displayedRequests.filter(row => matchesQueue(row, 'warnings')).length,
    returned: displayedRequests.filter(row => matchesQueue(row, 'returned')).length,
    approved: displayedRequests.filter(row => matchesQueue(row, 'approved')).length,
  }), [designPreview, displayedRequests]);

  const visible = React.useMemo(() => displayedRequests
    .filter(row => designPreview && queue === 'review' ? true : matchesQueue(row, queue))
    .filter(row => team === 'all' || stringValue(row.department_name, '') === team)
    .sort((a, b) => submittedDate(b).getTime() - submittedDate(a).getTime()), [designPreview, displayedRequests, queue, team]);

  React.useEffect(() => {
    if (selectedId === null && visible[0]) {
      setSelectedId(String(visible[0].id || ''));
      return;
    }
    if (selectedId && !visible.some(row => String(row.id) === selectedId)) {
      setSelectedId(String(visible[0]?.id || ''));
    }
  }, [selectedId, visible]);

  const selected = selectedId ? visible.find(row => String(row.id) === selectedId) || null : null;
  const grouped = React.useMemo(() => ['Today', 'Yesterday', 'Earlier'].map(label => ({ label, rows: visible.filter(row => dayGroup(row, designPreview) === label) })).filter(group => group.rows.length), [designPreview, visible]);
  const canDecide = Boolean(selected && requestStatus(selected) === 'pending_approval' && capabilities.canApproveTeamRecords);

  const decide = async (action: 'approve' | 'reject' | 'return_for_revision') => {
    if (!selected) return;
    const result = await onDecision({ id: String(selected.id), action, comment: comment.trim() || null, expectedVersion: numberValue(selected.version) }, action === 'approve' ? 'Attendance request approved and applied.' : action === 'reject' ? 'Attendance request rejected.' : 'Attendance request returned for changes.');
    if (result) setComment('');
  };

  return (
    <main className="min-h-full w-full bg-transparent px-3 py-4 text-slate-950 sm:px-5 lg:px-7 dark:text-zinc-100">
      <div className="w-full max-w-none">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-zinc-50">Attendance Requests</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Review and take action on employee-submitted attendance corrections.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}><RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />Refresh</Button>
        </header>

        <div className="py-3"><PermissionBanner scope={capabilities.dataScope} /></div>
        {error && <ErrorState message={error} onRetry={onRefresh} />}

        {!displayedRequests.length && !error ? <EmptyState title="No attendance requests" description="Employee-submitted attendance corrections will appear here for review." /> : (
          <section className="grid min-h-[690px] border-y border-slate-200 xl:grid-cols-[190px_minmax(0,1fr)] dark:border-zinc-800">
            <aside className="border-b border-slate-200 py-5 pr-5 xl:border-b-0 xl:border-r dark:border-zinc-800">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500">Triage inbox</p>
              <nav className="mt-3 grid gap-1 sm:grid-cols-4 xl:grid-cols-1" aria-label="Attendance request queues">
                {queueItems.map(item => {
                  const Icon = item.icon;
                  const active = queue === item.key;
                  return <button key={item.key} type="button" onClick={() => setQueue(item.key)} className={cn('flex min-h-10 items-center gap-2 rounded-md px-3 text-left text-sm font-medium transition', active ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200' : 'text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900')}><Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{item.label}</span><span className="tabular-nums">{counts[item.key]}</span></button>;
                })}
              </nav>
              <div className="mt-5 border-t border-slate-200 pt-5 dark:border-zinc-800">
                <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500" htmlFor="attendance-request-team">Filter by team</label>
                <div className="relative mt-2">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select id="attendance-request-team" value={team} onChange={event => setTeam(event.target.value)} className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-950"><option value="all">All teams</option>{teams.map(value => <option key={value} value={value}>{value}</option>)}</select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </aside>

            <div className="min-w-0 border-b border-slate-200 xl:border-b-0 dark:border-zinc-800">
              <div className="grid grid-cols-[minmax(150px,1.55fr)_80px_84px_88px_92px] items-center border-b border-slate-200 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:border-zinc-800 dark:text-zinc-500"><span>Request</span><span>Type</span><span>Date</span><span>Submitted ↓</span><span>Status</span></div>
              <div className="max-h-[690px] overflow-y-auto">
                {visible.length ? grouped.map(group => <div key={group.label}>
                  <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-500">{group.label} ({designPreview && group.label === 'Earlier' ? 2 : group.rows.length})</div>
                  {group.rows.map(row => {
                    const active = String(row.id) === String(selected?.id);
                    const meta = statusMeta(row);
                    return <button key={String(row.id)} type="button" onClick={() => { setSelectedId(String(row.id)); setComment(''); }} className={cn('grid w-full grid-cols-[minmax(150px,1.55fr)_80px_84px_88px_92px] items-center border-b border-slate-100 px-4 py-3 text-left transition dark:border-zinc-800', active ? 'bg-blue-50/70 shadow-[inset_3px_0_0_#3b82f6] dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-zinc-900/60')}>
                      <span className="flex min-w-0 items-center gap-2.5"><EmployeeAvatar row={row} /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-950 dark:text-zinc-50">{employeeName(row)}</span><span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-zinc-400">{stringValue(row.department_name, 'Team')}</span></span></span>
                      <span className="truncate pr-2 text-xs text-slate-600 dark:text-zinc-300">{humanize(row.title)}</span>
                      <span className="text-xs text-slate-600 dark:text-zinc-300">{formatDate(workDate(row), { month: 'short', day: 'numeric' })}</span>
                      <span className="text-xs leading-5 text-slate-500 dark:text-zinc-400">{formatDate(row.submitted_at || row.created_at, { month: 'short', day: 'numeric' })}<br />{formatTime(row.submitted_at || row.created_at)}</span>
                      <span className={cn('flex items-center gap-1.5 text-[11px] font-medium', meta.className)}><span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} /><span className="leading-4">{meta.label}</span></span>
                    </button>;
                  })}
                </div>) : <div className="p-8 text-center text-sm text-slate-500">No requests match this queue.</div>}
              </div>
            </div>

          </section>
        )}

        <Sheet open={Boolean(selected)} onOpenChange={open => { if (!open) setSelectedId(''); }}>
          {selected ? (
            <SheetContent
              side="right"
              hideCloseButton
              sheetId="attendance-request-detail-drawer"
              className="!bottom-4 !left-auto !right-4 !top-4 !h-[calc(100dvh-2rem)] !w-[min(560px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card p-0 shadow-2xl sm:!max-w-[560px]"
            >
              <SheetTitle className="sr-only">{humanize(selected.title)} for {employeeName(selected)}</SheetTitle>
              <SheetDescription className="sr-only">Review the recorded and requested attendance values, policy checks, and decision history.</SheetDescription>
              <RequestDetail
                request={selected}
                comment={comment}
                onCommentChange={setComment}
                canDecide={canDecide}
                saving={saving}
                onClose={() => setSelectedId('')}
                onApprove={() => void decide('approve')}
                onReject={() => void decide('reject')}
                onReturn={() => void decide('return_for_revision')}
              />
            </SheetContent>
          ) : null}
        </Sheet>
      </div>
    </main>
  );
}

function formatDuration(hours: number) {
  const minutes = Math.round(hours * 60);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function breakLabel(values: Record<string, unknown>) {
  if (values.breakStart && values.breakEnd) return `${formatTime(values.breakStart)} – ${formatTime(values.breakEnd)} (${numberValue(values.breakMinutes)}m)`;
  return `${numberValue(values.breakMinutes)}m`;
}

function RequestDetail({ request, comment, onCommentChange, canDecide, saving, onClose, onApprove, onReject, onReturn }: { request: ShiftRecord; comment: string; onCommentChange: (value: string) => void; canDecide: boolean; saving: boolean; onClose: () => void; onApprove: () => void; onReject: () => void; onReturn: () => void }) {
  const original = objectValue(request.original_values);
  const requested = objectValue(request.requested_values);
  const warnings = Array.isArray(request.policy_warnings) ? request.policy_warnings : [];
  const activity = arrayOfRecords(request.activity);
  const meta = statusMeta(request);
  const attachment = arrayOfRecords(request.supporting_documents || request.attachments)[0];
  const duration = requested.clockIn && requested.clockOut ? Math.max(0, (new Date(String(requested.clockOut)).getTime() - new Date(String(requested.clockIn)).getTime()) / 3_600_000 - numberValue(requested.breakMinutes) / 60) : 0;

  return <div className="flex h-full min-h-0 flex-col">
    <div className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-zinc-50">{humanize(request.title)} · {formatDate(workDate(request), { weekday: 'short', month: 'short', day: 'numeric' })}</h2><div className="mt-3 flex items-center gap-3"><EmployeeAvatar row={request} /><div><p className="text-sm font-semibold">{employeeName(request)}</p><p className="text-xs text-slate-500 dark:text-zinc-400">{stringValue(request.job_title, 'Employee')} · {stringValue(request.department_name, 'Team')}</p></div></div></div>
        <div className="flex items-center gap-3 pr-1"><span className={cn('flex items-center gap-1.5 text-xs font-semibold', meta.className)}><span className={cn('h-2 w-2 rounded-full', meta.dot)} />{meta.label}</span><button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800 dark:hover:text-white" aria-label="Close attendance request details"><X className="h-4 w-4" /></button></div>
      </div>

      <SectionLabel>Comparison</SectionLabel>
      <div className="overflow-hidden rounded-md border border-slate-200 dark:border-zinc-800">
        <div className="grid grid-cols-[110px_1fr_1fr] bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-zinc-900 dark:text-zinc-500"><span className="p-2.5" /><span className="border-l border-slate-200 p-2.5 dark:border-zinc-800">Original (recorded)</span><span className="border-l border-slate-200 p-2.5 dark:border-zinc-800">Requested</span></div>
        <ComparisonRow label="Check-in" original={formatTime(original.clockIn)} requested={formatTime(requested.clockIn)} changed={formatTime(original.clockIn) !== formatTime(requested.clockIn)} />
        <ComparisonRow label="Check-out" original={formatTime(original.clockOut)} requested={formatTime(requested.clockOut)} changed={formatTime(original.clockOut) !== formatTime(requested.clockOut)} />
        <ComparisonRow label="Break" original={breakLabel(original)} requested={breakLabel(requested)} changed={numberValue(original.breakMinutes) !== numberValue(requested.breakMinutes)} />
        <ComparisonRow label="Worked time" original="—" requested={duration ? formatDuration(duration) : '—'} changed={duration > 0} />
        <ComparisonRow label="Location" original={stringValue(original.workLocation, 'Office')} requested={stringValue(requested.workLocation, stringValue(original.workLocation, 'Office'))} />
      </div>

      <SectionLabel>Employee reason</SectionLabel><p className="text-sm leading-6 text-slate-700 dark:text-zinc-300">{stringValue(request.reason, 'No reason provided.')}</p>
      <SectionLabel>Attachment</SectionLabel>
      {attachment?.url ? <a href={stringValue(attachment.url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-slate-50 dark:border-zinc-800 dark:text-blue-400 dark:hover:bg-zinc-900"><Paperclip className="h-4 w-4" /><span>{stringValue(attachment.name, 'Supporting evidence')} <span className="font-normal text-slate-500">({stringValue(attachment.size, '')})</span></span></a> : <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-zinc-400"><FileText className="h-4 w-4" />No attachment provided.</p>}

      <SectionLabel>Policy check</SectionLabel><div className="space-y-2 text-sm">{warnings.length ? warnings.map((warning, index) => <PolicyLine key={index} text={stringValue(warning)} />) : <PolicyLine ok text="The server reported no policy warnings for this request." />}</div>

      <SectionLabel>Audit trail</SectionLabel>
      <ol className="space-y-3 border-l border-slate-200 pl-4 text-xs dark:border-zinc-800">{(activity.length ? activity : [{ action: 'Submitted request', createdAt: request.submitted_at || request.created_at }]).map((item, index) => <li key={String(item.id || index)} className="relative grid gap-0.5 before:absolute before:-left-[1.19rem] before:top-1 before:h-2 before:w-2 before:rounded-full before:bg-slate-400"><time className="text-slate-500">{formatDate(item.createdAt || item.created_at, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} {formatTime(item.createdAt || item.created_at)}</time><strong className="font-medium text-slate-700 dark:text-zinc-300">{stringValue(item.action, 'Submitted request')}</strong></li>)}</ol>
    </div>

    <div className="border-t border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between"><label htmlFor="attendance-review-comment" className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-zinc-500">Reviewer comment (optional)</label><span className="text-[11px] tabular-nums text-slate-400">{comment.length}/500</span></div>
      <Textarea id="attendance-review-comment" value={comment} maxLength={500} onChange={event => onCommentChange(event.target.value)} disabled={!canDecide || saving} className="mt-2 min-h-16 resize-none" placeholder="Add a comment for the employee (optional)..." />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><p className="max-w-56 text-xs leading-5 text-slate-500 dark:text-zinc-400">Approval applies the correction and recalculates attendance.</p><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" disabled={!canDecide || saving || comment.trim().length < 3} onClick={onReturn}><ArrowDownLeft className="mr-1.5 h-4 w-4" />Return for changes</Button><Button variant="outline" size="sm" className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30" disabled={!canDecide || saving || comment.trim().length < 3} onClick={onReject}><X className="mr-1.5 h-4 w-4" />Reject</Button><Button size="sm" disabled={!canDecide || saving} onClick={onApprove}><Check className="mr-1.5 h-4 w-4" />Approve request</Button></div></div>
    </div>
  </div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-zinc-500">{children}</h3>;
}

function ComparisonRow({ label, original, requested, changed = false }: { label: string; original: string; requested: string; changed?: boolean }) {
  return <div className="grid grid-cols-[110px_1fr_1fr] border-t border-slate-200 text-sm dark:border-zinc-800"><span className="p-2.5 font-medium">{label}</span><span className="border-l border-slate-200 p-2.5 text-slate-600 dark:border-zinc-800 dark:text-zinc-400">{original}</span><span className={cn('border-l border-slate-200 p-2.5 dark:border-zinc-800', changed && 'font-semibold text-emerald-700 dark:text-emerald-300')}>{changed && <span className="mr-1.5 text-slate-400">→</span>}{requested}</span></div>;
}

function PolicyLine({ ok = false, text }: { ok?: boolean; text: string }) {
  const Icon = ok ? ShieldCheck : AlertTriangle;
  return <div className={cn('flex items-start gap-2', ok ? 'text-slate-700 dark:text-zinc-300' : 'text-amber-700 dark:text-amber-300')}><Icon className={cn('mt-0.5 h-4 w-4 shrink-0', ok && 'text-emerald-500')} /><span>{text}</span></div>;
}
