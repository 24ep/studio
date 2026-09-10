"use client";

import * as React from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Coffee,
  Home,
  LogOut,
  MapPin,
  Navigation,
  PencilLine,
  Trees,
  TriangleAlert,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';
import { cn } from '@/lib/utils';
import { EmptyState, StatusBadge } from './EssShared';
import type { EssDashboard, EssRow } from './ess-types';
import { dateValue, statusLabel, stringValue, timeValue } from './ess-types';

type AttendanceAction = 'clock_in' | 'clock_out' | 'start_break' | 'end_break';
type WorkLocation = 'office' | 'remote' | 'field';
type DayTone = 'present' | 'late' | 'leave' | 'scheduled' | 'off' | 'empty';

const locationOptions: Array<{ value: WorkLocation; label: string; icon: React.ElementType }> = [
  { value: 'office', label: 'Office', icon: Building2 },
  { value: 'remote', label: 'Remote', icon: Home },
  { value: 'field', label: 'Off-site', icon: Trees },
];

const dayToneMeta: Record<DayTone, { label: string; dot: string; surface: string; icon: React.ElementType }> = {
  present: { label: 'Present', dot: 'bg-emerald-600', surface: 'bg-emerald-50/70 dark:bg-emerald-950/20', icon: Check },
  late: { label: 'Late', dot: 'bg-amber-500', surface: 'bg-amber-50/80 dark:bg-amber-950/20', icon: Clock3 },
  leave: { label: 'Leave', dot: 'bg-rose-500', surface: 'bg-rose-50/70 dark:bg-rose-950/20', icon: CalendarClock },
  scheduled: { label: 'Scheduled', dot: 'bg-blue-600', surface: 'bg-blue-50/70 dark:bg-blue-950/20', icon: CalendarDays },
  off: { label: 'Weekly off', dot: 'bg-slate-300 dark:bg-zinc-700', surface: 'bg-slate-50/50 dark:bg-zinc-900/50', icon: Coffee },
  empty: { label: 'No record', dot: 'bg-slate-200 dark:bg-zinc-800', surface: 'bg-transparent', icon: CalendarDays },
};

function localDateKey(value = new Date()) {
  return value.toLocaleDateString('en-CA');
}

function rowDateKey(value: unknown) {
  return String(value || '').slice(0, 10);
}

function numberValue(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function calendarStart(anchor: Date) {
  const start = new Date(anchor);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset - 7);
  start.setHours(12, 0, 0, 0);
  return start;
}

function getDayTone(record: EssRow | undefined, shift: EssRow | undefined, date: Date): DayTone {
  const status = stringValue(record?.status, '').toLowerCase();
  if (status.includes('late') || status.includes('exception') || status.includes('missing')) return 'late';
  if (status.includes('leave') || status.includes('absent')) return 'leave';
  if (record?.clock_in || status.includes('present') || status.includes('complete')) return 'present';
  if (shift) return 'scheduled';
  if (date.getDay() === 0 || date.getDay() === 6) return 'off';
  return 'empty';
}

export function AttendanceView({
  mode,
  data,
  submitting,
  mutate,
}: {
  mode: 'history' | 'check-in';
  data: EssDashboard;
  submitting: boolean;
  mutate: (url: string, method: 'POST' | 'PATCH', body: unknown, successMessage: string) => Promise<unknown>;
}) {
  const [workLocation, setWorkLocation] = React.useState<WorkLocation>('office');
  const [note, setNote] = React.useState('');
  const [currentTime, setCurrentTime] = React.useState(() => new Date());
  const [anchorDate, setAnchorDate] = React.useState(() => new Date());
  const [selectedDate, setSelectedDate] = React.useState(() => mode === 'check-in' ? localDateKey() : rowDateKey(data.attendance[0]?.work_date) || localDateKey());
  const [locationError, setLocationError] = React.useState<string | null>(null);

  useVisibilityInterval(() => setCurrentTime(new Date()), 30_000, true);

  const attendanceByDate = React.useMemo(() => new Map(data.attendance.map(row => [rowDateKey(row.work_date), row])), [data.attendance]);
  const shiftsByDate = React.useMemo(() => new Map(data.shifts.map(row => [rowDateKey(row.shift_date), row])), [data.shifts]);
  const today = attendanceByDate.get(localDateKey()) || null;
  const todayShift = shiftsByDate.get(localDateKey());
  const selectedRecord = attendanceByDate.get(selectedDate);
  const selectedShift = shiftsByDate.get(selectedDate);
  const selectedTone = getDayTone(selectedRecord, selectedShift, dateFromKey(selectedDate));
  const clockedIn = Boolean(today?.clock_in && !today?.clock_out);
  const onBreak = Boolean(today?.open_break_started_at);
  const complete = Boolean(today?.clock_in && today?.clock_out);
  const nextAction: AttendanceAction | null = complete ? null : !clockedIn ? 'clock_in' : onBreak ? 'end_break' : 'start_break';
  const calendarDays = React.useMemo(() => Array.from({ length: 14 }, (_, index) => addDays(calendarStart(anchorDate), index)), [anchorDate]);
  const monthLabel = anchorDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const presentCount = data.attendance.filter(row => getDayTone(row, undefined, dateFromKey(rowDateKey(row.work_date))) === 'present').length;
  const lateCount = data.attendance.filter(row => getDayTone(row, undefined, dateFromKey(rowDateKey(row.work_date))) === 'late').length;
  const leaveCount = data.attendance.filter(row => getDayTone(row, undefined, dateFromKey(rowDateKey(row.work_date))) === 'leave').length;

  const attendanceAction = async (action: AttendanceAction) => {
    setLocationError(null);
    const body: Record<string, unknown> = { action, workLocation, note: note || null, idempotencyKey: crypto.randomUUID() };

    if (action === 'clock_in' || action === 'clock_out') {
      if (!navigator.geolocation) {
        setLocationError('Location is not available on this device. Try again from a supported device.');
        return;
      }
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }));
        body.latitude = position.coords.latitude;
        body.longitude = position.coords.longitude;
        body.locationAccuracyMeters = position.coords.accuracy;
      } catch {
        setLocationError('We could not confirm your location. Enable precise location access, then try again.');
        return;
      }
    }

    const result = await mutate('/api/ess/attendance', 'POST', body, `${action.replace(/_/g, ' ')} recorded.`);
    if (result) setNote('');
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      <CheckInRail
        currentTime={currentTime}
        today={today}
        todayShift={todayShift}
        workLocation={workLocation}
        note={note}
        clockedIn={clockedIn}
        onBreak={onBreak}
        complete={complete}
        nextAction={nextAction}
        submitting={submitting}
        locationError={locationError}
        onLocationChange={setWorkLocation}
        onNoteChange={setNote}
        onAction={attendanceAction}
      />

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_14px_42px_-38px_rgba(15,23,42,0.65)]">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
            <div className="flex flex-col gap-4 border-b border-border px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">My attendance calendar</p>
                <h2 className="mt-1 font-serif text-[clamp(1.65rem,3vw,2.25rem)] tracking-[-0.025em]">{monthLabel}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => { setAnchorDate(new Date()); setSelectedDate(localDateKey()); }}>Today</Button>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label="Previous two weeks" onClick={() => setAnchorDate(value => addDays(value, -14))}><ArrowLeft className="h-4 w-4" /></Button>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label="Next two weeks" onClick={() => setAnchorDate(value => addDays(value, 14))}><ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>

            <MonthlySummary present={presentCount} late={lateCount} leave={leaveCount} scheduled={data.shifts.length} />

            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-7 border-b border-border bg-muted/20">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <div key={day} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{day}</div>)}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map(date => {
                    const key = localDateKey(date);
                    const record = attendanceByDate.get(key);
                    const shift = shiftsByDate.get(key);
                    return <CalendarDay key={key} date={date} record={record} shift={shift} selected={selectedDate === key} today={key === localDateKey()} onSelect={() => setSelectedDate(key)} />;
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {(['present', 'late', 'leave', 'scheduled', 'off'] as DayTone[]).map(tone => <LegendItem key={tone} tone={tone} />)}
              </div>
              <Button asChild variant="outline" size="sm"><a href="/ess/attendance-corrections"><PencilLine className="mr-2 h-4 w-4" />Request correction</a></Button>
            </div>
          </div>

          <DayDetails dateKey={selectedDate} record={selectedRecord} shift={selectedShift} tone={selectedTone} />
        </div>
      </section>
    </div>
  );
}

function CheckInRail({
  currentTime,
  today,
  todayShift,
  workLocation,
  note,
  clockedIn,
  onBreak,
  complete,
  nextAction,
  submitting,
  locationError,
  onLocationChange,
  onNoteChange,
  onAction,
}: {
  currentTime: Date;
  today: EssRow | null;
  todayShift?: EssRow;
  workLocation: WorkLocation;
  note: string;
  clockedIn: boolean;
  onBreak: boolean;
  complete: boolean;
  nextAction: AttendanceAction | null;
  submitting: boolean;
  locationError: string | null;
  onLocationChange: (value: WorkLocation) => void;
  onNoteChange: (value: string) => void;
  onAction: (action: AttendanceAction) => Promise<void>;
}) {
  const actionLabel = nextAction === 'clock_in' ? 'Check in' : nextAction === 'start_break' ? 'Start break' : 'End break';
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-[#f8f8f3] dark:bg-zinc-950">
      <div className="grid divide-y divide-border lg:grid-cols-[0.72fr_1fr_1.15fr] lg:divide-x lg:divide-y-0">
        <div className="flex items-center gap-4 px-5 py-4">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"><Clock3 className="h-5 w-5" /></span>
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Current time</p><p className="mt-0.5 text-2xl font-medium tabular-nums tracking-tight">{currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p><p className="text-xs text-muted-foreground">{currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p></div>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Work location</p>{todayShift && <span className="text-xs text-muted-foreground">{stringValue(todayShift.start_time)}–{stringValue(todayShift.end_time)}</span>}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {locationOptions.map(option => {
              const Icon = option.icon;
              return <button key={option.value} type="button" aria-pressed={workLocation === option.value} disabled={clockedIn || complete} onClick={() => onLocationChange(option.value)} className={cn('flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60', workLocation === option.value ? 'bg-emerald-800 text-white dark:bg-emerald-600' : 'bg-background text-muted-foreground ring-1 ring-inset ring-border hover:text-foreground')}><Icon className="h-3.5 w-3.5" />{option.label}</button>;
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-end">
          {!clockedIn && !complete && <div className="min-w-0 flex-1"><Label htmlFor="attendance-note" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Note <span className="normal-case tracking-normal">· optional</span></Label><Input id="attendance-note" value={note} onChange={event => onNoteChange(event.target.value)} placeholder="Add context for today" className="mt-1.5 h-9 bg-background" /></div>}
          <div className={cn('flex gap-2', (clockedIn || complete) && 'flex-1 items-center justify-between')}>
            {complete ? <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" />Checked out at {timeValue(today?.clock_out)}</div> : (
              <>
                {nextAction && <Button type="button" disabled={submitting} onClick={() => void onAction(nextAction)} className="min-w-32 rounded-full bg-emerald-800 text-white hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500">{nextAction === 'clock_in' ? <Navigation className="mr-2 h-4 w-4" /> : <Coffee className="mr-2 h-4 w-4" />}{submitting ? 'Recording…' : actionLabel}</Button>}
                {clockedIn && !onBreak && <Button type="button" variant="outline" onClick={() => void onAction('clock_out')} disabled={submitting} className="rounded-full"><LogOut className="mr-2 h-4 w-4" />Check out</Button>}
              </>
            )}
          </div>
        </div>
      </div>
      {locationError && <div role="alert" className="flex items-start gap-2 border-t border-rose-200 bg-rose-50 px-5 py-2.5 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />{locationError}</div>}
    </section>
  );
}

function MonthlySummary({ present, late, leave, scheduled }: { present: number; late: number; leave: number; scheduled: number }) {
  const items = [
    { label: 'Present', value: present, tone: 'present' as DayTone },
    { label: 'Late', value: late, tone: 'late' as DayTone },
    { label: 'Leave', value: leave, tone: 'leave' as DayTone },
    { label: 'Upcoming', value: scheduled, tone: 'scheduled' as DayTone },
  ];
  return <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border bg-[#faf9f5] px-4 py-3 dark:bg-zinc-950/50 sm:px-6"><span className="mr-1 text-xs font-semibold text-foreground">Period totals</span>{items.map(item => <div key={item.label} className="flex items-center gap-2"><span className={cn('h-2 w-2 rounded-full', dayToneMeta[item.tone].dot)} /><span className="text-xs text-muted-foreground">{item.label}</span><span className="text-sm font-semibold tabular-nums">{item.value}</span></div>)}</div>;
}

function CalendarDay({ date, record, shift, selected, today, onSelect }: { date: Date; record?: EssRow; shift?: EssRow; selected: boolean; today: boolean; onSelect: () => void }) {
  const tone = getDayTone(record, shift, date);
  const meta = dayToneMeta[tone];
  const Icon = meta.icon;
  const hasDetail = Boolean(record || shift);
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} aria-label={`${dateValue(date)}: ${meta.label}`} className={cn('relative min-h-32 border-b border-r border-border p-3 text-left transition-[background-color,box-shadow] duration-200 hover:bg-muted/45 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600', meta.surface, selected && 'z-[1] shadow-[inset_0_0_0_2px_rgb(22_101_52)] dark:shadow-[inset_0_0_0_2px_rgb(74_222_128)]')}>
      <div className="flex items-start justify-between gap-2"><span className={cn('text-sm font-semibold tabular-nums', today && 'grid h-7 w-7 -translate-x-1 -translate-y-1 place-items-center rounded-full bg-slate-950 text-white dark:bg-zinc-100 dark:text-zinc-950')}>{date.getDate()}</span>{hasDetail && <span className={cn('grid h-6 w-6 place-items-center rounded-full text-white', meta.dot)}><Icon className="h-3.5 w-3.5" /></span>}</div>
      <div className="mt-6">
        <p className="text-xs font-semibold">{meta.label}</p>
        {record ? <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">{timeValue(record.clock_in)}–{timeValue(record.clock_out)}</p> : shift ? <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">{stringValue(shift.start_time)}–{stringValue(shift.end_time)}</p> : <p className="mt-1 text-[11px] text-muted-foreground">—</p>}
      </div>
    </button>
  );
}

function LegendItem({ tone }: { tone: DayTone }) {
  const meta = dayToneMeta[tone];
  return <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className={cn('h-2.5 w-2.5 rounded-full', meta.dot)} />{meta.label}</span>;
}

function DayDetails({ dateKey, record, shift, tone }: { dateKey: string; record?: EssRow; shift?: EssRow; tone: DayTone }) {
  const meta = dayToneMeta[tone];
  const Icon = meta.icon;
  return (
    <aside className="bg-[#faf9f5] p-5 dark:bg-zinc-950/50 sm:p-6" aria-label="Selected day details">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Day details</p>
      <div className="mt-5 flex items-start gap-3">
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full text-white', meta.dot)}><Icon className="h-5 w-5" /></span>
        <div><h3 className="font-serif text-xl leading-tight">{dateValue(dateKey)}</h3><p className="mt-1 text-sm font-medium">{meta.label}</p></div>
      </div>

      {record || shift ? (
        <div className="mt-6 divide-y divide-border border-y border-border">
          <DetailRow label="Check in" value={timeValue(record?.clock_in)} />
          <DetailRow label="Check out" value={timeValue(record?.clock_out)} />
          <DetailRow label="Total hours" value={record ? `${numberValue(record.hours_worked).toFixed(2)}h` : 'Not recorded'} />
          <DetailRow label="Break" value={record ? `${numberValue(record.break_minutes)}m` : '—'} />
          <DetailRow label="Shift" value={shift ? `${stringValue(shift.start_time)}–${stringValue(shift.end_time)}` : 'Not assigned'} />
        </div>
      ) : <div className="mt-6"><EmptyState title="No activity" description="There is no shift or attendance record for this day." /></div>}

      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Work location</p>
        <p className="mt-2 flex items-center gap-2 text-sm font-medium"><MapPin className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />{statusLabel(record?.work_location || shift?.location_name || 'Not recorded')}</p>
      </div>
      <Button asChild variant="outline" className="mt-8 w-full"><a href="/ess/attendance-corrections"><PencilLine className="mr-2 h-4 w-4" />Request correction</a></Button>
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 py-3 text-sm"><span className="text-muted-foreground">{label}</span><span className="font-semibold tabular-nums">{value}</span></div>;
}
