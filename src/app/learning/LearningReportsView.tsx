"use client";

import * as React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HrEmployeeSearchSelect } from '@/components/hr/HrEmployeeSearchSelect';

type ReportRow = Record<string, unknown> & {
  id?: string; employee_id?: string; course_id?: string; employee_name?: string; course_title?: string; status?: string; progress?: number; due_date?: string | null; completed_at?: string | null; active_seconds?: number;
};
type SubmissionRow = Record<string, unknown> & { id?: string; employee_name?: string; course_title?: string; block_title?: string; status?: string; updated_at?: string | null };
type Summary = { assigned?: number; not_started?: number; in_progress?: number; completed?: number; overdue?: number; active_seconds?: number };
type Report = { summary: Summary; rows: ReportRow[]; submissions: SubmissionRow[] };
type CatalogCourse = { id: string; title: string };
type CatalogResponse = { data?: CatalogCourse[]; message?: string };

function csvCell(value: unknown) { const text = value == null ? '' : String(value); return `"${text.replaceAll('"', '""')}"`; }
function date(value: unknown) { if (!value) return '—'; const parsed = new Date(String(value)); return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString(); }

export function LearningReportsView() {
  const [employeeId, setEmployeeId] = React.useState('');
  const [courseId, setCourseId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [dueFrom, setDueFrom] = React.useState('');
  const [dueTo, setDueTo] = React.useState('');
  const [completedFrom, setCompletedFrom] = React.useState('');
  const [completedTo, setCompletedTo] = React.useState('');
  const [report, setReport] = React.useState<Report | null>(null);
  const [courses, setCourses] = React.useState<CatalogCourse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries({ employeeId, courseId, status, dueFrom, dueTo, completedFrom, completedTo })) if (value) params.set(key, value);
      const response = await fetch(`/api/learning/studio/report?${params.toString()}`, { credentials: 'include', cache: 'no-store' });
      const payload = await response.json() as { data?: Report; message?: string };
      if (!response.ok || !payload.data) throw new Error(payload.message || 'Unable to load learning report.');
      setReport(payload.data);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load learning report.'); }
    finally { setLoading(false); }
  }, [employeeId, courseId, status, dueFrom, dueTo, completedFrom, completedTo]);

  React.useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/learning/catalog', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) { setCourses([]); return; }
        const payload = await response.json() as CatalogResponse;
        setCourses(payload.data || []);
      } catch {
        setCourses([]);
      }
    })();
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  const exportCsv = () => {
    if (!report) return;
    const headers = ['employee','course','status','progress','due_date','completed_at','active_seconds'];
    const lines = [headers.join(','), ...report.rows.map(row => [row.employee_name,row.course_title,row.status,row.progress,row.due_date,row.completed_at,row.active_seconds].map(csvCell).join(','))];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'learning-report.csv'; link.click(); URL.revokeObjectURL(url);
  };

  const summary = report?.summary || {};
  return (
    <div>
      <div className="rounded-2xl border bg-card p-5"><div className="grid gap-4 lg:grid-cols-4"><div className="lg:col-span-2"><p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Employee</p><HrEmployeeSearchSelect value={employeeId} onValueChange={setEmployeeId} /></div><div><p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Course</p><select value={courseId} onChange={e => setCourseId(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">All courses</option>{courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div><div><p className="mb-2 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">Status</p><select value={status} onChange={e => setStatus(e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">All statuses</option><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></div></div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><label className="text-xs font-semibold text-muted-foreground">Due from</label><Input type="date" className="mt-1" value={dueFrom} onChange={e => setDueFrom(e.target.value)} /></div><div><label className="text-xs font-semibold text-muted-foreground">Due to</label><Input type="date" className="mt-1" value={dueTo} onChange={e => setDueTo(e.target.value)} /></div><div><label className="text-xs font-semibold text-muted-foreground">Completed from</label><Input type="date" className="mt-1" value={completedFrom} onChange={e => setCompletedFrom(e.target.value)} /></div><div><label className="text-xs font-semibold text-muted-foreground">Completed to</label><Input type="date" className="mt-1" value={completedTo} onChange={e => setCompletedTo(e.target.value)} /></div></div><div className="mt-4 flex justify-end"><Button variant="outline" onClick={exportCsv} disabled={!report?.rows.length}><ArrowDownTrayIcon className="mr-2 h-4 w-4" />Export filtered CSV</Button></div></div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{[['Assigned',summary.assigned],['Not started',summary.not_started],['In progress',summary.in_progress],['Completed',summary.completed],['Overdue',summary.overdue],['Active hours',Math.round(Number(summary.active_seconds || 0)/3600)]].map(([label,value]) => <div key={String(label)} className="rounded-xl border bg-card p-4"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{Number(value || 0)}</p></div>)}</div>
      <div className="mt-5 overflow-hidden rounded-2xl border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[840px] text-sm"><thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Progress</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Completed</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading report…</td></tr> : report?.rows.length ? report.rows.map(row => <tr key={String(row.id)} className="border-t"><td className="px-4 py-4 font-semibold">{String(row.employee_name || '—')}</td><td className="px-4 py-4">{String(row.course_title || '—')}</td><td className="px-4 py-4 capitalize">{String(row.status || '—').replaceAll('_',' ')}</td><td className="px-4 py-4">{Number(row.progress || 0)}%</td><td className="px-4 py-4 text-muted-foreground">{date(row.due_date)}</td><td className="px-4 py-4 text-muted-foreground">{date(row.completed_at)}</td></tr>) : <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No learning records match these filters.</td></tr>}</tbody></table></div></div>
    </div>
  );
}
