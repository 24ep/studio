"use client";

import * as React from 'react';
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LockKeyhole,
  MoreHorizontal,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { DetailDrawer, EmployeeAvatar, EmptyState } from '../ShiftShared';
import {
  arrayValue,
  employeeName,
  formatDate,
  formatDuration,
  formatTime,
  numberValue,
  stringValue,
  type ShiftRecord,
} from '../shift-types';

export type ExceptionGroupKey = 'missing' | 'late' | 'variance';
export type ExceptionGroup = {
  key: ExceptionGroupKey;
  label: string;
  rows: ShiftRecord[];
};

export function GroupedListView({ groups, collapsed, onToggle, onOpen, selectedId }: { groups: ExceptionGroup[]; collapsed: Record<ExceptionGroupKey, boolean>; onToggle: (key: ExceptionGroupKey) => void; onOpen: (row: ShiftRecord) => void; selectedId?: string }) {
  if (groups.length === 0) {
    return <EmptyState title="No exceptions in this view" description="Switch to Timeline to review all attendance records, or adjust the current filters." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] table-fixed text-left text-xs">
        <thead className="border-b border-slate-200 bg-transparent text-[11px] font-medium text-slate-500 dark:border-zinc-800 dark:text-zinc-500">
          <tr><th className="w-[3%] px-3 py-3"><span className="block h-4 w-4 rounded border border-slate-500" /></th><th className="w-[19%] px-2 py-3">Employee</th><th className="w-[17%] px-3 py-3">Issue</th><th className="w-[19%] px-3 py-3">Scheduled / recorded</th><th className="w-[9%] px-3 py-3">Age</th><th className="w-[10%] px-3 py-3">Severity</th><th className="w-[13%] px-3 py-3">Review status</th><th className="px-3 py-3 text-right">Open</th></tr>
        </thead>
        {groups.map(group => (
          <tbody key={group.key} className="border-t border-slate-200 dark:border-zinc-800">
            <tr><th colSpan={8} className="p-0"><button type="button" onClick={() => onToggle(group.key)} className="flex h-9 w-full items-center gap-2 px-3 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-900">{collapsed[group.key] ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{group.label} ({group.rows.length})</button></th></tr>
            {!collapsed[group.key] && group.rows.map(row => (
              <tr key={String(row.id)} data-attendance-record-id={String(row.id)} onClick={() => onOpen(row)} className={cn('cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60', selectedId === row.id && 'bg-blue-50 dark:bg-blue-950/45')}>
                <td className="px-3 py-2"><span className="block h-4 w-4 rounded border border-slate-500" /></td>
                <td className="px-2 py-2"><button type="button" onPointerDown={event => { event.stopPropagation(); onOpen(row); }} onClick={event => { event.stopPropagation(); onOpen(row); }} aria-label={`Open ${employeeName(row)} attendance record`} className="w-full text-left"><EmployeeCell row={row} /></button></td>
                <td className="px-3 py-2 font-medium">{exceptionLabel(row)}</td>
                <td className="px-3 py-2"><p className="font-medium">{formatTime(row.start_time || row.scheduled_start_at)}–{formatTime(row.end_time || row.scheduled_end_at)}</p><p className="text-[11px] text-slate-500">In {formatTime(row.clock_in)} · Out {formatTime(row.clock_out)}</p></td>
                <td className="px-3 py-2 tabular-nums">{exceptionAge(row)}</td>
                <td className="px-3 py-2"><SeverityBadge severity={resolveSeverity(row)} /></td>
                <td className="px-3 py-2"><span className={cn('font-medium', stringValue(row.review_status, 'new') !== 'new' && 'text-blue-600 dark:text-blue-400')}>{stringValue(row.review_status, 'New').replace(/_/g, ' ')}</span></td>
                <td className="px-3 py-2 text-right"><Button type="button" variant="ghost" size="icon" aria-label={`Open ${employeeName(row)} actions`} onPointerDown={event => { event.stopPropagation(); onOpen(row); }} onClick={event => { event.stopPropagation(); onOpen(row); }}><MoreHorizontal className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

export function PaginationBar({ page, pageSize, visibleCount, totalHint, hasMore, onPageChange, onPageSizeChange }: { page: number; pageSize: number; visibleCount: number; totalHint: number; hasMore: boolean; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void }) {
  const start = visibleCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + visibleCount;
  const total = Math.max(end, totalHint);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from(new Set([1, page - 1, page, page + 1, totalPages].filter(value => value > 0 && value <= totalPages))).sort((a, b) => a - b);
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-3 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
      <span>{start}–{end} of {total}{totalHint > end ? '' : ' records'}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="outline" size="icon" className="h-9 w-9" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
        {pages.map((value, index) => <React.Fragment key={value}>{index > 0 && value - pages[index - 1] > 1 && <span className="px-1">…</span>}<Button variant={value === page ? 'default' : 'outline'} size="sm" className="h-9 min-w-9 px-3" onClick={() => onPageChange(value)}>{value}</Button></React.Fragment>)}
        <Button variant="outline" size="icon" className="h-9 w-9" disabled={!hasMore && page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
        <select value={pageSize} onChange={event => onPageSizeChange(Number(event.target.value))} className="ml-2 h-9 rounded-md border border-input bg-background px-3"><option value={10}>10 / page</option><option value={25}>25 / page</option><option value={50}>50 / page</option></select>
      </div>
    </div>
  );
}

export function AttendanceDrawer({ row, period, open, canManage, saving, unresolved, onClose, onAction }: { row: ShiftRecord | null; period?: ShiftRecord; open: boolean; canManage: boolean; saving: boolean; unresolved: number; onClose: () => void; onAction: (body: Record<string, unknown>, message: string) => Promise<void> }) {
  const [reason, setReason] = React.useState('');
  React.useEffect(() => setReason(''), [row?.id]);
  if (!row) return null;
  const exception = exceptionLabel(row);
  const periodLabel = period ? `${formatDate(period.start_date, { month: 'short', day: 'numeric' })}–${formatDate(period.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Current period';
  return (
    <DetailDrawer title="Attendance record" open={open} onClose={onClose} variant="floating">
      <div className="flex items-center gap-3"><EmployeeAvatar row={row} /><div className="min-w-0 flex-1"><p className="font-bold">{employeeName(row)}</p><p className="truncate text-xs text-slate-500">{stringValue(row.job_title)} · {stringValue(row.department_name)}</p><p className="mt-0.5 text-[11px] text-slate-500">Employee ID&nbsp; <strong className="text-slate-700 dark:text-zinc-300">{stringValue(row.employee_number)}</strong></p></div><SeverityBadge severity={resolveSeverity(row)} /></div>
      <div className="mt-4 border-y border-slate-200 py-4 dark:border-zinc-800"><p className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-rose-500" />{exception}</p><p className="mt-1 text-xs text-slate-500">Scheduled &nbsp; {formatTime(row.start_time || row.scheduled_start_at)}–{formatTime(row.end_time || row.scheduled_end_at)}</p></div>
      <div className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200 py-3 text-xs dark:divide-zinc-800 dark:border-zinc-800">
        <DrawerMetric label="Check-in" value={formatTime(row.clock_in)} detail={row.clock_in ? 'Recorded' : 'Not recorded'} />
        <DrawerMetric label="Check-out" value={formatTime(row.clock_out)} detail={row.clock_out ? 'Recorded' : 'Not recorded'} />
        <DrawerMetric label="Worked time" value={row.clock_out ? formatDuration(row.worked_minutes || numberValue(row.hours_worked) * 60) : '—'} detail={row.clock_out ? 'Calculated' : 'Pending'} />
        <DrawerMetric label="Open" value={exceptionAge(row)} detail="" />
      </div>
      <section className="py-4"><h3 className="text-xs font-bold">Event timeline</h3><ol className="mt-3 border-l border-slate-200 pl-5 dark:border-zinc-800"><TimelineEvent label="Scheduled start" time={formatTime(row.scheduled_start_at || row.start_time)} complete /><TimelineEvent label="Check-in" time={formatTime(row.clock_in)} detail={stringValue(row.work_location || row.employee_location, 'Office kiosk')} complete={Boolean(row.clock_in)} /><TimelineEvent label="Scheduled end" time={formatTime(row.scheduled_end_at || row.end_time)} /><TimelineEvent label="Check-out" time={formatTime(row.clock_out)} detail={row.clock_out ? 'Recorded' : 'Not recorded'} complete={Boolean(row.clock_out)} /></ol></section>
      <section className="border-t border-slate-200 py-4 dark:border-zinc-800"><h3 className="text-xs font-bold">What needs correction</h3><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-zinc-400">{correctionGuidance(row)}</p></section>
      {canManage && <section><label className="text-xs font-bold">Reviewer note</label><Textarea value={reason} onChange={event => setReason(event.target.value)} placeholder="Add a note (required for actions)" className="mt-2 min-h-20" /><p className="mt-1 text-right text-[10px] text-slate-500">{reason.length} / 500</p><div className="mt-3 grid grid-cols-3 gap-2"><Button variant="outline" size="sm" disabled={saving || reason.trim().length < 3} onClick={() => void onAction({ action: 'recalculate_attendance', attendanceRecordId: row.id, reason }, 'Attendance recalculated from authoritative inputs.')}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Recalculate</Button><Button variant="outline" size="sm" disabled={saving || reason.trim().length < 3} onClick={() => void onAction({ action: 'review_attendance', attendanceRecordId: row.id, decision: 'hold', reason, expectedVersion: numberValue(row.version) }, 'Attendance record placed on hold.')}><Clock3 className="mr-1.5 h-3.5 w-3.5" />Place on hold</Button><Button size="sm" disabled={saving || reason.trim().length < 3} onClick={() => void onAction({ action: 'review_attendance', attendanceRecordId: row.id, decision: 'close', reason, expectedVersion: numberValue(row.version) }, 'Attendance record closed.')}><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Close record</Button></div></section>}
      <section className="mt-5 border-t border-slate-200 pt-4 dark:border-zinc-800"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><h3 className="text-xs font-bold">Period readiness</h3><span className="text-[11px] text-slate-500">{periodLabel} · Exceptions pending</span></div><ReadinessSteps unresolved={unresolved} /></section>
    </DetailDrawer>
  );
}

export function PeriodReadinessBar({ period, unresolved, saving, canManagePayroll, onAction }: { period: ShiftRecord; unresolved: number; saving: boolean; canManagePayroll: boolean; onAction: (body: Record<string, unknown>, message: string) => Promise<unknown> }) {
  const status = stringValue(period.status);
  const [reason, setReason] = React.useState('');
  const run = async (action: 'close_period' | 'reopen_period' | 'export_payroll') => {
    const result = await onAction({ action, attendancePeriodId: period.id, reason, expectedVersion: numberValue(period.version) }, action === 'close_period' ? 'Attendance period closed.' : action === 'reopen_period' ? 'Attendance period reopened.' : 'Attendance exported to payroll.');
    if (result) setReason('');
  };
  const closed = ['closed', 'exported_to_payroll'].includes(status);
  return <section className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-[#071321]"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-center gap-3"><LockKeyhole className="h-5 w-5 text-blue-600" /><div><p className="text-sm font-semibold">Attendance period readiness</p><p className="text-xs text-slate-500">{formatDate(period.start_date)}–{formatDate(period.end_date)} · {status.replace(/_/g, ' ')}</p></div></div><div className="flex flex-wrap items-center gap-2"><span className={cn('text-sm font-semibold', unresolved ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600')}>{unresolved} unresolved</span><Input className="h-9 min-w-56" value={reason} onChange={event => setReason(event.target.value)} placeholder="Reason for period action" />{closed ? <Button size="sm" variant="outline" disabled={saving || reason.trim().length < 3} onClick={() => void run('reopen_period')}>Reopen</Button> : <Button size="sm" variant="outline" disabled={saving || unresolved > 0 || reason.trim().length < 3} onClick={() => void run('close_period')}><LockKeyhole className="mr-2 h-4 w-4" />Close period</Button>}{status === 'closed' && canManagePayroll && <Button size="sm" disabled={saving || reason.trim().length < 3} onClick={() => void run('export_payroll')}><ArrowDownToLine className="mr-2 h-4 w-4" />Export payroll</Button>}</div></div><ReadinessSteps unresolved={unresolved} status={status} /></section>;
}

export function buildExceptionGroups(rows: ShiftRecord[]): ExceptionGroup[] {
  const groups: ExceptionGroup[] = [
    { key: 'missing', label: 'Missing events', rows: [] },
    { key: 'late', label: 'Late / early', rows: [] },
    { key: 'variance', label: 'Hours variance', rows: [] },
  ];
  rows.filter(hasException).forEach(row => {
    const label = exceptionLabel(row).toLowerCase();
    if (label.includes('missing') || label.includes('no check')) groups[0].rows.push(row);
    else if (label.includes('late') || label.includes('early')) groups[1].rows.push(row);
    else groups[2].rows.push(row);
  });
  return groups.filter(group => group.rows.length > 0);
}

export function hasException(row: ShiftRecord) { return row.exception_status !== 'clear' || arrayValue(row.exceptions).length > 0 || numberValue(row.late_minutes) > 0 || numberValue(row.early_departure_minutes) > 0 || numberValue(row.overtime_minutes || numberValue(row.overtime_hours) * 60) > 0 || Boolean(row.clock_in && !row.clock_out); }

export function exceptionLabel(row: ShiftRecord) {
  const first = arrayValue(row.exceptions)[0];
  if (first?.code) return stringValue(first.code).replace(/_/g, ' ');
  if (row.clock_in && !row.clock_out) return 'Missing check-out';
  if (!row.clock_in && ['missing_record', 'absent'].includes(stringValue(row.status, ''))) return 'Missing check-in';
  if (numberValue(row.late_minutes) > 0 || row.status === 'late') return 'Late arrival';
  if (numberValue(row.early_departure_minutes) > 0) return 'Early departure';
  if (numberValue(row.overtime_minutes || numberValue(row.overtime_hours) * 60) > 0) return 'Overtime variance';
  return stringValue(row.exception_status, 'Hours variance').replace(/_/g, ' ');
}

export function resolveSeverity(row: ShiftRecord) {
  const severities = arrayValue(row.exceptions).map(exception => stringValue(exception.severity, '').toLowerCase());
  if (severities.includes('critical')) return 'critical';
  if (severities.includes('high')) return 'high';
  const label = exceptionLabel(row).toLowerCase();
  if (label.includes('missing')) return row.clock_in && !row.clock_out ? 'critical' : 'high';
  if (numberValue(row.late_minutes) >= 30 || numberValue(row.early_departure_minutes) >= 30) return 'high';
  return 'medium';
}

export function exceptionAge(row: ShiftRecord) {
  const created = arrayValue(row.exceptions)[0]?.created_at || row.updated_at || row.clock_in || row.scheduled_start_at;
  if (!created) return '—';
  const date = new Date(String(created));
  if (Number.isNaN(date.getTime())) return '—';
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
}

function correctionGuidance(row: ShiftRecord) { const issue = exceptionLabel(row).toLowerCase(); if (issue.includes('check-out')) return 'A check-out was not recorded for the scheduled shift. Verify the actual check-out time and add the missing event, or place the record on hold if no correction is available.'; if (issue.includes('check-in')) return 'A check-in was not recorded. Confirm whether the employee worked this shift, then add the missing event or mark the record for review.'; if (issue.includes('late') || issue.includes('early')) return 'The recorded time differs from the planned shift. Confirm the exception and close the record, or place it on hold while supporting information is collected.'; return 'Review the scheduled and recorded hours, recalculate from authoritative events, and close the record when the variance is explained.'; }

function EmployeeCell({ row }: { row: ShiftRecord }) { return <div className="flex min-w-0 items-center gap-2.5"><EmployeeAvatar row={row} /><div className="min-w-0"><p className="truncate font-semibold">{employeeName(row)}</p><p className="truncate text-[11px] text-slate-500">{stringValue(row.department_name)}</p></div></div>; }
function SeverityBadge({ severity }: { severity: string }) { return <span className={cn('inline-flex min-h-6 items-center rounded-full border px-2 text-[11px] font-semibold capitalize', severity === 'critical' ? 'border-rose-600/70 bg-rose-950/30 text-rose-600 dark:text-rose-300' : severity === 'high' ? 'border-orange-500/70 bg-orange-950/30 text-orange-700 dark:text-orange-300' : 'border-amber-500/70 bg-amber-950/30 text-amber-700 dark:text-amber-300')}>{severity}</span>; }
function DrawerMetric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="min-w-0 px-2 first:pl-0 last:pr-0"><p className="truncate text-slate-500">{label}</p><p className="mt-1 truncate text-base font-bold tabular-nums">{value}</p>{detail && <p className="truncate text-[10px] text-slate-500">{detail}</p>}</div>; }
function TimelineEvent({ label, time, detail, complete }: { label: string; time: string; detail?: string; complete?: boolean }) { return <li className="relative grid grid-cols-[48px_1fr] gap-2 pb-4 text-xs last:pb-0 before:absolute before:-left-[1.47rem] before:top-0.5 before:h-3 before:w-3 before:rounded-full before:border before:border-rose-500 before:bg-white dark:before:bg-zinc-950"><span className={cn('font-semibold tabular-nums', complete && 'text-emerald-600 dark:text-emerald-400')}>{time}</span><div><p className="font-medium">{label}</p>{detail && <p className="mt-0.5 text-slate-500">{detail}</p>}</div></li>; }
function ReadinessSteps({ unresolved, status = 'open' }: { unresolved: number; status?: string }) { const closed = ['closed', 'exported_to_payroll'].includes(status); const steps = [{ label: 'Collect records', detail: 'Complete' }, { label: 'Resolve exceptions', detail: unresolved ? `${unresolved} remaining` : 'Complete' }, { label: 'Close period', detail: closed ? 'Complete' : unresolved ? 'Blocked' : 'Ready' }, { label: 'Export payroll', detail: status === 'exported_to_payroll' ? 'Complete' : closed ? 'Ready' : 'Waiting' }]; return <div className="mt-4 grid grid-cols-4 gap-1">{steps.map((step, index) => <div key={step.label} className="relative text-center before:absolute before:left-0 before:right-0 before:top-3 before:h-px before:bg-slate-200 first:before:left-1/2 last:before:right-1/2 dark:before:bg-zinc-700"><span className={cn('relative z-10 mx-auto flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold', index === 0 ? 'border-emerald-500 bg-emerald-500 text-white' : index === 1 ? 'border-blue-500 bg-blue-600 text-white ring-4 ring-blue-500/20' : 'border-slate-300 bg-white text-slate-500 dark:border-zinc-700 dark:bg-zinc-900')}>{index === 0 ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><p className={cn('mt-2 text-[10px] font-medium leading-4', index === 1 && 'text-blue-600 dark:text-blue-400')}>{step.label}</p><p className="text-[10px] text-slate-500">{step.detail}</p></div>)}</div>; }
