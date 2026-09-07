"use client";

import * as React from 'react';
import { Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { numberValue, stringValue, type ShiftRecord } from '../shift-types';

type SetupKind = 'period' | 'definition' | 'schedule' | 'open';

export function RosterSetupDialog({
  open,
  onOpenChange,
  saving,
  definitions,
  currentStart,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  definitions: ShiftRecord[];
  currentStart: string;
  onSave: (body: Record<string, unknown>, message: string) => Promise<unknown>;
}) {
  const [kind, setKind] = React.useState<SetupKind>('period');
  const end = React.useMemo(() => { const date = new Date(`${currentStart}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 6); return date.toISOString().slice(0, 10); }, [currentStart]);
  const [form, setForm] = React.useState({
    name: `Roster · ${currentStart}`,
    code: 'DAY',
    startDate: currentStart,
    endDate: end,
    shiftDate: currentStart,
    startTime: '09:00',
    endTime: '18:00',
    location: 'Office',
    weeklyHours: '40',
    breakMinutes: '60',
    graceMinutes: '10',
    headcount: '1',
    shiftDefinitionId: '',
  });
  React.useEffect(() => setForm(value => ({ ...value, startDate: currentStart, endDate: end, shiftDate: currentStart, name: `Roster · ${currentStart}` })), [currentStart, end]);

  const submit = async () => {
    let body: Record<string, unknown>;
    let message: string;
    if (kind === 'period') {
      body = { action: 'create_roster_period', name: form.name, startDate: form.startDate, endDate: form.endDate, location: form.location || null };
      message = 'Roster period created.';
    } else if (kind === 'definition') {
      body = { action: 'create_shift_definition', code: form.code, name: form.name, startTime: form.startTime, endTime: form.endTime, workLocation: form.location || null, breakMinutes: numberValue(form.breakMinutes), gracePeriodMinutes: numberValue(form.graceMinutes) };
      message = 'Shift definition created.';
    } else if (kind === 'schedule') {
      body = { action: 'create_work_schedule', name: form.name, weeklyHours: numberValue(form.weeklyHours), startTime: form.startTime, endTime: form.endTime, workLocation: form.location || null };
      message = 'Work schedule created.';
    } else {
      body = { action: 'create_open_shift', shiftDate: form.shiftDate, startTime: form.startTime, endTime: form.endTime, workLocation: form.location, headcountRequired: numberValue(form.headcount), shiftDefinitionId: form.shiftDefinitionId || null };
      message = 'Open shift created.';
    }
    const result = await onSave(body, message);
    if (result) onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" />Time setup</DialogTitle><DialogDescription>Create the roster foundations needed to schedule employees without database seeding.</DialogDescription></DialogHeader>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{([['period','Roster period'],['definition','Shift definition'],['schedule','Work schedule'],['open','Open shift']] as const).map(([value,label]) => <Button key={value} type="button" variant={kind === value ? 'default' : 'outline'} size="sm" onClick={() => setKind(value)}>{label}</Button>)}</div>
    <div className="grid gap-3 sm:grid-cols-2">
      {kind !== 'open' && <Field label={kind === 'definition' ? 'Definition name' : kind === 'schedule' ? 'Schedule name' : 'Period name'} id="setup-name"><Input id="setup-name" value={form.name} onChange={event => setForm(value => ({ ...value, name: event.target.value }))} /></Field>}
      {kind === 'definition' && <Field label="Code" id="setup-code"><Input id="setup-code" value={form.code} onChange={event => setForm(value => ({ ...value, code: event.target.value }))} /></Field>}
      {kind === 'period' && <><Field label="Start date" id="setup-start"><Input id="setup-start" type="date" value={form.startDate} onChange={event => setForm(value => ({ ...value, startDate: event.target.value }))} /></Field><Field label="End date" id="setup-end"><Input id="setup-end" type="date" value={form.endDate} onChange={event => setForm(value => ({ ...value, endDate: event.target.value }))} /></Field></>}
      {kind === 'open' && <Field label="Shift date" id="setup-shift-date"><Input id="setup-shift-date" type="date" value={form.shiftDate} onChange={event => setForm(value => ({ ...value, shiftDate: event.target.value }))} /></Field>}
      {kind !== 'period' && <><Field label="Start time" id="setup-time-start"><Input id="setup-time-start" type="time" value={form.startTime} onChange={event => setForm(value => ({ ...value, startTime: event.target.value }))} /></Field><Field label="End time" id="setup-time-end"><Input id="setup-time-end" type="time" value={form.endTime} onChange={event => setForm(value => ({ ...value, endTime: event.target.value }))} /></Field></>}
      <Field label="Work location" id="setup-location"><Input id="setup-location" value={form.location} onChange={event => setForm(value => ({ ...value, location: event.target.value }))} /></Field>
      {kind === 'definition' && <><Field label="Break minutes" id="setup-break"><Input id="setup-break" type="number" min="0" max="720" value={form.breakMinutes} onChange={event => setForm(value => ({ ...value, breakMinutes: event.target.value }))} /></Field><Field label="Grace minutes" id="setup-grace"><Input id="setup-grace" type="number" min="0" max="240" value={form.graceMinutes} onChange={event => setForm(value => ({ ...value, graceMinutes: event.target.value }))} /></Field></>}
      {kind === 'schedule' && <Field label="Weekly hours" id="setup-weekly"><Input id="setup-weekly" type="number" min="1" max="168" value={form.weeklyHours} onChange={event => setForm(value => ({ ...value, weeklyHours: event.target.value }))} /></Field>}
      {kind === 'open' && <><Field label="Headcount" id="setup-headcount"><Input id="setup-headcount" type="number" min="1" max="100" value={form.headcount} onChange={event => setForm(value => ({ ...value, headcount: event.target.value }))} /></Field><Field label="Shift definition" id="setup-definition"><select id="setup-definition" value={form.shiftDefinitionId} onChange={event => setForm(value => ({ ...value, shiftDefinitionId: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">No definition</option>{definitions.map(row => <option key={String(row.id)} value={String(row.id)}>{stringValue(row.name)} · {stringValue(row.start_time)}–{stringValue(row.end_time)}</option>)}</select></Field></>}
    </div>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button><Button onClick={() => void submit()} disabled={saving || !form.location.trim() || (kind !== 'open' && !form.name.trim())}>Create</Button></div>
  </DialogContent></Dialog>;
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>; }
