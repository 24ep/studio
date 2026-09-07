"use client";

import * as React from 'react';
import { ArrowRightLeft, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { employeeName, formatDate, formatTime, numberValue, stringValue, type ShiftRecord } from '../shift-types';

type RequestType =
  | 'shift_change'
  | 'shift_swap'
  | 'open_shift'
  | 'temporary_schedule_change'
  | 'work_location_change'
  | 'rest_day_change'
  | 'drop_shift'
  | 'cover_shift'
  | 'availability_update';

export function ShiftRequestComposer({
  assignments,
  eligibleAssignments,
  openShifts,
  colleagues,
  initialRequest,
  saving,
  onSave,
}: {
  assignments: ShiftRecord[];
  eligibleAssignments: ShiftRecord[];
  openShifts: ShiftRecord[];
  colleagues: ShiftRecord[];
  initialRequest?: ShiftRecord | null;
  saving: boolean;
  onSave: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = React.useState(() => ({
    requestType: stringValue(initialRequest?.request_type, 'shift_change') as RequestType,
    assignmentId: stringValue(initialRequest?.assignment_id, ''),
    requestedAssignmentId: stringValue(initialRequest?.requested_assignment_id, ''),
    openShiftId: stringValue(initialRequest?.open_shift_id, ''),
    swapEmployeeId: stringValue(initialRequest?.swap_employee_id, ''),
    effectiveStart: String(initialRequest?.effective_start || today).slice(0, 10),
    effectiveEnd: String(initialRequest?.effective_end || today).slice(0, 10),
    workLocation: stringValue(initialRequest?.work_location, ''),
    reason: stringValue(initialRequest?.reason, ''),
  }));
  const [acknowledged, setAcknowledged] = React.useState(Boolean(initialRequest));
  const editing = Boolean(initialRequest?.id);
  const colleagueAssignments = eligibleAssignments.filter(row =>
    !form.swapEmployeeId || String(row.employee_id) === form.swapEmployeeId,
  );
  const current = assignments.find(row => String(row.id) === form.assignmentId);
  const requested = eligibleAssignments.find(row => String(row.id) === form.requestedAssignmentId);
  const selectedOpen = openShifts.find(row => String(row.id) === form.openShiftId);
  const requiresOwnShift = ['shift_change', 'shift_swap', 'temporary_schedule_change', 'work_location_change', 'rest_day_change', 'drop_shift'].includes(form.requestType);
  const validTarget = !requiresOwnShift || Boolean(form.assignmentId);
  const swapValid = form.requestType !== 'shift_swap' || Boolean(form.swapEmployeeId && form.requestedAssignmentId);
  const openValid = form.requestType !== 'open_shift' || Boolean(form.openShiftId);
  const coverValid = form.requestType !== 'cover_shift' || Boolean(form.requestedAssignmentId || form.openShiftId);
  const canSubmit = form.reason.trim().length >= 3 && validTarget && swapValid && openValid && coverValid;

  const body = (saveAsDraft: boolean) => ({
    action: editing ? 'update_shift_request' : 'create_shift_request',
    ...(editing ? { requestId: initialRequest?.id, expectedVersion: numberValue(initialRequest?.version) } : { saveAsDraft }),
    requestType: form.requestType,
    assignmentId: form.assignmentId || null,
    requestedAssignmentId: form.requestedAssignmentId || null,
    openShiftId: form.openShiftId || null,
    swapEmployeeId: form.swapEmployeeId || null,
    effectiveStart: form.effectiveStart,
    effectiveEnd: form.effectiveEnd,
    workLocation: form.workLocation || null,
    reason: form.reason,
  });

  return (
    <section className="rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-slate-200 p-4 dark:border-zinc-800">
        <h2 className="font-bold">{editing ? 'Edit shift request' : 'New shift request'}</h2>
        <p className="mt-1 text-sm text-slate-500">{editing ? 'Save the corrected request, then resubmit it from request history.' : 'Drafts remain private until submitted.'}</p>
      </div>
      <div className="p-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Field label="Request type" id="shift-request-type">
            <select id="shift-request-type" value={form.requestType} onChange={event => setForm(value => ({ ...value, requestType: event.target.value as RequestType, requestedAssignmentId: '', openShiftId: '', swapEmployeeId: '' }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="shift_change">Shift change</option><option value="shift_swap">Shift swap</option><option value="open_shift">Open-shift request</option>
              <option value="temporary_schedule_change">Temporary schedule change</option><option value="work_location_change">Work-location change</option>
              <option value="rest_day_change">Rest-day change</option><option value="drop_shift">Drop a shift</option><option value="cover_shift">Cover another shift</option>
              <option value="availability_update">Availability update</option>
            </select>
          </Field>

          {requiresOwnShift && <Field label="Current shift" id="current-shift"><select id="current-shift" value={form.assignmentId} onChange={event => setForm(value => ({ ...value, assignmentId: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select your shift</option>{assignments.map(row => <option key={String(row.id)} value={String(row.id)}>{formatDate(row.shift_date)} · {formatTime(row.start_time)}–{formatTime(row.end_time)}</option>)}</select></Field>}

          {form.requestType === 'shift_swap' && <>
            <Field label="Swap colleague" id="swap-colleague"><select id="swap-colleague" value={form.swapEmployeeId} onChange={event => setForm(value => ({ ...value, swapEmployeeId: event.target.value, requestedAssignmentId: '' }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select eligible colleague</option>{colleagues.map(row => <option key={String(row.id)} value={String(row.id)}>{employeeName(row)} · {stringValue(row.job_title)}</option>)}</select></Field>
            <Field label="Colleague shift" id="requested-shift"><select id="requested-shift" value={form.requestedAssignmentId} onChange={event => setForm(value => ({ ...value, requestedAssignmentId: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select colleague shift</option>{colleagueAssignments.map(row => <option key={String(row.id)} value={String(row.id)}>{employeeName(row)} · {formatDate(row.shift_date)} · {formatTime(row.start_time)}–{formatTime(row.end_time)}</option>)}</select></Field>
          </>}

          {form.requestType === 'cover_shift' && <Field label="Shift to cover" id="cover-shift"><select id="cover-shift" value={form.requestedAssignmentId} onChange={event => setForm(value => ({ ...value, requestedAssignmentId: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select another employee shift</option>{eligibleAssignments.map(row => <option key={String(row.id)} value={String(row.id)}>{employeeName(row)} · {formatDate(row.shift_date)} · {formatTime(row.start_time)}–{formatTime(row.end_time)}</option>)}</select></Field>}

          {form.requestType === 'open_shift' && <Field label="Open shift" id="open-shift"><select id="open-shift" value={form.openShiftId} onChange={event => setForm(value => ({ ...value, openShiftId: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select open shift</option>{openShifts.map(row => <option key={String(row.id)} value={String(row.id)}>{formatDate(row.shift_date)} · {formatTime(row.start_at)}–{formatTime(row.end_at)} · {stringValue(row.work_location, 'Location not set')}</option>)}</select></Field>}

          <Field label="Effective start" id="effective-start"><Input id="effective-start" type="date" value={form.effectiveStart} onChange={event => setForm(value => ({ ...value, effectiveStart: event.target.value }))} /></Field>
          <Field label="Effective end" id="effective-end"><Input id="effective-end" type="date" value={form.effectiveEnd} onChange={event => setForm(value => ({ ...value, effectiveEnd: event.target.value }))} /></Field>
          {form.requestType === 'work_location_change' && <Field label="Requested work location" id="requested-location"><Input id="requested-location" value={form.workLocation} onChange={event => setForm(value => ({ ...value, workLocation: event.target.value }))} /></Field>}
          <div className="sm:col-span-2 xl:col-span-1"><Field label="Business reason" id="shift-reason"><Textarea id="shift-reason" value={form.reason} onChange={event => setForm(value => ({ ...value, reason: event.target.value }))} className="min-h-24" placeholder="Explain why this change is needed" /></Field></div>
        </div>

        {(current || requested || selectedOpen) && <div className="mt-4 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto_1fr] dark:border-zinc-800 dark:bg-zinc-900/60"><Comparison label="Current" row={current} /><ArrowRightLeft className="self-center justify-self-center text-slate-400" /><Comparison label="Requested" row={requested || selectedOpen} /></div>}

        {!editing && <label className="mt-4 flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-400"><input className="mt-0.5" type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />I understand the roster changes only after all required acceptance and approvals complete.</label>}
        <div className="sticky bottom-0 mt-4 flex justify-end gap-2 border-t border-slate-200 bg-white pt-4 dark:border-zinc-800 dark:bg-zinc-950">
          {!editing && <Button variant="outline" disabled={saving || !canSubmit} onClick={() => void onSave(body(true))}>Save draft</Button>}
          <Button disabled={saving || !canSubmit || (!editing && !acknowledged)} onClick={() => void onSave(body(false))}><Send className="mr-2 h-4 w-4" />{editing ? 'Save changes' : 'Submit request'}</Button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>;
}

function Comparison({ label, row }: { label: string; row?: ShiftRecord }) {
  return <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-sm font-semibold">{row ? formatDate(row.shift_date) : 'Not selected'}</p><p className="mt-0.5 text-xs text-slate-500">{row ? `${formatTime(row.start_at || row.start_time)}–${formatTime(row.end_at || row.end_time)} · ${stringValue(row.work_location || row.schedule_name)}` : 'Choose a shift to compare'}</p></div>;
}
