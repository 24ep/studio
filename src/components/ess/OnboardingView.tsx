'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Clock3, GraduationCap, Loader2, LockKeyhole, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from './EssShared';

type Row = Record<string, unknown>;
type OnboardingPayload = { onboarding: Row[]; onboardingTasks: Row[] };
type LearningPayload = { available?: boolean; enrollments?: Array<{ id: string; courseTitle: string; status: string; progress: number; dueDate: string | null }> };

function text(value: unknown, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

export function OnboardingView() {
  const [data, setData] = React.useState<OnboardingPayload | null>(null);
  const [learning, setLearning] = React.useState<LearningPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [busyTask, setBusyTask] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const load = React.useCallback(async (background = false) => {
    background ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [onboardingResponse, learningResponse] = await Promise.all([
        fetch('/api/ess/onboarding', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/learning/me', { credentials: 'include', cache: 'no-store' }),
      ]);
      const onboardingBody = await onboardingResponse.json() as { data?: OnboardingPayload; message?: string };
      if (!onboardingResponse.ok || !onboardingBody.data) throw new Error(onboardingBody.message || 'Unable to load your onboarding journey.');
      setData(onboardingBody.data);
      if (learningResponse.ok) {
        const learningBody = await learningResponse.json() as { data?: LearningPayload };
        setLearning(learningBody.data || null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load your onboarding journey.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const journey = data?.onboarding[0] || null;
  const tasks = journey ? (data?.onboardingTasks || []).filter(task => String(task.onboarding_id) === String(journey.id)) : [];
  const employeeTasks = tasks.filter(task => String(task.owner_role || '').toLowerCase() === 'employee');
  const outstandingLearning = (learning?.enrollments || []).filter(item => item.status !== 'completed');

  async function startJourney() {
    if (!journey || busyTask) return;
    setBusyTask('journey');
    setMessage(null);
    try {
      const response = await fetch('/api/ess/onboarding', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingId: journey.id, action: 'start' }),
      });
      const body = await response.json() as { message?: string };
      if (!response.ok) throw new Error(body.message || 'Unable to start onboarding.');
      setMessage('Onboarding started.');
      await load(true);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Unable to start onboarding.');
    } finally {
      setBusyTask(null);
    }
  }

  async function completeTask(task: Row) {
    if (!journey || busyTask) return;
    const taskId = String(task.task_id || '');
    if (!taskId) return;
    setBusyTask(taskId);
    setMessage(null);
    try {
      const response = await fetch('/api/ess/onboarding', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingId: journey.id, taskId, action: 'complete_task' }),
      });
      const body = await response.json() as { message?: string };
      if (!response.ok) throw new Error(body.message || 'Unable to complete this onboarding task.');
      setMessage('Task completed.');
      await load(true);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Unable to complete this onboarding task.');
    } finally {
      setBusyTask(null);
    }
  }

  if (loading) return <main className="grid min-h-[50vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading onboarding" /></main>;

  return (
    <main className="min-h-full bg-[hsl(var(--app-page-background,var(--background)))] px-3 py-4 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[1200px] space-y-4">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Employee self-service</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">My onboarding</h1>
            <p className="mt-1 text-sm text-muted-foreground">Complete the tasks you own and see what other teams are preparing for you.</p>
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => void load(true)} aria-label="Refresh onboarding">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </header>

        {message && <div role="status" className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">{message}</div>}
        {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">{error}</div>}

        {!journey ? (
          <section className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">No onboarding journey assigned</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your People team will assign onboarding here when needed.</p>
          </section>
        ) : (
          <>
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">Your onboarding journey</h2><StatusBadge status={journey.status} /></div>
                  <p className="mt-1 text-sm text-muted-foreground">Target {journey.target_date ? new Date(String(journey.target_date)).toLocaleDateString() : 'date not set'}</p>
                </div>
                {String(journey.status) === 'not_started' && <Button className="min-h-11" disabled={busyTask === 'journey'} onClick={() => void startJourney()}>Start onboarding</Button>}
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium">Overall progress</span><span className="tabular-nums text-muted-foreground">{Number(journey.progress || 0)}%</span></div>
                <Progress value={Number(journey.progress || 0)} className="h-2" />
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card">
              <div className="border-b border-border px-4 py-3"><h2 className="font-semibold">Onboarding checklist</h2><p className="mt-1 text-xs text-muted-foreground">Employee-owned tasks can be completed here. Tasks owned by IT, HR, or other teams are read-only.</p></div>
              <div className="divide-y divide-border">
                {tasks.map(task => {
                  const completed = String(task.status) === 'completed';
                  const owned = String(task.owner_role || '').toLowerCase() === 'employee';
                  const taskId = String(task.task_id || '');
                  return (
                    <article key={taskId} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 gap-3">
                        {completed ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />}
                        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{text(task.title, 'Onboarding task')}</h3>{!owned && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"><LockKeyhole className="h-3 w-3" />{text(task.owner_role, 'team')}</span>}</div>{Boolean(task.description) && <p className="mt-1 text-sm text-muted-foreground">{text(task.description)}</p>}</div>
                      </div>
                      {owned && !completed && <Button variant="outline" className="min-h-11" disabled={busyTask === taskId} onClick={() => void completeTask(task)}>{busyTask === taskId ? 'Completing…' : 'Mark complete'}</Button>}
                    </article>
                  );
                })}
                {tasks.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No checklist tasks have been assigned yet.</div>}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /><h2 className="font-semibold">Assigned learning</h2></div>
                {outstandingLearning.length ? <div className="mt-3 space-y-3">{outstandingLearning.slice(0, 4).map(item => <div key={item.id} className="rounded-md border border-border p-3"><div className="flex items-center justify-between gap-3"><p className="font-medium">{item.courseTitle}</p><span className="text-xs text-muted-foreground">{item.progress}%</span></div><Progress value={item.progress} className="mt-2 h-1.5" />{item.dueDate && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Due {new Date(item.dueDate).toLocaleDateString()}</p>}</div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No outstanding onboarding learning.</p>}
                <Button asChild variant="outline" className="mt-4 min-h-11"><Link href="/learning">Open My Learning</Link></Button>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="font-semibold">What happens next</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Complete your employee-owned items. IT, your manager, and the People team complete their assigned steps separately. The onboarding case closes only after the workflow confirms all required owners are done.</p>
                <p className="mt-3 text-sm font-medium">Your tasks: {employeeTasks.filter(task => String(task.status) === 'completed').length}/{employeeTasks.length} complete</p>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
