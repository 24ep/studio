"use client";

import * as React from 'react';
import {
  AlertTriangle,
  Award,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Lightbulb,
  MessageSquareText,
  ShieldCheck,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { PerformanceWorkspaceData } from '@/lib/performance/performance-contracts';
import {
  EmptyPerformanceState,
  formatDate,
  PerformanceStatusBadge,
  SmallLink,
  Timeline,
  WorkspaceSection,
  percent,
} from './performance-ui';
import {
  CommentBlock,
  CompetencyMetric,
  DrawerMetric,
  EmployeeCell,
  FeedbackField,
  InlineProgress,
  InsightGrid,
  NotePreview,
  ProfileField,
  StatusDistribution,
  TeamMetric,
  ThemeList,
  average,
  collectFeedbackThemes,
  normalizeCompetencies,
} from './performance-view-parts';

type ActionName = 'check-in' | 'feedback' | 'recognition' | 'development' | 'evidence';

export function MyPerformanceView({
  data,
  onAction,
}: {
  data: PerformanceWorkspaceData;
  onAction: (action: ActionName) => void;
}) {
  const review = data.reviews[0];
  const strengths = collectFeedbackThemes(data.feedback, 'wentWell');
  const developmentAreas = collectFeedbackThemes(data.feedback, 'improvementSuggestion');
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <WorkspaceSection title="Performance profile" description="One current view across Appraisal, Goal, feedback, competencies, and development.">
          <div className="grid gap-6 sm:grid-cols-2">
            <ProfileField label="Current review period" value={String(review?.cycleName || 'No active review')} helper={review ? `${formatDate(review.cycleStartDate)} – ${formatDate(review.cycleEndDate)}` : 'Appraisal is the source of truth'} />
            <ProfileField label="Current review status" value={<PerformanceStatusBadge status={review?.status || 'not_started'} />} helper="Visibility follows the formal review stage" />
            <ProfileField label="Previous review result" value={data.reviews.find(item => item.rating !== null)?.rating ? `${String(data.reviews.find(item => item.rating !== null)?.rating)} / 5` : 'Not released'} helper="Only released ratings are visible" />
            <ProfileField label="Recognition received" value={data.recognition.length} helper="Recorded recognition items" />
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
            <Button asChild className="bg-[#263f73] text-white hover:bg-[#1f345f]"><a href="/ess/performance">View appraisal</a></Button>
            <Button asChild variant="outline"><a href="/ess/performance">View all goals</a></Button>
            <Button variant="outline" onClick={() => onAction('feedback')}>Request feedback</Button>
          </div>
        </WorkspaceSection>

        <div className="grid gap-4 lg:grid-cols-2">
          <WorkspaceSection title="Strengths" description="Themes from visible feedback and released assessments.">
            {strengths.length ? <ThemeList themes={strengths} tone="positive" /> : <EmptyPerformanceState title="No strength themes yet" description="Themes appear only when feedback or released assessment evidence exists." />}
          </WorkspaceSection>
          <WorkspaceSection title="Development areas" description="Specific, recorded opportunities—not a predictive score.">
            {developmentAreas.length ? <ThemeList themes={developmentAreas} tone="development" /> : <EmptyPerformanceState title="No development themes yet" description="Development areas appear from visible feedback and released review evidence." />}
          </WorkspaceSection>
        </div>

        <WorkspaceSection title="Employee and manager comments" description="Manager comments are shown only when the current review stage permits visibility.">
          {review?.employeeComments || review?.managerAssessment ? (
            <div className="grid gap-4 md:grid-cols-2">
              <CommentBlock label="Employee comments" value={review.employeeComments} />
              <CommentBlock label="Manager comments" value={review.managerAssessment} />
            </div>
          ) : <EmptyPerformanceState title="No visible comments" description="Formal comments will appear after they are recorded and released through Appraisal." />}
        </WorkspaceSection>
      </div>
      <aside className="space-y-4 xl:sticky xl:top-4">
        <WorkspaceSection title="Recognition">
          {data.recognition.length ? (
            <div className="space-y-4">
              {data.recognition.slice(0, 6).map(item => (
                <article key={String(item.id)} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-600" aria-hidden />
                    <p className="text-xs font-bold capitalize text-slate-900 dark:text-slate-100">{String(item.category || '').replace(/_/g, ' ')}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{String(item.message)}</p>
                  <p className="mt-2 text-xs text-slate-500">{String(item.providerName || 'Colleague')} · {formatDate(item.createdAt)}</p>
                </article>
              ))}
            </div>
          ) : <EmptyPerformanceState title="No recognition yet" description="Meaningful recognition will appear here when it is recorded." />}
          <Button variant="outline" className="mt-4 w-full" onClick={() => onAction('recognition')}>Recognize a colleague</Button>
        </WorkspaceSection>
        <WorkspaceSection title="Activity history">
          <Timeline activities={data.activities.slice(0, 8)} />
        </WorkspaceSection>
      </aside>
    </div>
  );
}

export function CheckInsView({
  data,
  onAction,
  onComplete,
}: {
  data: PerformanceWorkspaceData;
  onAction: (action: ActionName) => void;
  onComplete: (row: Record<string, unknown>) => void;
}) {
  return (
    <WorkspaceSection
      title="Check-ins and one-on-one meetings"
      description="Shared meeting records with backend-protected private note fields."
      action={<Button onClick={() => onAction('check-in')} className="bg-[#263f73] text-white hover:bg-[#1f345f]">Schedule check-in</Button>}
    >
      {data.checkIns.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.checkIns.map(checkIn => (
            <article key={String(checkIn.id)} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold capitalize text-slate-950 dark:text-slate-50">{String(checkIn.type || 'Check-in').replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(checkIn.meetingDate)} · {String(checkIn.managerName || 'Manager')}</p>
                </div>
                <PerformanceStatusBadge status={checkIn.status} />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Agenda</p>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{String(checkIn.agenda || 'No agenda prepared.')}</p>
              {checkIn.sharedNotes ? <NotePreview label="Shared notes" value={checkIn.sharedNotes} /> : null}
              {checkIn.employeeDraftNotes ? <NotePreview label="Your private draft" value={checkIn.employeeDraftNotes} privateNote /> : null}
              {checkIn.managerPrivateNotes ? <NotePreview label="Manager-private note" value={checkIn.managerPrivateNotes} privateNote /> : null}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-xs text-slate-500">Version {String(checkIn.version || 1)}</span>
                {!['completed', 'cancelled'].includes(String(checkIn.status)) ? (
                  <Button variant="outline" size="sm" onClick={() => onComplete(checkIn)}>Complete check-in</Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : <EmptyPerformanceState title="No check-ins recorded" description="Schedule a one-on-one, probation, quarterly, development, or career check-in." action={<Button variant="outline" onClick={() => onAction('check-in')}>Schedule the first check-in</Button>} />}
    </WorkspaceSection>
  );
}

export function FeedbackView({
  data,
  onAction,
}: {
  data: PerformanceWorkspaceData;
  onAction: (action: ActionName) => void;
}) {
  const published = data.feedback.filter(item => item.status === 'published');
  const requested = data.feedback.filter(item => item.status === 'requested');
  return (
    <div className="space-y-4">
      <WorkspaceSection title="Continuous feedback" description="Visibility is enforced when records are read—not just hidden in the interface." action={<div className="flex gap-2"><Button variant="outline" onClick={() => onAction('feedback')}>Request feedback</Button><Button onClick={() => onAction('feedback')} className="bg-[#263f73] text-white hover:bg-[#1f345f]">Give feedback</Button></div>}>
        {requested.length ? (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/70 dark:bg-blue-950/30">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-800 dark:text-blue-200">Open feedback requests</p>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">{requested.length} request{requested.length === 1 ? '' : 's'} are waiting for a response.</p>
          </div>
        ) : null}
        {published.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {published.map(item => (
              <article key={String(item.id)} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold capitalize text-slate-950 dark:text-slate-50">{String(item.feedbackType || 'Feedback').replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-xs text-slate-500">{String(item.providerName || 'Feedback provider')} · {formatDate(item.createdAt)}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full capitalize">{String(item.visibility || 'recipient').replace(/_/g, ' ')}</Badge>
                </div>
                {item.context ? <FeedbackField label="Context" value={item.context} /> : null}
                {item.wentWell ? <FeedbackField label="What went well" value={item.wentWell} positive /> : null}
                {item.improvementSuggestion ? <FeedbackField label="Development suggestion" value={item.improvementSuggestion} /> : null}
                {item.recommendedAction ? <FeedbackField label="Recommended action" value={item.recommendedAction} /> : null}
              </article>
            ))}
          </div>
        ) : <EmptyPerformanceState title="No visible feedback" description="Feedback appears only when a real record exists and its visibility policy permits access." />}
      </WorkspaceSection>

      <WorkspaceSection title="Recognition" description="Lightweight appreciation tied to real contributions and company values." action={<Button variant="outline" onClick={() => onAction('recognition')}>Recognize employee</Button>}>
        {data.recognition.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {data.recognition.map(item => (
              <article key={String(item.id)} className="rounded-lg bg-amber-50 p-4 dark:bg-amber-950/25">
                <Award className="h-5 w-5 text-amber-600" aria-hidden />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-amber-800 dark:text-amber-200">{String(item.category || '').replace(/_/g, ' ')}</p>
                <p className="mt-2 text-sm leading-6 text-amber-950 dark:text-amber-100">{String(item.message)}</p>
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{formatDate(item.createdAt)}</p>
              </article>
            ))}
          </div>
        ) : <EmptyPerformanceState title="No recognition records" description="Recognition will appear here when a colleague or manager records it." />}
      </WorkspaceSection>
    </div>
  );
}

export function CompetenciesView({
  data,
  onAction,
}: {
  data: PerformanceWorkspaceData;
  onAction: (action: ActionName) => void;
}) {
  const competencies = normalizeCompetencies(data.reviews[0]?.competencyAssessment);
  return (
    <div className="space-y-4">
      <WorkspaceSection title="Competency assessment summary" description="The competency framework stays in administration; this view shows released assessment results." action={<Button variant="outline" onClick={() => onAction('evidence')}>Submit evidence</Button>}>
        {competencies.length ? (
          <div className="space-y-4">
            {competencies.map(item => {
              const gap = item.expectedLevel - item.currentLevel;
              return (
                <article key={item.name} className="grid gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-800 md:grid-cols-[minmax(0,1fr)_100px_100px_100px] md:items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-950 dark:text-slate-50">{item.name}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">{item.category} competency · Latest released assessment</p>
                    <Progress value={Math.min(100, (item.currentLevel / Math.max(item.expectedLevel, 1)) * 100)} className="mt-3 h-1.5 bg-slate-100 [&>div]:bg-emerald-600 dark:bg-slate-800" />
                  </div>
                  <CompetencyMetric label="Current" value={item.currentLevel} />
                  <CompetencyMetric label="Expected" value={item.expectedLevel} />
                  <CompetencyMetric label="Gap" value={gap > 0 ? `-${gap}` : 'On track'} tone={gap > 0 ? 'warning' : 'positive'} />
                </article>
              );
            })}
          </div>
        ) : <EmptyPerformanceState title="No released competency assessment" description="Competency ratings are not inferred. Results appear after Appraisal releases them." />}
      </WorkspaceSection>
      <WorkspaceSection title="Competency evidence" description="Project achievements, certifications, work samples, feedback, and training completion.">
        {data.competencyEvidence.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.competencyEvidence.map(item => (
              <article key={String(item.id)} className="flex items-start gap-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
                <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[#3459a8] dark:text-blue-300" aria-hidden />
                <div>
                  <p className="text-sm font-bold text-slate-950 dark:text-slate-50">{String(item.title)}</p>
                  <p className="mt-1 text-xs text-slate-500">{String(item.competencyName)} · {String(item.evidenceType || '').replace(/_/g, ' ')}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{String(item.description || 'No description supplied.')}</p>
                  <PerformanceStatusBadge status={item.status} className="mt-3" />
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyPerformanceState title="No competency evidence" description="Submit a real work example or certification for manager validation." action={<Button variant="outline" onClick={() => onAction('evidence')}>Submit evidence</Button>} />}
      </WorkspaceSection>
    </div>
  );
}

export function DevelopmentView({
  data,
  onAction,
  onUpdate,
}: {
  data: PerformanceWorkspaceData;
  onAction: (action: ActionName) => void;
  onUpdate: (row: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-4">
      <WorkspaceSection title="Individual development plans" description="Plans translate recorded needs into concrete actions while Learning remains the course source." action={<Button onClick={() => onAction('development')} className="bg-[#263f73] text-white hover:bg-[#1f345f]">Add development action</Button>}>
        {data.developmentPlans.length ? (
          <div className="space-y-3">
            {data.developmentPlans.map(plan => (
              <article key={String(plan.id)} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-950 dark:text-slate-50">{String(plan.title)}</p>
                    <p className="mt-1 text-xs capitalize text-slate-500">{String(plan.planType || '').replace(/_/g, ' ')} · Target {formatDate(plan.targetDate)}</p>
                  </div>
                  <PerformanceStatusBadge status={plan.status} />
                </div>
                {plan.aspiration ? <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{String(plan.aspiration)}</p> : null}
                <div className="mt-4 space-y-2">
                  {data.developmentActions.filter(action => action.planId === plan.id).map(action => (
                    <button key={String(action.id)} type="button" className="flex w-full items-center gap-3 rounded-lg bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3459a8] dark:bg-slate-900/60 dark:hover:bg-slate-900" onClick={() => onUpdate(action)}>
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${action.status === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{String(action.title)}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{String(action.actionType || '').replace(/_/g, ' ')} · {percent(action.progress)}%</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden />
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyPerformanceState title="No development plan" description="Create a focused performance, skill, career, or mandatory development plan." action={<Button variant="outline" onClick={() => onAction('development')}>Create the first plan</Button>} />}
      </WorkspaceSection>
      <WorkspaceSection title="Learning recommendations" description="Recommendations explain their source and open in Learning.">
        {data.insights.recommendations.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.insights.recommendations.map(item => (
              <article key={item.label} className="rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950/25">
                <BookOpenCheck className="h-5 w-5 text-emerald-700" aria-hidden />
                <p className="mt-3 text-sm font-bold text-emerald-950 dark:text-emerald-100">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-emerald-800 dark:text-emerald-200">{item.reason}</p>
                <SmallLink href={item.href}>Open Learning</SmallLink>
              </article>
            ))}
          </div>
        ) : <EmptyPerformanceState title="No evidence-based recommendations" description="Recommendations appear only when a competency gap or development plan supports them." />}
      </WorkspaceSection>
    </div>
  );
}

export function HistoryView({ data }: { data: PerformanceWorkspaceData }) {
  const years = data.activities.reduce<Record<string, Array<Record<string, unknown>>>>((groups, item) => {
    const year = item.occurredAt ? new Date(String(item.occurredAt)).getFullYear().toString() : 'Earlier';
    groups[year] = [...(groups[year] || []), item];
    return groups;
  }, {});
  return (
    <WorkspaceSection title="Performance history" description="Chronological events from released appraisals, Goal, check-ins, feedback, recognition, and development records.">
      {Object.keys(years).length ? (
        <div className="space-y-8">
          {Object.entries(years).sort(([a], [b]) => b.localeCompare(a)).map(([year, items]) => (
            <section key={year} className="grid gap-4 md:grid-cols-[100px_minmax(0,1fr)]">
              <h3 className="text-2xl font-bold tracking-[-0.04em] text-slate-300 dark:text-slate-700">{year}</h3>
              <Timeline activities={items} />
            </section>
          ))}
        </div>
      ) : <EmptyPerformanceState title="No performance history" description="History will be built from real activity records as performance work occurs." />}
    </WorkspaceSection>
  );
}

export function TeamPerformanceView({
  data,
  onSelectEmployee,
}: {
  data: PerformanceWorkspaceData;
  onSelectEmployee: (employeeId: string) => void;
}) {
  const [detail, setDetail] = React.useState<Record<string, unknown> | null>(null);
  const completion = data.team.length
    ? Math.round((data.team.filter(item => ['completed', 'acknowledged'].includes(String(item.reviewStatus))).length / data.team.length) * 100)
    : 0;
  const attention = data.team.filter(item => item.performanceStatus === 'attention_required' || item.performanceStatus === 'at_risk');
  return (
    <div className="space-y-4">
      <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-2 lg:grid-cols-4">
        <TeamMetric label="Appraisal completion" value={`${completion}%`} helper={`${data.team.length} people in authorized scope`} />
        <TeamMetric label="Employees requiring attention" value={attention.length} helper="Rule-based risk or overdue actions" />
        <TeamMetric label="Average goal progress" value={`${average(data.team, 'goalProgress')}%`} helper="Calculated from Goal records" />
        <TeamMetric label="Development progress" value={`${average(data.team, 'developmentProgress')}%`} helper="Calculated from development actions" />
      </div>
      <WorkspaceSection title="Team performance" description="Only direct reports or authorized organization scope is returned by the backend.">
        {data.team.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:border-slate-800">
                    <th className="px-3 py-3">Employee</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Appraisal</th>
                    <th className="px-3 py-3">Goals</th>
                    <th className="px-3 py-3">Development</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.team.map(row => (
                    <tr key={String(row.id)} className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50" onClick={() => setDetail(row)}>
                      <td className="px-3 py-4"><EmployeeCell row={row} /></td>
                      <td className="px-3 py-4"><PerformanceStatusBadge status={row.performanceStatus} /></td>
                      <td className="px-3 py-4"><PerformanceStatusBadge status={row.reviewStatus || 'not_started'} /></td>
                      <td className="px-3 py-4"><InlineProgress value={percent(row.goalProgress)} /></td>
                      <td className="px-3 py-4"><InlineProgress value={percent(row.developmentProgress)} /></td>
                      <td className="px-3 py-4 font-bold tabular-nums text-slate-900 dark:text-slate-100">{Number(row.overdueCheckIns || 0) + Number(row.overdueDevelopmentActions || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 md:hidden">
              {data.team.map(row => (
                <button key={String(row.id)} type="button" className="rounded-lg border border-slate-200 p-4 text-left dark:border-slate-800" onClick={() => setDetail(row)}>
                  <EmployeeCell row={row} />
                  <div className="mt-4 flex flex-wrap gap-2"><PerformanceStatusBadge status={row.performanceStatus} /><PerformanceStatusBadge status={row.reviewStatus || 'not_started'} /></div>
                  <div className="mt-4 grid grid-cols-2 gap-3"><InlineProgress value={percent(row.goalProgress)} label="Goals" /><InlineProgress value={percent(row.developmentProgress)} label="Development" /></div>
                </button>
              ))}
            </div>
          </>
        ) : <EmptyPerformanceState title="No team performance records" description="Only employees inside the authorized hierarchy are returned." />}
      </WorkspaceSection>
      <Sheet open={Boolean(detail)} onOpenChange={open => !open && setDetail(null)}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-lg">
          {detail ? (
            <>
              <SheetHeader className="border-b border-slate-200 p-5 text-left dark:border-slate-800">
                <SheetTitle>{String(detail.name)}</SheetTitle>
                <SheetDescription>{String(detail.jobTitle || 'Role not assigned')} · {String(detail.department || 'Department not assigned')}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 p-5">
                <div className="flex flex-wrap gap-2"><PerformanceStatusBadge status={detail.performanceStatus} /><PerformanceStatusBadge status={detail.reviewStatus || 'not_started'} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <DrawerMetric label="Goal progress" value={`${percent(detail.goalProgress)}%`} />
                  <DrawerMetric label="Development" value={`${percent(detail.developmentProgress)}%`} />
                  <DrawerMetric label="At-risk goals" value={Number(detail.atRiskGoals || 0)} />
                  <DrawerMetric label="Overdue actions" value={Number(detail.overdueCheckIns || 0) + Number(detail.overdueDevelopmentActions || 0)} />
                </div>
                <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-950 dark:text-slate-50">Manager workspace</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">Open the employee in the main workspace to review permitted check-ins, feedback, development, and history.</p>
                  <Button className="mt-4 w-full bg-[#263f73] text-white hover:bg-[#1f345f]" onClick={() => { onSelectEmployee(String(detail.id)); setDetail(null); }}>Open performance detail</Button>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
                  <ShieldCheck className="h-5 w-5 text-slate-500" aria-hidden />
                  <p className="mt-2 text-xs leading-5 text-slate-500">Payroll, medical, bank, government ID, private employee drafts, and feedback outside your permission are not included.</p>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function InsightsView({ data }: { data: PerformanceWorkspaceData }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <WorkspaceSection title="Recorded facts" description="Direct counts from stored performance records.">
          <InsightGrid items={data.insights.facts} icon={FileCheck2} />
        </WorkspaceSection>
        <WorkspaceSection title="Calculated metrics" description="Transparent calculations from current authorized data.">
          <InsightGrid items={data.insights.calculated} icon={TrendingUp} />
        </WorkspaceSection>
      </div>
      <WorkspaceSection title="Recommendations" description="Recommendations are inferred from recorded gaps and are labeled separately from facts.">
        {data.insights.recommendations.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {data.insights.recommendations.map(item => (
              <article key={item.label} className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/70 dark:bg-amber-950/25">
                <Lightbulb className="h-5 w-5 text-amber-700" aria-hidden />
                <p className="mt-3 text-sm font-bold text-amber-950 dark:text-amber-100">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-amber-800 dark:text-amber-200">{item.reason}</p>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-300">Inferred recommendation</p>
                <SmallLink href={item.href}>Open source module</SmallLink>
              </article>
            ))}
          </div>
        ) : <EmptyPerformanceState title="No recommendations" description="The workspace does not invent recommendations when supporting evidence is absent." />}
      </WorkspaceSection>
      <WorkspaceSection title="Team distribution" description="Recorded status distribution in the current authorized scope.">
        {data.team.length ? <StatusDistribution team={data.team} /> : <EmptyPerformanceState title="No team analytics scope" description="Organization analytics are available only to managers, HR, and authorized administrators." />}
      </WorkspaceSection>
    </div>
  );
}
