"use client";

import {
  AlertTriangle,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  MessageSquareText,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { PerformanceWorkspaceData } from '@/lib/performance/performance-contracts';
import { toPerformanceStatus } from '@/lib/performance/performance-contracts';
import {
  EmptyPerformanceState,
  formatDate,
  PerformanceStatusBadge,
  SmallLink,
  Timeline,
  WorkspaceSection,
  percent,
} from './performance-ui';

export function PerformanceOverview({
  data,
  onAction,
  onTabChange,
}: {
  data: PerformanceWorkspaceData;
  onAction: (action: 'check-in' | 'feedback' | 'recognition' | 'development' | 'evidence') => void;
  onTabChange: (tab: string) => void;
}) {
  const review = data.reviews[0];
  const activeGoals = data.goals.filter(goal => !['completed', 'cancelled', 'archived'].includes(String(goal.status)));
  const goalProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, goal) => sum + Number(goal.progress || 0), 0) / activeGoals.length)
    : 0;
  const openDevelopment = data.developmentActions.filter(action => !['completed', 'cancelled'].includes(String(action.status)));
  const developmentProgress = openDevelopment.length
    ? Math.round(openDevelopment.reduce((sum, action) => sum + Number(action.progress || 0), 0) / openDevelopment.length)
    : 0;
  const upcomingCheckIn = [...data.checkIns]
    .filter(checkIn => !['completed', 'cancelled'].includes(String(checkIn.status)))
    .sort((a, b) => new Date(String(a.meetingDate)).getTime() - new Date(String(b.meetingDate)).getTime())[0];
  const competencySummary = normalizeCompetencies(review?.competencyAssessment);
  const competencyOnTrack = competencySummary.filter(item => item.currentLevel >= item.expectedLevel).length;
  const performanceStatus = toPerformanceStatus({
    reviewStatus: review?.status,
    overdueActions: data.alerts.length,
    atRiskGoals: activeGoals.filter(goal => goal.dueDate && new Date(String(goal.dueDate)) < new Date() && Number(goal.progress || 0) < 100).length,
  });

  return (
    <div>
      <section className="grid overflow-hidden border-b border-border bg-background md:grid-cols-[1.15fr_0.85fr]">
        <div className="relative px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3459a8] dark:text-blue-300">Current performance state</p>
            <PerformanceStatusBadge status={performanceStatus} />
          </div>
          <h2 className="mt-3 max-w-2xl text-xl font-bold tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-2xl">
            {data.alerts.length
              ? `${data.alerts.length} item${data.alerts.length === 1 ? '' : 's'} need attention`
              : 'You are clear to focus on progress'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {data.alerts[0]?.requiredAction || 'No overdue performance actions were found in the current records.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {data.alerts[0] ? (
              <Button type="button" className="min-h-11 bg-[#263f73] text-white hover:bg-[#1f345f]" onClick={() => onTabChange('overview')}>
                Resolve priority action
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" className="min-h-11 bg-[#263f73] text-white hover:bg-[#1f345f]" onClick={() => onAction('check-in')}>
                Schedule a check-in
              </Button>
            )}
            <Button type="button" variant="outline" className="min-h-11" onClick={() => onAction('feedback')}>Request or give feedback</Button>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/40 md:border-l md:border-t-0">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Current review context</p>
          {review ? (
            <div className="mt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-950 dark:text-slate-50">{String(review.cycleName || 'Performance review')}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(review.cycleStartDate)} – {formatDate(review.cycleEndDate)}</p>
                </div>
                <PerformanceStatusBadge status={review.status} />
              </div>
              <ReviewSteps status={review.status} />
              <p className="mt-4 text-xs text-slate-500">Employees complete self-assessments and acknowledgements in My Performance.</p>
            </div>
          ) : (
            <EmptyPerformanceState title="No active appraisal cycle" description="When Appraisal assigns a review, its status and due dates will appear here." />
          )}
        </div>
      </section>

      <div className="grid gap-px overflow-hidden border-b border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCell icon={Target} label="Goal progress" value={`${goalProgress}%`} helper={`${activeGoals.length} active Goal record${activeGoals.length === 1 ? '' : 's'}`} progress={goalProgress} />
        <SummaryCell icon={TrendingUp} label="Competencies" value={competencySummary.length ? `${competencyOnTrack}/${competencySummary.length}` : '—'} helper={competencySummary.length ? 'At or above expected level' : 'No released assessment'} progress={competencySummary.length ? (competencyOnTrack / competencySummary.length) * 100 : 0} />
        <SummaryCell icon={MessageSquareText} label="Feedback" value={data.feedback.filter(item => item.status === 'published').length} helper="Visible feedback records" />
        <SummaryCell icon={BookOpenCheck} label="Development" value={`${developmentProgress}%`} helper={`${openDevelopment.length} active action${openDevelopment.length === 1 ? '' : 's'}`} progress={developmentProgress} />
      </div>

      <div className="grid items-start xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <WorkspaceSection className="xl:border-r-0" title="Performance trend" description="Released appraisal results only. Unreleased ratings remain hidden.">
            <PerformanceTrend reviews={data.reviews} />
          </WorkspaceSection>

          <div className="-mt-px grid lg:grid-cols-2">
            <WorkspaceSection title="Goal progress" description="A read-only summary of the selected employee's goals.">
              {activeGoals.length ? (
                <div className="space-y-4">
                  {activeGoals.slice(0, 4).map(goal => (
                    <div key={String(goal.id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{String(goal.title)}</p>
                          <p className="mt-1 text-xs text-slate-500">Due {formatDate(goal.dueDate)}</p>
                        </div>
                        <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">{percent(goal.progress)}%</span>
                      </div>
                      <Progress value={percent(goal.progress)} className="mt-2 h-1.5 bg-slate-100 [&>div]:bg-[#3459a8] dark:bg-slate-800" />
                    </div>
                  ))}
                </div>
              ) : <EmptyPerformanceState title="No active goals" description="Goal progress will appear here from the existing Goal source." />}
            </WorkspaceSection>

            <WorkspaceSection className="-mt-px lg:mt-0 lg:border-l-0 xl:border-r-0" title="Competency snapshot" description="Latest released assessment and submitted evidence." action={<Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onAction('evidence')}>Add evidence</Button>}>
              {competencySummary.length ? (
                <div className="space-y-4">
                  {competencySummary.slice(0, 5).map(competency => {
                    const score = Math.min(100, (competency.currentLevel / Math.max(competency.expectedLevel, 1)) * 100);
                    return (
                      <div key={competency.name}>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{competency.name}</span>
                          <span className="text-slate-500">Level {competency.currentLevel} / {competency.expectedLevel}</span>
                        </div>
                        <Progress value={score} className="mt-2 h-1.5 bg-slate-100 [&>div]:bg-emerald-600 dark:bg-slate-800" />
                      </div>
                    );
                  })}
                </div>
              ) : <EmptyPerformanceState title="No competency assessment" description="Released Appraisal competency results will appear here without creating a second framework." />}
            </WorkspaceSection>
          </div>

          <WorkspaceSection className="-mt-px xl:border-r-0" title="Development plan" description="Actions connect performance needs to Learning, coaching, and on-the-job development." action={<Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onAction('development')}>Add action</Button>}>
            {data.developmentActions.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.developmentActions.slice(0, 4).map(action => (
                  <article key={String(action.id)} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/60">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{String(action.title)}</p>
                      <PerformanceStatusBadge status={action.status} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{String(action.actionType || '').replace(/_/g, ' ')} · Due {formatDate(action.dueDate)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <Progress value={percent(action.progress)} className="h-1.5 flex-1 bg-white [&>div]:bg-emerald-600 dark:bg-slate-800" />
                      <span className="text-xs font-bold tabular-nums">{percent(action.progress)}%</span>
                    </div>
                    {action.learningCourseId ? <SmallLink href="/learning">Continue in Learning</SmallLink> : null}
                  </article>
                ))}
              </div>
            ) : <EmptyPerformanceState title="No development actions" description="Create an evidence-based development plan without duplicating Learning course management." action={<Button variant="outline" size="sm" onClick={() => onAction('development')}>Create development plan</Button>} />}
          </WorkspaceSection>
        </div>

        <aside className="xl:border-l xl:border-border">
          <WorkspaceSection className="xl:border-l-0" title="Required actions" description="Generated from real due dates and record states.">
            {data.alerts.length ? (
              <div className="space-y-3">
                {data.alerts.slice(0, 5).map(alert => (
                  <a key={alert.id} href={alert.href} className="block rounded-lg border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-900/70 dark:bg-amber-950/30 dark:hover:bg-amber-950/50">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
                      <div>
                        <p className="text-sm font-bold text-amber-950 dark:text-amber-100">{alert.reason}</p>
                        <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-200">{alert.requiredAction}</p>
                        <p className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Due {formatDate(alert.dueDate)} · {alert.owner}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : <EmptyPerformanceState title="No required actions" description="There are no overdue or stale performance records in your current scope." />}
          </WorkspaceSection>

          <WorkspaceSection className="-mt-px xl:border-l-0" title="Next check-in" action={<Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onAction('check-in')}>Schedule</Button>}>
            {upcomingCheckIn ? (
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#3459a8] dark:bg-blue-950/40 dark:text-blue-300">
                  <CalendarClock className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-bold capitalize text-slate-900 dark:text-slate-100">{String(upcomingCheckIn.type || 'Check-in').replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(upcomingCheckIn.meetingDate)} · {String(upcomingCheckIn.managerName || 'Manager')}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{String(upcomingCheckIn.agenda || 'Agenda not prepared yet.')}</p>
                </div>
              </div>
            ) : <EmptyPerformanceState title="No upcoming check-in" description="Schedule a focused one-on-one, development, or career conversation." />}
          </WorkspaceSection>

          <WorkspaceSection className="-mt-px xl:border-l-0" title="Recent feedback">
            {data.feedback.filter(item => item.status === 'published').length ? (
              <div className="space-y-4">
                {data.feedback.filter(item => item.status === 'published').slice(0, 3).map(item => (
                  <article key={String(item.id)}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold capitalize text-slate-900 dark:text-slate-100">{String(item.feedbackType || 'Feedback').replace(/_/g, ' ')}</p>
                      <span className="text-[11px] text-slate-500">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{String(item.wentWell || item.context || item.improvementSuggestion || '')}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{String(item.providerName || 'Feedback provider')}</p>
                  </article>
                ))}
              </div>
            ) : <EmptyPerformanceState title="No visible feedback" description="Request specific feedback or recognize a colleague from this workspace." />}
          </WorkspaceSection>

          <WorkspaceSection className="-mt-px xl:border-l-0" title="Recent activity">
            <Timeline activities={data.activities.slice(0, 6)} />
          </WorkspaceSection>
        </aside>
      </div>
    </div>
  );
}

function SummaryCell({
  icon: Icon,
  label,
  value,
  helper,
  progress,
}: {
  icon: typeof Target;
  label: string;
  value: string | number;
  helper: string;
  progress?: number;
}) {
  return (
    <div className="bg-background px-4 py-4 sm:px-5">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4 text-[#3459a8] dark:text-blue-300" aria-hidden />
        <p className="text-[11px] font-bold uppercase tracking-[0.1em]">{label}</p>
      </div>
      <p className="mt-3 text-xl font-bold tabular-nums tracking-[-0.03em] text-slate-950 dark:text-slate-50">{value}</p>
      {typeof progress === 'number' ? <Progress value={progress} className="mt-3 h-1.5 bg-slate-100 [&>div]:bg-[#3459a8] dark:bg-slate-800" /> : null}
      <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

function ReviewSteps({ status }: { status: unknown }) {
  const stages = ['not_started', 'in_progress', 'submitted', 'completed'];
  const labels = ['Not started', 'Self-assessment', 'Manager review', 'Released'];
  const rawIndex = stages.indexOf(String(status));
  const current = String(status) === 'acknowledged' ? 3 : Math.max(0, rawIndex);
  return (
    <ol className="my-5 grid grid-cols-4 gap-2" aria-label="Appraisal progress">
      {labels.map((label, index) => (
        <li key={label}>
          <span className={`block h-1.5 rounded-full ${index <= current ? 'bg-[#3459a8]' : 'bg-slate-200 dark:bg-slate-700'}`} aria-hidden />
          <span className="mt-2 block text-[10px] leading-4 text-slate-500">{label}</span>
        </li>
      ))}
    </ol>
  );
}

function normalizeCompetencies(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).map(([name, raw]) => {
    const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    return {
      name,
      currentLevel: Number(item.currentLevel || item.managerRating || item.employeeRating || 0),
      expectedLevel: Number(item.expectedLevel || 0),
    };
  }).filter(item => item.currentLevel > 0 || item.expectedLevel > 0);
}

function PerformanceTrend({ reviews }: { reviews: Array<Record<string, unknown>> }) {
  const released = [...reviews]
    .filter(review => review.rating !== null && review.rating !== undefined && Number.isFinite(Number(review.rating)))
    .reverse();
  if (released.length < 2) {
    return <EmptyPerformanceState title="Not enough released history" description="A trend needs at least two released appraisal ratings. Unreleased or missing ratings are never inferred." />;
  }
  const width = 640;
  const height = 190;
  const paddingX = 34;
  const paddingY = 24;
  const values = released.map(item => Number(item.rating));
  const min = Math.min(...values, 1);
  const max = Math.max(...values, 5);
  const points = values.map((value, index) => ({
    x: paddingX + (index / Math.max(released.length - 1, 1)) * (width - paddingX * 2),
    y: paddingY + ((max - value) / Math.max(max - min, 1)) * (height - paddingY * 2),
  }));
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full overflow-visible" role="img" aria-labelledby="performance-trend-title performance-trend-desc">
        <title id="performance-trend-title">Released appraisal rating trend</title>
        <desc id="performance-trend-desc">{released.map(item => `${String(item.cycleName)}: ${String(item.rating)}`).join(', ')}</desc>
        {[0, 1, 2, 3].map(index => {
          const y = paddingY + (index / 3) * (height - paddingY * 2);
          return <line key={index} x1={paddingX} x2={width - paddingX} y1={y} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 6" />;
        })}
        <path d={path} fill="none" stroke="#3459a8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => (
          <g key={String(released[index].id)}>
            <circle cx={point.x} cy={point.y} r="5" fill="#3459a8" stroke="white" strokeWidth="3" />
            <text x={point.x} y={height - 3} textAnchor="middle" className="fill-slate-500 text-[10px]">{String(released[index].cycleName || '').slice(0, 14)}</text>
            <text x={point.x} y={point.y - 12} textAnchor="middle" className="fill-slate-800 text-[11px] font-bold dark:fill-slate-200">{String(released[index].rating)}</text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Sparkles className="h-3.5 w-3.5" aria-hidden />Recorded ratings; no predictive score is shown.</figcaption>
    </figure>
  );
}
