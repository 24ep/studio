"use client";

import * as React from 'react';
import {
  AlertTriangle,
  ArrowDownToLine,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Filter,
  Flag,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  EmployeeAvatar,
  EmptyState,
  ErrorState,
  LoadingState,
  PermissionBanner,
  SearchField,
  ShiftStatusBadge,
} from '../ShiftShared';
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
import { useShiftAttendance } from '../use-shift-attendance';
import {
  AttendanceDrawer,
  GroupedListView,
  PaginationBar,
  PeriodReadinessBar,
  buildExceptionGroups,
  exceptionLabel,
  hasException,
  resolveSeverity,
  type ExceptionGroupKey,
} from './AttendanceOperationsParts';

type AttendanceMode = 'timeline' | 'list';

const timeStart = 7 * 60;
const timeEnd = 19 * 60;
const timeTicks = Array.from({ length: 13 }, (_, index) => 7 + index);

export function AttendanceOperationsView() {
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [queryText, setQueryText] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [severity, setSeverity] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [exceptionType, setExceptionType] = React.useState('');
  const [mode, setMode] = React.useState<AttendanceMode>('timeline');
  const [selectedRecordId, setSelectedRecordId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [collapsed, setCollapsed] = React.useState<Record<ExceptionGroupKey, boolean>>({
    missing: false,
    late: false,
    variance: false,
  });
  const query = React.useMemo(
    () => new URLSearchParams({ date, query: queryText, status, department, location, exceptionType, page: String(page), pageSize: String(pageSize) }),
    [date, department, exceptionType, location, page, pageSize, queryText, status],
  );
  const state = useShiftAttendance('attendance', query);

  React.useEffect(() => setPage(1), [date, queryText, status, severity, department, location, exceptionType]);

  if (state.loading) return <Workspace><LoadingState label="Calculating daily attendance and exceptions…" /></Workspace>;
  if (state.error && !state.data) return <Workspace><ErrorState message={state.error} onRetry={state.reload} /></Workspace>;
  if (!state.data || !state.capabilities) return null;

  const allRecords = arrayValue(state.data.records);
  const periods = arrayValue(state.data.periods);
  const metrics = (state.data.metrics || {}) as Record<string, unknown>;
  const facets = (state.data.facets || {}) as Record<string, unknown>;
  const facetOptions = (value: unknown) => Array.isArray(value) ? value.map(item => [String(item), String(item).replace(/_/g, ' ')] as [string, string]) : [];
  const activePeriod = periods[0];
  const filteredRecords = severity
    ? allRecords.filter(row => resolveSeverity(row) === severity)
    : allRecords;
  const selectedRecord = selectedRecordId
    ? allRecords.find(row => String(row.id) === selectedRecordId) || null
    : null;
  const openRecord = (row: ShiftRecord) => setSelectedRecordId(String(row.id));
  const captureRecordSelection = (event: React.SyntheticEvent<HTMLElement>) => {
    const target = event.target as Element;
    const trigger = target.closest<HTMLElement>('[data-attendance-record-id]');
    if (trigger?.dataset.attendanceRecordId) setSelectedRecordId(trigger.dataset.attendanceRecordId);
  };
  const groups = buildExceptionGroups(filteredRecords);
  const pagination = (state.data.pagination || {}) as Record<string, unknown>;
  const hasMore = Boolean(pagination.hasMore);
  const exceptionCount = numberValue(metrics.exceptions);
  const periodExceptionCount = activePeriod?.open_exception_count == null ? exceptionCount : numberValue(activePeriod.open_exception_count);

  return (
    <Workspace>
      <CompactHeader
        date={date}
        onDateChange={setDate}
        activePeriod={activePeriod}
        records={allRecords}
        onExport={() => exportAllRows(query, date)}
      />
      <PermissionBanner scope={state.capabilities.dataScope} />
      {state.error && <InlineError message={state.error} />}
      <AttendanceMetrics metrics={metrics} />

      <section data-selected-record-id={selectedRecordId || undefined} onClickCapture={captureRecordSelection} className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#071321]">
        <AttendanceToolbar
          mode={mode}
          onModeChange={setMode}
          queryText={queryText}
          onQueryChange={setQueryText}
          status={status}
          onStatusChange={setStatus}
          severity={severity}
          onSeverityChange={setSeverity}
          department={department}
          onDepartmentChange={setDepartment}
          location={location}
          onLocationChange={setLocation}
          exceptionType={exceptionType}
          onExceptionTypeChange={setExceptionType}
          departments={facetOptions(facets.departments)}
          locations={facetOptions(facets.locations)}
          exceptionTypes={facetOptions(facets.exception_types)}
        />

        {filteredRecords.length === 0 ? (
          <EmptyState title="No attendance records for this filter" description="Records will appear after clocking, import, or an authorized attendance entry." />
        ) : mode === 'timeline' ? (
          <TimelineView records={filteredRecords} metrics={metrics} onOpen={openRecord} />
        ) : (
          <GroupedListView
            groups={groups}
            collapsed={collapsed}
            onToggle={key => setCollapsed(previous => ({ ...previous, [key]: !previous[key] }))}
            onOpen={openRecord}
            selectedId={selectedRecordId || undefined}
          />
        )}

        <PaginationBar
          page={page}
          pageSize={pageSize}
          visibleCount={filteredRecords.length}
          totalHint={mode === 'list' ? exceptionCount : numberValue(metrics.scheduled)}
          hasMore={hasMore}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      {activePeriod && state.capabilities.canManageWorkforce && (
        <PeriodReadinessBar period={activePeriod} unresolved={periodExceptionCount} saving={state.saving} canManagePayroll={state.capabilities.canManagePayroll} onAction={(body, message) => state.mutate(body, message)} />
      )}

      <AttendanceDrawer
        row={selectedRecord}
        period={activePeriod}
        open={Boolean(selectedRecord)}
        canManage={state.capabilities.canManageWorkforce}
        saving={state.saving}
        unresolved={periodExceptionCount}
        onClose={() => setSelectedRecordId(null)}
        onAction={async (body, message) => {
          const result = await state.mutate(body, message);
          if (result) setSelectedRecordId(null);
        }}
      />
    </Workspace>
  );
}

function Workspace({ children }: { children: React.ReactNode }) {
  return <main className="min-h-full w-full bg-transparent px-3 py-3 text-slate-950 sm:px-5 lg:px-6 dark:text-zinc-100"><div className="flex w-full max-w-none flex-col gap-3">{children}</div></main>;
}

function CompactHeader({
  date,
  onDateChange,
  activePeriod,
  records,
  onExport,
}: {
  date: string;
  onDateChange: (value: string) => void;
  activePeriod?: ShiftRecord;
  records: ShiftRecord[];
  onExport: () => Promise<void>;
}) {
  const moveDate = (direction: number) => {
    const nextDate = new Date(`${date}T00:00:00.000Z`);
    nextDate.setUTCDate(nextDate.getUTCDate() + direction);
    onDateChange(nextDate.toISOString().slice(0, 10));
  };

  return (
    <header className="flex flex-col gap-2 border-b border-slate-200 pb-2 lg:flex-row lg:items-end lg:justify-between dark:border-zinc-800">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Time · Employee attendance</p>
        <h1 className="text-lg font-bold tracking-tight">Attendance</h1>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <div className="inline-flex h-9 items-center" aria-label="Attendance date">
          <button type="button" onClick={() => moveDate(-1)} aria-label="Previous day" className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <label className="relative flex h-9 min-w-40 cursor-pointer items-center justify-center gap-2 px-2 text-sm font-semibold hover:text-blue-600 dark:hover:text-blue-400">
            <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden />
            <span>{formatHeaderDate(date)}</span>
            <input type="date" value={date} onChange={event => onDateChange(event.target.value)} aria-label="Choose date" className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
          <button type="button" onClick={() => moveDate(1)} aria-label="Next day" className="flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex h-9 min-w-44 items-center justify-between px-3 text-sm font-semibold">
          <span>{activePeriod ? `${formatDate(activePeriod.start_date, { month: 'short', day: 'numeric' })}–${formatDate(activePeriod.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Current period'}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
        <Button variant="ghost" size="sm" className="h-9" disabled={records.length === 0} onClick={() => void onExport()}>
          <ArrowDownToLine className="mr-2 h-4 w-4" />Export
        </Button>
      </div>
    </header>
  );
}

function AttendanceMetrics({ metrics }: { metrics: Record<string, unknown> }) {
  const items = [
    { label: 'Scheduled', value: numberValue(metrics.scheduled), tone: 'text-blue-600 dark:text-blue-400', icon: CalendarDays },
    { label: 'Present', value: numberValue(metrics.present), tone: 'text-emerald-600 dark:text-emerald-400', icon: Check },
    { label: 'Late', value: numberValue(metrics.late), tone: 'text-amber-600 dark:text-amber-400', icon: Clock3 },
    { label: 'Not checked in', value: numberValue(metrics.notCheckedIn), tone: 'text-rose-600 dark:text-rose-400', icon: CircleAlert },
    { label: 'On leave', value: numberValue(metrics.onLeave), tone: 'text-blue-600 dark:text-blue-400', icon: CalendarDays },
    { label: 'Open exceptions', value: numberValue(metrics.exceptions), tone: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
  ];
  return (
    <section className="grid grid-cols-2 border-y border-slate-200 bg-white/40 sm:grid-cols-3 xl:grid-cols-6 dark:border-zinc-800 dark:bg-transparent">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={cn('flex min-h-11 items-center gap-2 px-3 py-1.5', index > 0 && 'border-l border-slate-100 dark:border-zinc-800')}>
            <Icon className={cn('h-4 w-4 shrink-0', item.tone)} />
            <p className="min-w-0 truncate text-xs text-slate-500 dark:text-zinc-500">{item.label}</p>
            <p className={cn('ml-auto text-sm font-bold tabular-nums', item.tone)}>{item.value}</p>
          </div>
        );
      })}
    </section>
  );
}

function AttendanceToolbar({
  mode,
  onModeChange,
  queryText,
  onQueryChange,
  status,
  onStatusChange,
  severity,
  onSeverityChange,
  department,
  onDepartmentChange,
  location,
  onLocationChange,
  exceptionType,
  onExceptionTypeChange,
  departments,
  locations,
  exceptionTypes,
}: {
  mode: AttendanceMode;
  onModeChange: (mode: AttendanceMode) => void;
  queryText: string;
  onQueryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  severity: string;
  onSeverityChange: (value: string) => void;
  department: string; onDepartmentChange: (value: string) => void;
  location: string; onLocationChange: (value: string) => void;
  exceptionType: string; onExceptionTypeChange: (value: string) => void;
  departments: Array<[string, string]>; locations: Array<[string, string]>; exceptionTypes: Array<[string, string]>;
}) {
  const listMode = mode === 'list';
  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 p-3 xl:flex-row xl:items-center dark:border-zinc-800">
      <SearchField value={queryText} onChange={onQueryChange} placeholder={listMode ? 'Search exceptions' : 'Search by name or ID'} />
      {!listMode && <SelectFilter value={department} onChange={onDepartmentChange} label="All departments" options={departments} />}
      {!listMode && <SelectFilter value={location} onChange={onLocationChange} label="All locations" options={locations} />}
      {!listMode && <SelectFilter value={status} onChange={onStatusChange} label="All statuses" options={[
        ['present', 'Present'], ['checked_out', 'Checked out'], ['late', 'Late'], ['absent', 'Absent'], ['missing_record', 'Missing record'],
      ]} />}
      <SelectFilter value={severity} onChange={onSeverityChange} label="All severities" options={[
        ['critical', 'Critical'], ['high', 'High'], ['medium', 'Medium'],
      ]} />
      {listMode && <SelectFilter value={exceptionType} onChange={onExceptionTypeChange} label="All exception types" options={exceptionTypes} />}
      {listMode && <SelectFilter value={status} onChange={onStatusChange} label="All review status" options={[["new", "New"], ["in_review", "In review"], ["on_hold", "On hold"]]} />}
      {(status || severity || department || location || exceptionType) && <Button variant="ghost" size="sm" className="h-10 text-blue-600" onClick={() => { onStatusChange(''); onSeverityChange(''); onDepartmentChange(''); onLocationChange(''); onExceptionTypeChange(''); }}>Clear</Button>}
      <div className="ml-auto inline-flex h-10 min-w-56 rounded-md border border-slate-200 bg-slate-50 p-1 dark:border-zinc-800 dark:bg-zinc-900" aria-label="Attendance view">
        {(['timeline', 'list'] as AttendanceMode[]).map(value => (
          <button
            key={value}
            type="button"
            onClick={() => onModeChange(value)}
            aria-pressed={mode === value}
            className={cn('flex-1 rounded px-4 text-sm font-semibold capitalize transition-colors', mode === value ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950 dark:text-zinc-400 dark:hover:text-white')}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectFilter({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: Array<[string, string]> }) {
  return (
    <label className="relative min-w-44">
      <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <select value={value} onChange={event => onChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm">
        <option value="">{label}</option>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function TimelineView({ records, metrics, onOpen }: { records: ShiftRecord[]; metrics: Record<string, unknown>; onOpen: (row: ShiftRecord) => void }) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowPercent = clampPercent((nowMinutes - timeStart) / (timeEnd - timeStart) * 100);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1120px]">
        <div className="grid grid-cols-[220px_minmax(760px,1fr)_130px] border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 dark:border-zinc-800 dark:bg-[#0b1928] dark:text-zinc-400">
          <div className="px-4 py-3">Employee</div>
          <div className="relative flex justify-between px-5 py-3">
            {timeTicks.map(hour => <span key={hour} className="tabular-nums">{String(hour).padStart(2, '0')}:00</span>)}
          </div>
          <div className="px-4 py-3">Status</div>
        </div>
        <div className="relative">
          {nowMinutes >= timeStart && nowMinutes <= timeEnd && (
            <div className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-blue-500" style={{ left: `calc(220px + (100% - 350px) * ${nowPercent / 100})` }}>
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">Now {formatClock(nowMinutes)}</span>
            </div>
          )}
          {records.map(row => <TimelineRow key={String(row.id)} row={row} onOpen={onOpen} />)}
          {numberValue(metrics.onLeave) > 0 && (
            <div className="grid grid-cols-[220px_minmax(760px,1fr)_130px] border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-950 text-blue-400"><CalendarDays className="h-5 w-5" /></span><div><p className="text-sm font-semibold">On leave</p><p className="text-xs text-slate-500">{numberValue(metrics.onLeave)} employees</p></div></div>
              <div className="p-3"><div className="h-12 rounded border border-blue-800/60 bg-[repeating-linear-gradient(-45deg,rgba(37,99,235,.14),rgba(37,99,235,.14)_8px,rgba(37,99,235,.06)_8px,rgba(37,99,235,.06)_16px)] px-4 py-2 text-xs text-blue-300"><p className="font-semibold">On leave</p><p>All day</p></div></div>
              <div className="flex items-center px-4"><ShiftStatusBadge status="on_leave" /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ row, onOpen }: { row: ShiftRecord; onOpen: (row: ShiftRecord) => void }) {
  const timezone = stringValue(row.timezone, 'Asia/Bangkok');
  const scheduledStart = parseMinutes(row.start_time || row.scheduled_start_at, 9 * 60, timezone);
  const scheduledEnd = parseMinutes(row.end_time || row.scheduled_end_at, 18 * 60, timezone);
  const clockIn = row.clock_in ? parseMinutes(row.clock_in, scheduledStart, timezone) : null;
  const clockOut = row.clock_out ? parseMinutes(row.clock_out, Math.min(scheduledEnd, scheduledStart + numberValue(row.worked_minutes)), timezone) : null;
  const scheduleLeft = clampPercent((scheduledStart - timeStart) / (timeEnd - timeStart) * 100);
  const scheduleWidth = Math.max(3, clampPercent((scheduledEnd - scheduledStart) / (timeEnd - timeStart) * 100));
  const workLeft = clockIn === null ? scheduleLeft : clampPercent((clockIn - timeStart) / (timeEnd - timeStart) * 100);
  const workEnd = clockOut ?? (clockIn === null ? scheduledStart : Math.min(scheduledEnd, clockIn + Math.max(30, numberValue(row.worked_minutes))));
  const workWidth = Math.max(2, clampPercent((workEnd - (clockIn ?? scheduledStart)) / (timeEnd - timeStart) * 100));
  const exception = exceptionLabel(row);
  const missing = exception.toLowerCase().includes('missing') || stringValue(row.status, '').includes('missing');
  const late = numberValue(row.late_minutes) > 0 || stringValue(row.status, '') === 'late';
  const checkedOut = Boolean(row.clock_out);
  const statusLabel = missing ? 'Missing' : late ? 'Late start' : checkedOut ? 'Present' : 'Working';
  return (
    <div className="grid w-full grid-cols-[220px_minmax(760px,1fr)_130px] border-b border-slate-100 text-left transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60">
      <button type="button" data-attendance-record-id={String(row.id)} onClick={() => onOpen(row)} aria-label={`Open ${employeeName(row)} attendance record`} className="flex items-center gap-3 px-4 py-3 text-left"><EmployeeAvatar row={row} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{employeeName(row)}</p><p className="truncate text-[11px] text-slate-500">{stringValue(row.employee_number)}</p><p className="truncate text-[11px] text-slate-500">{stringValue(row.department_name)}</p></div>{hasException(row) ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}</button>
      <div className="relative my-2.5 h-14 border-x border-slate-100 bg-[linear-gradient(to_right,transparent_8.25%,rgba(148,163,184,.10)_8.33%,transparent_8.41%)] bg-[length:8.333%_100%] dark:border-zinc-800">
        <div className="absolute top-0 h-14 rounded border border-dashed border-blue-500/70 bg-blue-950/10" style={{ left: `${scheduleLeft}%`, width: `${scheduleWidth}%` }} />
        <div className="absolute top-1.5 text-[10px] leading-4 text-slate-400" style={{ left: `calc(${scheduleLeft}% + 12px)` }}><p>{formatClock(scheduledStart)} – {formatClock(scheduledEnd)}</p><p>Planned shift</p></div>
        {clockIn !== null && !missing && <><div className={cn('absolute top-7 h-5 rounded-sm', late ? 'bg-gradient-to-r from-amber-500 to-amber-600/55' : 'bg-gradient-to-r from-emerald-500 to-emerald-600/55')} style={{ left: `${workLeft}%`, width: `${workWidth}%` }}><span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">Working</span></div><span className={cn('absolute top-[1.6rem] z-10 flex h-5 w-5 items-center justify-center rounded-full border text-[10px]', late ? 'border-amber-300 bg-amber-600 text-white' : 'border-emerald-300 bg-emerald-600 text-white')} style={{ left: `calc(${workLeft}% - 10px)` }}><Check className="h-3 w-3" /></span><span className={cn('absolute top-7 text-[11px] font-semibold', late ? 'text-amber-400' : 'text-emerald-400')} style={{ left: `calc(${workLeft}% + 15px)` }}>{formatClock(clockIn)}</span>{checkedOut && <Flag className="absolute top-7 h-4 w-4 text-blue-400" style={{ left: `calc(${workLeft + workWidth}% - 18px)` }} />}</>}
        {missing && <div className="absolute top-7 flex h-5 items-center gap-1 px-2 text-[11px] font-semibold text-rose-400" style={{ left: `${Math.max(scheduleLeft + 23, workLeft)}%` }}><CircleAlert className="h-3.5 w-3.5" />No check-in</div>}
      </div>
      <button type="button" data-attendance-record-id={String(row.id)} onClick={() => onOpen(row)} aria-label={`Open ${employeeName(row)} status details`} className="flex flex-col justify-center gap-1 px-4 text-left"><span className={cn('w-fit rounded border px-2 py-1 text-[11px] font-semibold', missing ? 'border-rose-700 text-rose-400' : late ? 'border-amber-700 text-amber-400' : 'border-emerald-700 text-emerald-400')}>{statusLabel}</span><span className="flex items-center gap-1 text-[11px] text-slate-500"><Clock3 className="h-3 w-3" />{formatDuration(row.worked_minutes || numberValue(row.hours_worked) * 60)}</span></button>
    </div>
  );
}

function InlineError({ message }: { message: string }) { return <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-200">{message}</div>; }

function parseMinutes(value: unknown, fallback: number, timezone?: string) { if (!value) return fallback; const raw = String(value); if (/^\d{2}:\d{2}/.test(raw)) return Number(raw.slice(0, 2)) * 60 + Number(raw.slice(3, 5)); const date = new Date(raw); if (Number.isNaN(date.getTime())) return fallback; if (timezone) { const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date); const hour = Number(parts.find(part => part.type === 'hour')?.value); const minute = Number(parts.find(part => part.type === 'minute')?.value); if (Number.isFinite(hour) && Number.isFinite(minute)) return hour * 60 + minute; } return date.getHours() * 60 + date.getMinutes(); }
function clampPercent(value: number) { return Math.min(100, Math.max(0, value)); }
function formatClock(minutes: number) { return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; }
function formatHeaderDate(value: string) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }); }

function exportRows(rows: ShiftRecord[], date: string) {
  const columns = ['Employee', 'Employee ID', 'Department', 'Date', 'Clock in', 'Clock out', 'Worked minutes', 'Late minutes', 'Early minutes', 'Overtime minutes', 'Status', 'Exception'];
  const lines = [columns, ...rows.map(row => [employeeName(row), stringValue(row.employee_number, ''), stringValue(row.department_name, ''), date, formatTime(row.clock_in), formatTime(row.clock_out), numberValue(row.worked_minutes || numberValue(row.hours_worked) * 60), numberValue(row.late_minutes), numberValue(row.early_departure_minutes), numberValue(row.overtime_minutes || numberValue(row.overtime_hours) * 60), stringValue(row.status, ''), exceptionLabel(row)])].map(line => line.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = `attendance-${date}.csv`; link.click(); URL.revokeObjectURL(url);
}

async function exportAllRows(query: URLSearchParams, date: string) {
  const rows: ShiftRecord[] = [];
  let page = 1;
  for (;;) {
    const params = new URLSearchParams(query);
    params.set('page', String(page));
    params.set('pageSize', '100');
    const response = await fetch(`/api/hr/shift-attendance?view=attendance&${params.toString()}`, { credentials: 'include', cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to export attendance records.');
    const body = await response.json() as { data?: { records?: ShiftRecord[]; pagination?: { hasMore?: boolean } } };
    rows.push(...(body.data?.records || []));
    if (!body.data?.pagination?.hasMore) break;
    page += 1;
  }
  exportRows(rows, date);
}
