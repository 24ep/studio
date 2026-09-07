"use client";

import * as React from 'react';
import { ArrowRight, FileUp, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { EssDashboard, EssRow } from '@/components/ess/ess-types';
import { stringValue, timeValue } from '@/components/ess/ess-types';

const correctionTypes = [
  ['missing_check_in', 'Missing check-in'],
  ['missing_check_out', 'Missing check-out'],
  ['incorrect_check_in', 'Incorrect check-in'],
  ['incorrect_check_out', 'Incorrect check-out'],
  ['missing_break', 'Missing break'],
  ['incorrect_break', 'Incorrect break'],
  ['incorrect_attendance_status', 'Incorrect attendance status'],
  ['work_from_home_correction', 'Work-from-home correction'],
  ['off_site_work_correction', 'Off-site work correction'],
  ['incorrect_shift_assignment', 'Incorrect shift assignment'],
] as const;

type FormState = {
  correctionType: string;
  workDate: string;
  clockIn: string;
  clockOut: string;
  breakMinutes: string;
  requestedStatus: string;
  workLocation: string;
  assignmentId: string;
  reason: string;
};

function dateKey(value: unknown) {
  return String(value || '').slice(0, 10);
}

function inputTime(value: unknown) {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 5);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function localIso(workDate: string, time: string) {
  if (!workDate || !time) return null;
  return new Date(`${workDate}T${time}:00`).toISOString();
}

export function AttendanceCorrectionRequestForm({
  initialRequest,
  saving,
  onSave,
}: {
  initialRequest?: EssRow | null;
  saving: boolean;
  onSave: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const initialValues = initialRequest?.requested_values && typeof initialRequest.requested_values === 'object' ? initialRequest.requested_values as Record<string, unknown> : {};
  const initialDocuments = Array.isArray(initialRequest?.supporting_documents) ? initialRequest.supporting_documents : [];
  const [dashboard, setDashboard] = React.useState<EssDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [evidence, setEvidence] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [form, setForm] = React.useState<FormState>({
    correctionType: stringValue(initialValues.correctionType, 'missing_check_in'),
    workDate: dateKey(initialValues.workDate),
    clockIn: inputTime(initialValues.clockIn),
    clockOut: inputTime(initialValues.clockOut),
    breakMinutes: String(initialValues.breakMinutes ?? 0),
    requestedStatus: stringValue(initialValues.requestedStatus, 'present'),
    workLocation: stringValue(initialValues.workLocation, 'remote'),
    assignmentId: stringValue(initialValues.assignmentId, ''),
    reason: stringValue(initialRequest?.reason, ''),
  });

  React.useEffect(() => {
    let active = true;
    void fetch('/api/ess/me', { credentials: 'include', cache: 'no-store' })
      .then(async response => {
        const payload = await response.json().catch(() => ({})) as { data?: EssDashboard; message?: string };
        if (!response.ok || !payload.data) throw new Error(payload.message || 'Unable to load your attendance history.');
        return payload.data;
      })
      .then(data => {
        if (!active) return;
        setDashboard(data);
        const firstDate = dateKey(data.attendance[0]?.work_date) || dateKey(data.shifts[0]?.shift_date) || new Date().toLocaleDateString('en-CA');
        setForm(previous => ({ ...previous, workDate: previous.workDate || firstDate }));
      })
      .catch(error => { if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load your attendance history.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const currentRecord = dashboard?.attendance.find(row => dateKey(row.work_date) === form.workDate);
  const dayAssignments = dashboard?.shifts.filter(row => dateKey(row.shift_date) === form.workDate) || [];

  React.useEffect(() => {
    if (!currentRecord || initialRequest) return;
    setForm(previous => ({
      ...previous,
      clockIn: inputTime(currentRecord.clock_in),
      clockOut: inputTime(currentRecord.clock_out),
      breakMinutes: String(Number(currentRecord.break_minutes || 0)),
      requestedStatus: stringValue(currentRecord.status, 'present'),
      workLocation: stringValue(currentRecord.work_location, 'remote'),
      assignmentId: stringValue(currentRecord.assignment_id, ''),
    }));
  }, [currentRecord, form.workDate, initialRequest]);

  const uploadEvidence = async () => {
    if (!evidence) return [];
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', evidence);
      body.append('title', `Attendance correction evidence · ${form.workDate}`);
      body.append('type', 'attendance_correction_evidence');
      const response = await fetch('/api/ess/documents/upload', { method: 'POST', credentials: 'include', body });
      const payload = await response.json().catch(() => ({})) as { data?: { id?: string }; message?: string };
      if (!response.ok || !payload.data?.id) throw new Error(payload.message || 'Unable to upload supporting evidence.');
      return [{
        name: evidence.name,
        size: evidence.size < 1024 * 1024 ? `${Math.max(1, Math.round(evidence.size / 1024))} KB` : `${(evidence.size / (1024 * 1024)).toFixed(1)} MB`,
        url: `/api/ess/files?kind=document&id=${encodeURIComponent(payload.data.id)}`,
      }];
    } finally {
      setUploading(false);
    }
  };

  const submit = async (saveAsDraft: boolean) => {
    const supportingDocuments = evidence ? await uploadEvidence() : initialDocuments;
    const values: Record<string, unknown> = {
      workDate: form.workDate,
      correctionType: form.correctionType,
      attendanceRecordId: currentRecord?.id || null,
    };
    if (['missing_check_in', 'incorrect_check_in'].includes(form.correctionType)) values.clockIn = localIso(form.workDate, form.clockIn);
    if (['missing_check_out', 'incorrect_check_out'].includes(form.correctionType)) values.clockOut = localIso(form.workDate, form.clockOut);
    if (['missing_break', 'incorrect_break'].includes(form.correctionType)) values.breakMinutes = Number(form.breakMinutes || 0);
    if (form.correctionType === 'incorrect_attendance_status') values.requestedStatus = form.requestedStatus;
    if (form.correctionType === 'work_from_home_correction') values.workLocation = form.workLocation || 'remote';
    if (form.correctionType === 'off_site_work_correction') values.workLocation = form.workLocation || 'field';
    if (form.correctionType === 'incorrect_shift_assignment') values.assignmentId = form.assignmentId || null;

    return onSave({
      ...(initialRequest?.id ? { id: initialRequest.id, expectedVersion: Number(initialRequest.version || 1) } : { requestType: 'attendance_correction', saveAsDraft }),
      title: `${form.correctionType.replace(/_/g, ' ')} · ${form.workDate}`,
      reason: form.reason,
      values,
      originalValues: currentRecord ? {
        attendanceRecordId: currentRecord.id,
        assignmentId: currentRecord.assignment_id || null,
        status: currentRecord.status || null,
        clockIn: currentRecord.clock_in || null,
        clockOut: currentRecord.clock_out || null,
        breakMinutes: Number(currentRecord.break_minutes || 0),
        workLocation: currentRecord.work_location || null,
      } : {},
      supportingDocuments,
    });
  };

  const busy = saving || uploading;
  if (loading) return <div className="p-5 text-sm text-slate-500">Loading authoritative attendance data…</div>;
  if (loadError) return <div className="m-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{loadError}</div>;

  return (
    <section className="rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-slate-200 p-4 dark:border-zinc-800">
        <h2 className="font-bold">{initialRequest ? 'Edit attendance correction' : 'Request attendance correction'}</h2>
        <p className="mt-1 text-sm text-slate-500">Only the field you correct will replace the authoritative attendance value after approval.</p>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Correction type" id="time-correction-type"><select id="time-correction-type" value={form.correctionType} onChange={event => setForm(value => ({ ...value, correctionType: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{correctionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Attendance date" id="time-correction-date"><Input id="time-correction-date" type="date" value={form.workDate} onChange={event => setForm(value => ({ ...value, workDate: event.target.value }))} /></Field>
        </div>

        <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-[1fr_auto_1fr] dark:border-zinc-800 dark:bg-zinc-900/50">
          <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Current record</p><p className="mt-1 font-semibold">{currentRecord ? `${timeValue(currentRecord.clock_in)}–${timeValue(currentRecord.clock_out)}` : 'No attendance record'}</p><p className="text-xs text-slate-500">{currentRecord ? `${stringValue(currentRecord.status)} · ${Number(currentRecord.break_minutes || 0)}m break` : 'A new correction record will be created.'}</p></div>
          <ArrowRight className="self-center justify-self-center text-slate-400" />
          <div><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Correction</p><p className="mt-1 font-semibold capitalize">{form.correctionType.replace(/_/g, ' ')}</p><p className="text-xs text-slate-500">Untouched fields stay unchanged.</p></div>
        </div>

        {['missing_check_in', 'incorrect_check_in'].includes(form.correctionType) && <Field label="Correct check-in" id="time-correction-checkin"><Input id="time-correction-checkin" type="time" value={form.clockIn} onChange={event => setForm(value => ({ ...value, clockIn: event.target.value }))} /></Field>}
        {['missing_check_out', 'incorrect_check_out'].includes(form.correctionType) && <Field label="Correct check-out" id="time-correction-checkout"><Input id="time-correction-checkout" type="time" value={form.clockOut} onChange={event => setForm(value => ({ ...value, clockOut: event.target.value }))} /></Field>}
        {['missing_break', 'incorrect_break'].includes(form.correctionType) && <Field label="Correct break minutes" id="time-correction-break"><Input id="time-correction-break" type="number" min="0" max="720" value={form.breakMinutes} onChange={event => setForm(value => ({ ...value, breakMinutes: event.target.value }))} /></Field>}
        {form.correctionType === 'incorrect_attendance_status' && <Field label="Correct attendance status" id="time-correction-status"><select id="time-correction-status" value={form.requestedStatus} onChange={event => setForm(value => ({ ...value, requestedStatus: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option><option value="on_leave">On leave</option><option value="working_remotely">Working remotely</option><option value="off_site">Off-site</option><option value="checked_out">Checked out</option></select></Field>}
        {['work_from_home_correction', 'off_site_work_correction'].includes(form.correctionType) && <Field label="Correct work location" id="time-correction-location"><Input id="time-correction-location" value={form.workLocation} onChange={event => setForm(value => ({ ...value, workLocation: event.target.value }))} placeholder={form.correctionType === 'work_from_home_correction' ? 'remote' : 'field / client site'} /></Field>}
        {form.correctionType === 'incorrect_shift_assignment' && <Field label="Correct shift assignment" id="time-correction-assignment"><select id="time-correction-assignment" value={form.assignmentId} onChange={event => setForm(value => ({ ...value, assignmentId: event.target.value }))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select assignment</option>{dayAssignments.map((row: EssRow) => <option key={String(row.id)} value={String(row.id)}>{stringValue(row.start_time)}–{stringValue(row.end_time)} · {stringValue(row.work_location, 'Assigned location')}</option>)}</select></Field>}

        <Field label="Reason" id="time-correction-reason"><Textarea id="time-correction-reason" value={form.reason} onChange={event => setForm(value => ({ ...value, reason: event.target.value }))} className="min-h-24" placeholder="Explain what is incorrect and what the reviewer should verify" /></Field>
        <div className="space-y-1.5"><Label htmlFor="time-correction-evidence">Supporting evidence <span className="font-normal text-slate-500">· optional</span></Label><label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-3 text-sm dark:border-zinc-700"><FileUp className="h-4 w-4" /><span className="min-w-0 flex-1 truncate">{evidence?.name || 'Upload PDF or image evidence'}</span><input id="time-correction-evidence" className="sr-only" type="file" accept="application/pdf,image/*" onChange={event => setEvidence(event.target.files?.[0] || null)} /></label></div>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        {!initialRequest && <Button variant="outline" disabled={busy || !form.workDate || form.reason.trim().length < 3} onClick={() => void submit(true)}>Save draft</Button>}
        <Button disabled={busy || !form.workDate || form.reason.trim().length < 3} onClick={() => void submit(false)}><Send className="mr-2 h-4 w-4" />{uploading ? 'Uploading…' : initialRequest ? 'Save changes' : 'Submit correction'}</Button>
      </div>
    </section>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label>{children}</div>;
}
