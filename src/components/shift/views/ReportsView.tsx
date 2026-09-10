"use client";

import * as React from 'react';
import { ArrowDownToLine, CalendarDays, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, ErrorState, LoadingState, PermissionBanner, ShiftPageHeader } from '../ShiftShared';
import { arrayValue, formatDate, numberValue, type ShiftRecord } from '../shift-types';
import { useShiftAttendance } from '../use-shift-attendance';

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function defaultStart() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 29);
  return isoDate(date);
}

function csvCell(value: unknown) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

type ReportTotals = {
  records: number;
  present: number;
  late: number;
  absent: number;
  exceptions: number;
  workedMinutes: number;
  overtimeMinutes: number;
};

function exportRows(rows: ShiftRecord[], start: string, end: string) {
  const header = ['Date', 'Records', 'Present', 'Late', 'Absent', 'Exceptions', 'Worked hours', 'Overtime hours'];
  const body = rows.map(row => [
    String(row.date || '').slice(0, 10),
    numberValue(row.records),
    numberValue(row.present),
    numberValue(row.late),
    numberValue(row.absent),
    numberValue(row.exceptions),
    (numberValue(row.worked_minutes) / 60).toFixed(2),
    (numberValue(row.overtime_minutes) / 60).toFixed(2),
  ]);
  const csv = [header, ...body].map(row => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `time-report-${start}-${end}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportsView() {
  const [start, setStart] = React.useState(defaultStart);
  const [end, setEnd] = React.useState(() => isoDate(new Date()));
  const query = React.useMemo(() => new URLSearchParams({ start, end }), [end, start]);
  const state = useShiftAttendance('reports', query);

  if (state.loading) return <Page><LoadingState label="Loading Time reporting data…" /></Page>;
  if (state.error && !state.data) return <Page><ErrorState message={state.error} onRetry={state.reload} /></Page>;
  if (!state.data || !state.capabilities) return null;

  const rows = arrayValue(state.data.daily);
  const totals = rows.reduce<ReportTotals>((summary, row) => ({
    records: summary.records + numberValue(row.records),
    present: summary.present + numberValue(row.present),
    late: summary.late + numberValue(row.late),
    absent: summary.absent + numberValue(row.absent),
    exceptions: summary.exceptions + numberValue(row.exceptions),
    workedMinutes: summary.workedMinutes + numberValue(row.worked_minutes),
    overtimeMinutes: summary.overtimeMinutes + numberValue(row.overtime_minutes),
  }), { records: 0, present: 0, late: 0, absent: 0, exceptions: 0, workedMinutes: 0, overtimeMinutes: 0 });

  return (
    <Page>
      <ShiftPageHeader
        eyebrow="Time · Reports"
        title="Time reports"
        description="Review attendance, exceptions, worked time, and overtime for an authorized date range."
        actions={<div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={state.refreshing} onClick={() => state.reload()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button size="sm" disabled={rows.length === 0} onClick={() => exportRows(rows, start, end)}><ArrowDownToLine className="mr-2 h-4 w-4" />Export CSV</Button></div>}
      />
      <PermissionBanner scope={state.capabilities.dataScope} />
      {state.error && <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-200">{state.error}</div>}
      <section className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-[#071321]">
        <label className="space-y-1 text-xs font-semibold"><span>Start date</span><Input type="date" value={start} max={end} onChange={event => setStart(event.target.value)} /></label>
        <label className="space-y-1 text-xs font-semibold"><span>End date</span><Input type="date" value={end} min={start} onChange={event => setEnd(event.target.value)} /></label>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500"><CalendarDays className="h-4 w-4" />{formatDate(start)}–{formatDate(end)}</div>
      </section>
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 md:grid-cols-4 xl:grid-cols-7 dark:border-zinc-800 dark:bg-zinc-800">
        <Metric label="Records" value={totals.records} /><Metric label="Present" value={totals.present} /><Metric label="Late" value={totals.late} /><Metric label="Absent" value={totals.absent} /><Metric label="Exceptions" value={totals.exceptions} /><Metric label="Worked" value={`${(totals.workedMinutes / 60).toFixed(1)}h`} /><Metric label="Overtime" value={`${(totals.overtimeMinutes / 60).toFixed(1)}h`} />
      </section>
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#071321]">
        {rows.length === 0 ? <EmptyState title="No Time data in this range" description="Choose another date range after attendance records are available." /> : <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="border-b border-slate-200 text-xs text-slate-500 dark:border-zinc-800"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Records</th><th className="px-4 py-3 text-right">Present</th><th className="px-4 py-3 text-right">Late</th><th className="px-4 py-3 text-right">Absent</th><th className="px-4 py-3 text-right">Exceptions</th><th className="px-4 py-3 text-right">Worked</th><th className="px-4 py-3 text-right">Overtime</th></tr></thead><tbody>{rows.map(row => <tr key={String(row.date)} className="border-b border-slate-100 last:border-0 dark:border-zinc-900"><td className="px-4 py-3 font-medium">{formatDate(row.date)}</td><Cell value={numberValue(row.records)} /><Cell value={numberValue(row.present)} /><Cell value={numberValue(row.late)} /><Cell value={numberValue(row.absent)} /><Cell value={numberValue(row.exceptions)} /><Cell value={`${(numberValue(row.worked_minutes) / 60).toFixed(2)}h`} /><Cell value={`${(numberValue(row.overtime_minutes) / 60).toFixed(2)}h`} /></tr>)}</tbody></table></div>}
      </section>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <main className="min-h-full w-full bg-transparent px-3 py-4 text-slate-950 sm:px-5 lg:px-7 dark:text-zinc-100"><div className="flex w-full max-w-none flex-col gap-4">{children}</div></main>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="bg-white px-4 py-3 dark:bg-[#071321]"><p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-lg font-bold tabular-nums">{value}</p></div>;
}

function Cell({ value }: { value: React.ReactNode }) {
  return <td className="px-4 py-3 text-right tabular-nums">{value}</td>;
}
