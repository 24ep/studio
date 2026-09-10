"use client";

import * as React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, ChartBarIcon, ClipboardDocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { LearningReviewQueue } from './LearningReviewQueue';
import { LearningReportsView } from './LearningReportsView';

type Overview = {
  summary?: Record<string, unknown>;
  pendingReviews?: Array<Record<string, unknown> & { id?: string }>;
  recentEnrollments?: Array<Record<string, unknown> & { id?: string }>;
};
type Capabilities = { canViewLearningManagement?: boolean; canReviewAssignments?: boolean; canOverrideCompletion?: boolean; canViewReports?: boolean };

export function LearningManagementPageClient({ view = 'overview' }: { view?: 'overview' | 'reviews' | 'reports' }) {
  const [data, setData] = React.useState<Overview | null>(null);
  const [capabilities, setCapabilities] = React.useState<Capabilities>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [overrideEnrollment, setOverrideEnrollment] = React.useState<Record<string, unknown> | null>(null);
  const [overrideReason, setOverrideReason] = React.useState('');
  const [savingOverride, setSavingOverride] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch('/api/learning/manage', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json() as { data?: Overview; capabilities?: Capabilities; message?: string };
      if (!response.ok || !payload.data) throw new Error(payload.message || 'Unable to load Learning Management.');
      setData(payload.data); setCapabilities(payload.capabilities || {});
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load Learning Management.'); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { if (view !== 'reports') void load(); else setLoading(false); }, [load, view]);

  const override = async () => {
    const enrollmentId = overrideEnrollment?.id ? String(overrideEnrollment.id) : null;
    if (!enrollmentId || overrideReason.trim().length < 5) { setError('Enter a clear reason before overriding completion.'); return; }
    setSavingOverride(true); setError(null);
    try {
      const response = await fetch('/api/learning/studio/actions', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'override_completion', enrollmentId, reason: overrideReason.trim() }) });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Unable to override completion.');
      setOverrideEnrollment(null); setOverrideReason(''); await load();
    } catch (overrideError) { setError(overrideError instanceof Error ? overrideError.message : 'Unable to override completion.'); }
    finally { setSavingOverride(false); }
  };

  if (error && !data && view !== 'reports') return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><div className="rounded-2xl border border-dashed p-8"><ExclamationTriangleIcon className="h-8 w-8 text-amber-600" /><h1 className="mt-4 text-2xl font-bold">Learning Management is unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><Button asChild className="mt-5"><Link href="/learning">Return to My Learning</Link></Button></div></main>;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b pb-7"><p className="text-xs font-bold uppercase tracking-[.16em] text-blue-700 dark:text-blue-300">Learning Management</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em] sm:text-4xl">Govern learning without mixing it into self-service.</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Assign and review employee learning, make deliberate completion overrides, and report on company-scoped progress.</p><nav className="mt-5 flex flex-wrap gap-2"><Button asChild variant={view === 'overview' ? 'default' : 'outline'}><Link href="/learning/manage">Overview</Link></Button><Button asChild variant={view === 'reviews' ? 'default' : 'outline'}><Link href="/learning/manage/reviews">Assignment reviews</Link></Button><Button asChild variant={view === 'reports' ? 'default' : 'outline'}><Link href="/learning/manage/reports">Reports</Link></Button></nav></header>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
      {view === 'reports' ? <div className="mt-6"><LearningReportsView /></div> : loading ? <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" /> : view === 'reviews' ? <section className="mt-6"><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-violet-700 dark:text-violet-300">Review queue</p><h2 className="text-2xl font-bold tracking-[-.03em]">Learner assignment submissions</h2></div><LearningReviewQueue submissions={(data?.pendingReviews || []) as never[]} onRefresh={load} /></section> : <OverviewContent data={data} capabilities={capabilities} onOverride={setOverrideEnrollment} />}

      <Dialog open={Boolean(overrideEnrollment)} onOpenChange={open => { if (!open) { setOverrideEnrollment(null); setOverrideReason(''); } }}><DialogContent><DialogHeader><DialogTitle>Override learning completion?</DialogTitle><DialogDescription>This is a governed exception. It marks the enrollment complete and records your reason in Learning activity and audit history.</DialogDescription></DialogHeader><div className="py-2"><Textarea className="min-h-28" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="Why should this enrollment be treated as complete?" /></div><DialogFooter><Button variant="outline" onClick={() => setOverrideEnrollment(null)} disabled={savingOverride}>Cancel</Button><Button onClick={override} disabled={savingOverride || overrideReason.trim().length < 5}>{savingOverride ? 'Completing…' : 'Confirm override'}</Button></DialogFooter></DialogContent></Dialog>
    </main>
  );
}

function OverviewContent({ data, capabilities, onOverride }: { data: Overview | null; capabilities: Capabilities; onOverride: (row: Record<string, unknown>) => void }) {
  const summary = data?.summary || {};
  const stats = [['Assigned', summary.assigned], ['In progress', summary.in_progress], ['Completed', summary.completed], ['Overdue', summary.overdue]];
  return <div className="mt-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label,value]) => <div key={String(label)} className="rounded-2xl border bg-card p-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{String(label)}</p><p className="mt-2 text-3xl font-bold">{Number(value || 0)}</p></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-2"><Link href="/learning/manage/reviews" className="group rounded-2xl border bg-card p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><ClipboardDocumentCheckIcon className="h-5 w-5" /></span><h2 className="mt-4 text-xl font-bold">Assignment reviews</h2><p className="mt-2 text-sm text-muted-foreground">{data?.pendingReviews?.length || 0} recent submissions waiting in the scoped queue.</p><span className="mt-5 inline-flex items-center text-sm font-semibold text-blue-700">Open queue<ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link><Link href="/learning/manage/reports" className="group rounded-2xl border bg-card p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><ChartBarIcon className="h-5 w-5" /></span><h2 className="mt-4 text-xl font-bold">Learning reports</h2><p className="mt-2 text-sm text-muted-foreground">Filter company learning by employee, course, status, due dates, and completion dates.</p><span className="mt-5 inline-flex items-center text-sm font-semibold text-blue-700">Open reports<ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link></div><section className="mt-6"><div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Recent enrollments</p><h2 className="text-xl font-bold">Operational actions</h2></div></div><div className="overflow-hidden rounded-2xl border bg-card"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Progress</th>{capabilities.canOverrideCompletion && <th className="px-4 py-3 text-right">Exception</th>}</tr></thead><tbody>{(data?.recentEnrollments || []).map(row => <tr key={String(row.id)} className="border-t"><td className="px-4 py-4 font-semibold">{String(row.employee_name || '—')}</td><td className="px-4 py-4">{String(row.course_title || '—')}</td><td className="px-4 py-4 capitalize">{String(row.status || '—').replaceAll('_',' ')}</td><td className="px-4 py-4">{Number(row.progress || 0)}%</td>{capabilities.canOverrideCompletion && <td className="px-4 py-4 text-right"><Button size="sm" variant="outline" disabled={row.status === 'completed'} onClick={() => onOverride(row)}>Override complete</Button></td>}</tr>)}{!(data?.recentEnrollments || []).length && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No learning enrollments in scope.</td></tr>}</tbody></table></div></div></section></div>;
}
