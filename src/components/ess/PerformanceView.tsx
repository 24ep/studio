"use client";

import * as React from 'react';
import { BookOpenCheck, CheckCircle2, MessageSquareText, Target, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, MetricStrip, Section, StatusBadge } from './EssShared';
import type { EssDashboard, EssRow } from './ess-types';
import { dateValue, statusLabel, stringValue } from './ess-types';

export function PerformanceView({
  data,
  submitting,
  mutate,
}: {
  data: EssDashboard;
  submitting: boolean;
  mutate: (url: string, method: 'POST' | 'PATCH', body: unknown, successMessage: string) => Promise<unknown>;
}) {
  const currentReview = data.performance.find(item => !['completed', 'acknowledged'].includes(String(item.status))) || data.performance[0];
  const activeGoals = data.goals.filter(item => !['completed', 'cancelled'].includes(String(item.status)));
  const averageProgress = activeGoals.length ? Math.round(activeGoals.reduce((total, goal) => total + Number(goal.progress || 0), 0) / activeGoals.length) : 0;
  const pendingActions = data.performance.filter(item => ['not_started', 'in_progress', 'returned_for_revision', 'completed'].includes(String(item.status))).length;

  return (
    <div className="space-y-4">
      <MetricStrip items={[
        { label: 'Current cycle', value: stringValue(currentReview?.cycle_name, 'No active cycle'), icon: TrendingUp },
        { label: 'Active goals', value: activeGoals.length, icon: Target },
        { label: 'Goal progress', value: `${averageProgress}%`, icon: CheckCircle2 },
        { label: 'Actions due', value: pendingActions, icon: MessageSquareText },
      ]} />
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto">
          <TabsTrigger value="overview" className="min-h-9">Overview</TabsTrigger>
          <TabsTrigger value="goals" className="min-h-9">Goals</TabsTrigger>
          <TabsTrigger value="assessment" className="min-h-9">Self-assessment</TabsTrigger>
          <TabsTrigger value="history" className="min-h-9">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Section title="Current review cycle" description="Visibility follows the current review stage.">
            {currentReview ? <div>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div><h3 className="text-lg font-semibold">{stringValue(currentReview.cycle_name)}</h3><p className="mt-1 text-sm text-muted-foreground">{dateValue(currentReview.cycle_start_date)} – {dateValue(currentReview.cycle_end_date)}</p></div>
                <StatusBadge status={currentReview.status} />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {['Not started', 'Self-assessment', 'Manager review', 'Completed'].map((label, index) => {
                  const stages = ['not_started', 'in_progress', 'manager_review', 'completed', 'acknowledged'];
                  const currentIndex = Math.max(0, stages.indexOf(String(currentReview.status)));
                  return <div key={label} className="relative"><div className={`h-1.5 rounded-full ${index <= currentIndex ? 'bg-primary' : 'bg-muted'}`} /><p className="mt-2 text-xs text-muted-foreground">{label}</p></div>;
                })}
              </div>
              {Boolean(currentReview.summary) && <div className="mt-5 rounded-md bg-muted/40 p-4 text-sm">{stringValue(currentReview.summary)}</div>}
            </div> : <EmptyState title="No active review" description="A performance cycle will appear when assigned by HR." />}
          </Section>
          <Section title="Development" description="Learning recommendations continue in the Learning module.">
            {currentReview?.development_plan ? <p className="whitespace-pre-wrap text-sm">{stringValue(currentReview.development_plan)}</p> : <EmptyState title="No development plan yet" description="Add development priorities during your self-assessment." />}
            <Button asChild variant="outline" className="mt-4"><a href="/learning"><BookOpenCheck className="mr-2 h-4 w-4" />View assigned learning</a></Button>
          </Section>
        </TabsContent>

        <TabsContent value="goals">
          <Section title="Goals and key results" description="Update progress and leave context for your manager.">
            {data.goals.length ? <div className="grid gap-3 lg:grid-cols-2">{data.goals.map(goal => <GoalCard key={String(goal.id)} goal={goal} submitting={submitting} mutate={mutate} />)}</div> : <EmptyState title="No goals assigned" description="Goals will appear when your manager or review cycle assigns them." />}
          </Section>
        </TabsContent>

        <TabsContent value="assessment">
          {currentReview ? <SelfAssessment review={currentReview} submitting={submitting} mutate={mutate} /> : <EmptyState title="No assessment available" description="There is no active review to complete." />}
        </TabsContent>

        <TabsContent value="history">
          <Section title="Performance history">
            {data.performance.length ? <div className="divide-y divide-border">{data.performance.map(review => (
              <article key={String(review.id)} className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div><p className="text-sm font-semibold">{stringValue(review.cycle_name, 'Performance review')}</p><p className="mt-0.5 text-xs text-muted-foreground">Completed {dateValue(review.completed_at)} · Rating {stringValue(review.rating, 'Not shared')}</p></div>
                <div className="flex items-center gap-2"><StatusBadge status={review.status} />{review.status === 'completed' && <Button size="sm" variant="outline" disabled={submitting} onClick={() => void mutate('/api/ess/performance', 'PATCH', { action: 'acknowledge_review', id: review.id, expectedVersion: review.version }, 'Review acknowledged.')}>Acknowledge</Button>}</div>
              </article>
            ))}</div> : <EmptyState title="No previous reviews" description="Completed performance reviews will appear here." />}
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GoalCard({ goal, submitting, mutate }: {
  goal: EssRow;
  submitting: boolean;
  mutate: (url: string, method: 'POST' | 'PATCH', body: unknown, successMessage: string) => Promise<unknown>;
}) {
  const [progress, setProgress] = React.useState(Number(goal.progress || 0));
  const [comment, setComment] = React.useState('');
  const keyResults = Array.isArray(goal.key_results) ? goal.key_results : [];
  return (
    <article className="rounded-md border border-border p-4">
      <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{stringValue(goal.title)}</h3><p className="mt-1 text-xs text-muted-foreground">Due {dateValue(goal.due_date)}</p></div><StatusBadge status={goal.approval_status || goal.status} /></div>
      {Boolean(goal.description) && <p className="mt-3 text-sm text-muted-foreground">{stringValue(goal.description)}</p>}
      {keyResults.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-muted-foreground">{keyResults.map((item, index) => <li key={index}>{typeof item === 'object' ? stringValue((item as Record<string, unknown>).title) : String(item)}</li>)}</ul>}
      <div className="mt-4 flex items-center gap-3"><Progress value={progress} className="h-2 flex-1" /><span className="text-sm font-semibold tabular-nums">{progress}%</span></div>
      <label className="mt-4 block text-xs font-medium" htmlFor={`goal-${goal.id}`}>Progress: {progress}%</label>
      <input id={`goal-${goal.id}`} type="range" min="0" max="100" step="5" value={progress} onChange={event => setProgress(Number(event.target.value))} className="mt-1 w-full accent-primary" />
      <Textarea aria-label="Goal update comment" value={comment} onChange={event => setComment(event.target.value)} placeholder="Add context or evidence link" className="mt-3 min-h-16" />
      <Button className="mt-3" size="sm" disabled={submitting || (progress === Number(goal.progress || 0) && !comment.trim())} onClick={() => void mutate('/api/ess/performance', 'PATCH', { action: 'update_goal', id: goal.id, progress, comment: comment || null, expectedVersion: goal.version }, 'Goal progress updated.')}>Save progress</Button>
    </article>
  );
}

function SelfAssessment({ review, submitting, mutate }: {
  review: EssRow;
  submitting: boolean;
  mutate: (url: string, method: 'POST' | 'PATCH', body: unknown, successMessage: string) => Promise<unknown>;
}) {
  const [assessment, setAssessment] = React.useState(stringValue(review.self_assessment, ''));
  const [comments, setComments] = React.useState(stringValue(review.employee_comments, ''));
  const [development, setDevelopment] = React.useState(stringValue(review.development_plan, ''));
  const editable = ['not_started', 'in_progress', 'returned_for_revision'].includes(String(review.status));
  return (
    <Section title="Self-assessment" description={editable ? 'Your submission becomes read-only while the manager review is in progress.' : 'This assessment is currently read-only.'}>
      <div className="grid gap-4">
        <div className="space-y-1.5"><Label htmlFor="self-assessment">Accomplishments and impact</Label><Textarea id="self-assessment" disabled={!editable} value={assessment} onChange={event => setAssessment(event.target.value)} className="min-h-40" /></div>
        <div className="space-y-1.5"><Label htmlFor="employee-comments">Additional comments</Label><Textarea id="employee-comments" disabled={!editable} value={comments} onChange={event => setComments(event.target.value)} className="min-h-24" /></div>
        <div className="space-y-1.5"><Label htmlFor="development-plan">Development plan</Label><Textarea id="development-plan" disabled={!editable} value={development} onChange={event => setDevelopment(event.target.value)} className="min-h-24" /></div>
        {editable && <div className="sticky bottom-0 -mx-4 -mb-4 border-t border-border bg-card/95 p-4 backdrop-blur"><Button disabled={submitting || assessment.trim().length < 20} onClick={() => void mutate('/api/ess/performance', 'PATCH', { action: 'submit_self_assessment', id: review.id, selfAssessment: assessment, employeeComments: comments || null, developmentPlan: development || null, expectedVersion: review.version }, 'Self-assessment submitted.')}>Submit self-assessment</Button></div>}
      </div>
    </Section>
  );
}
