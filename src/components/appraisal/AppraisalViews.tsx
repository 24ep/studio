"use client";

import * as React from 'react';
import {
  ArrowUpRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileClock,
  FilePlus2,
  Filter,
  Flag,
  History,
  LockKeyhole,
  MessageSquareText,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AppraisalWorkspaceData } from '@/lib/appraisal/appraisal-contracts';
import { cn } from '@/lib/utils';
import { useLocalization } from '@/contexts/LocalizationContext';
import type { AppraisalActionMode } from './AppraisalActionSheet';
import { AppraisalReviewDesk } from './AppraisalReviewDesk';
import {
  AppraisalEmpty,
  AppraisalMetric,
  AppraisalProgress,
  AppraisalSection,
  AppraisalStatusBadge,
  DueDate,
  RatingScale,
  ReviewTimeline,
} from './appraisal-ui';
import {
  GoalRow,
  PulseRow,
  arrayValue,
  canEditManager,
  canEditSelf,
  formatDate,
  formatDateTime,
  formatYear,
  isComplete,
  label,
  nextDue,
  nextEmployeeInstruction,
  nextManagerInstruction,
  numberValue,
  rating,
  reviewProgress,
  stripIdempotency,
} from './AppraisalViewParts';

type Row = Record<string, unknown>;
type OpenAction = (mode: AppraisalActionMode, record?: Row) => void;

export function AppraisalOverview({
  data,
  onAction,
  onTabChange,
}: {
  data: AppraisalWorkspaceData;
  onAction: OpenAction;
  onTabChange: (tab: string) => void;
}) {
  const { t } = useLocalization();
  const role = data.permissions.role;
  const current = data.reviews[0];
  const pendingPeer = data.reviewerAssignments.filter(item => !['submitted', 'declined'].includes(String(item.status)));
  const pendingTeam = data.teamReviews.filter(item => !isComplete(item));
  const primary = role === 'employee' ? current : pendingTeam[0];
  const title = role === 'hr' || role === 'administrator'
    ? t('appraisal.overview.titleControlRoom', 'Cycle control room')
    : role === 'manager'
    ? t('appraisal.overview.titleManagerWork', "Your team's review work")
      : role === 'reviewer'
        ? t('appraisal.overview.titleReviewer', 'Feedback requests')
        : t('appraisal.overview.titleEmployee', 'Your formal review');

  return (
    <div className="space-y-8">
      <section className="grid gap-6 border-b border-slate-200 pb-7 dark:border-slate-800 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a75c2f]">{t('appraisal.overview.attentionNotice', 'Now requiring attention')}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.045em] text-slate-950 dark:text-slate-50">{title}</h2>
          {primary ? (
            <div className="mt-5 border-l-2 border-[#cc7a3b] pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <AppraisalStatusBadge status={primary.status} />
                <DueDate value={nextDue(primary)} />
              </div>
            <p className="mt-3 text-lg font-bold text-slate-950 dark:text-slate-50">{String(primary.cycleName || t('appraisal.overview.currentAppraisal', 'Current appraisal'))}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {role === 'employee'
                  ? nextEmployeeInstruction(primary, t)
                  : `${String(primary.employeeName || t('appraisal.overview.employeePlaceholder', 'Employee'))} - ${nextManagerInstruction(primary, t)}`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {role === 'employee' && canEditSelf(primary) ? <Button className="min-h-11 bg-[#284a73] text-white hover:bg-[#203c5e]" onClick={() => onAction('self', primary)}>{t('appraisal.overview.continueSelfAssessment', 'Continue self-assessment')}</Button> : null}
                {role === 'employee' && primary.releasedAt && !['acknowledged', 'discussion_requested', 'disputed'].includes(String(primary.acknowledgmentStatus)) ? <Button className="min-h-11 bg-[#284a73] text-white hover:bg-[#203c5e]" onClick={() => onAction('acknowledge', primary)}>{t('appraisal.overview.reviewAndAcknowledge', 'Review and acknowledge')}</Button> : null}
                {role === 'manager' && canEditManager(primary) ? <Button className="min-h-11 bg-[#284a73] text-white hover:bg-[#203c5e]" onClick={() => onAction('manager', primary)}>{t('appraisal.overview.openManagerAssessment', 'Open manager assessment')}</Button> : null}
                {(role === 'hr' || role === 'administrator') && primary.status === 'awaiting_calibration' ? <Button className="min-h-11 bg-[#284a73] text-white hover:bg-[#203c5e]" onClick={() => onAction('calibrate', primary)}>{t('appraisal.overview.openCalibrationCase', 'Open calibration case')}</Button> : null}
                <Button variant="outline" className="min-h-11" onClick={() => onTabChange(role === 'employee' ? 'my-reviews' : role === 'reviewer' ? 'feedback' : 'team')}>{t('appraisal.overview.viewAll', 'View all')}</Button>
              </div>
            </div>
          ) : (
            <AppraisalEmpty title={t('appraisal.overview.emptyNoActionTitle', 'No appraisal action is waiting')} description={t('appraisal.overview.emptyNoActionDescription', 'Required work appears here as soon as a cycle or review assignment reaches your stage.')} />
          )}
        </div>
        <div className="border border-slate-200 bg-[#faf9f6] p-5 dark:border-slate-800 dark:bg-slate-900/40">
          <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50">{t('appraisal.overview.workflowPulse', 'Workflow pulse')}</h3>
          <div className="mt-5 space-y-5">
            <PulseRow label={t('appraisal.overview.pulseYourAppraisals', 'Your appraisals')} value={data.reviews.length} helper={`${data.reviews.filter(isComplete).length} ${t('appraisal.overview.pulseComplete', 'complete')}`} />
            <PulseRow label={t('appraisal.overview.pulseTeamReviews', 'Team reviews')} value={data.teamReviews.length} helper={`${pendingTeam.length} ${t('appraisal.overview.pulseStillActive', 'still active')}`} />
            <PulseRow label={t('appraisal.overview.pulseFeedbackRequests', 'Feedback requests')} value={data.reviewerAssignments.length} helper={`${pendingPeer.length} ${t('appraisal.overview.pulseWaiting', 'waiting')}`} />
            <PulseRow label={t('appraisal.overview.pulseOverdueActions', 'Overdue actions')} value={data.analytics.overdue} helper={t('appraisal.overview.pulseOverdueHelper', 'Based on configured stage due dates')} attention={data.analytics.overdue > 0} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AppraisalMetric label={t('appraisal.overview.metricPopulation', 'Population')} value={data.analytics.total} helper={t('appraisal.overview.metricPopulationHelper', 'Real records in your authorized scope')} />
        <AppraisalMetric label={t('appraisal.overview.metricSelfComplete', 'Self complete')} value={data.analytics.selfCompleted} helper={t('appraisal.overview.metricSelfCompleteHelper', 'Submitted self-assessments')} />
        <AppraisalMetric label={t('appraisal.overview.metricManagerComplete', 'Manager complete')} value={data.analytics.managerCompleted} helper={t('appraisal.overview.metricManagerCompleteHelper', 'Reviews beyond manager stage')} />
        <AppraisalMetric label={t('appraisal.overview.metricReleased', 'Released')} value={`${data.analytics.completionRate}%`} helper={t('appraisal.overview.metricReleasedHelper', 'final results released')} emphasis="positive" />
        <AppraisalMetric label={t('appraisal.overview.metricReleased', 'Released')} value={`${data.analytics.completionRate}%`} helper={`${data.analytics.released} ${t('appraisal.overview.metricReleasedCountHelper', 'final results released')}`} emphasis="positive" />
      </div>

      {current ? (
        <AppraisalSection title={t('appraisal.overview.timelineTitle', 'Current review timeline')} description={t('appraisal.overview.timelineDescription', 'Each stage reflects persisted workflow state; final ratings remain hidden until official release.')}>
          <ReviewTimeline status={current.status} released={Boolean(current.releasedAt)} />
        </AppraisalSection>
      ) : null}

      <AppraisalSection title={t('appraisal.overview.recentActivityTitle', 'Recent appraisal activity')} description={t('appraisal.overview.recentActivityDescription', 'A concise, immutable trail of review actions visible in your scope.')}>
        {data.timeline.length ? (
          <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {data.timeline.slice(0, 6).map(item => (
              <div key={String(item.id)} className="grid gap-2 py-3 sm:grid-cols-[160px_1fr_auto] sm:items-center">
                <p className="text-xs text-slate-500">{formatDateTime(item.createdAt, t)}</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label(item.eventType)}</p>
                <p className="text-xs text-slate-500">{String(item.actor || t('appraisal.overview.authorizedUser', 'Authorized user'))}</p>
              </div>
            ))}
          </div>
        ) : <AppraisalEmpty title={t('appraisal.overview.noHistoryTitle', 'No appraisal history yet')} description={t('appraisal.overview.noHistoryDescription', 'Cycle, assessment, rating, approval, release, and acknowledgment events will appear here.')} />}
      </AppraisalSection>
    </div>
  );
}

export function MyAppraisalsView({ data, onAction }: { data: AppraisalWorkspaceData; onAction: OpenAction }) {
  const { t } = useLocalization();
  const [selectedId, setSelectedId] = React.useState(String(data.reviews[0]?.id || ''));
  const selected = data.reviews.find(item => String(item.id) === selectedId) || data.reviews[0];
  if (!selected) return <AppraisalEmpty title={t('appraisal.myAppraisals.emptyTitle', 'No appraisal assigned')} description={t('appraisal.myAppraisals.emptyDescription', 'When HR starts a formal review cycle for you, it will appear here with its due dates and required sections.')} />;

  const goals = arrayValue(selected.goals);
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-2">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{t('appraisal.myAppraisals.reviewHistory', 'Review history')}</p>
        {data.reviews.map(item => (
          <button key={String(item.id)} type="button" onClick={() => setSelectedId(String(item.id))} className={cn(
            'w-full border p-3 text-left transition-colors',
            String(item.id) === String(selected.id)
              ? 'border-[#284a73] bg-[#eef3f7] dark:bg-blue-950/20'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950',
          )}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold">{String(item.cycleName)}</p>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            </div>
            <p className="mt-1 text-xs text-slate-500">{label(item.reviewType)} - {formatYear(item.cycleEndDate, t)}</p>
            <AppraisalStatusBadge status={item.status} className="mt-3" />
          </button>
        ))}
      </aside>

      <div className="min-w-0">
        <header className="border-b border-slate-200 pb-5 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#a75c2f]">{label(selected.reviewType)}</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em]">{String(selected.cycleName)}</h2>
              <p className="mt-1 text-sm text-slate-500">{formatDate(selected.cycleStartDate, t)} - {formatDate(selected.cycleEndDate, t)}</p>
            </div>
            <AppraisalStatusBadge status={selected.status} />
          </div>
          <div className="mt-5"><AppraisalProgress value={reviewProgress(selected)} /></div>
        </header>

          <div className="mt-6 space-y-7">
          <ReviewTimeline status={selected.status} released={Boolean(selected.releasedAt)} />
          {canEditSelf(selected) ? (
            <div className="flex flex-col gap-3 border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-bold text-amber-900 dark:text-amber-100">{t('appraisal.myAppraisals.selfNeedsAttention', 'Your self-assessment needs attention')}</p><p className="mt-1 text-sm text-amber-800 dark:text-amber-200"><DueDate value={selected.selfDueDate} /></p></div>
              <div className="flex gap-2">
                <Button className="min-h-11 bg-[#284a73] text-white hover:bg-[#203c5e]" onClick={() => onAction('self', selected)}>{t('appraisal.myAppraisals.editDraft', 'Edit draft')}</Button>
                {selected.selfAssessment ? <Button variant="outline" className="min-h-11 bg-white" onClick={() => onAction('submit-self', selected)}>{t('appraisal.myAppraisals.submit', 'Submit')}</Button> : null}
              </div>
            </div>
          ) : null}

          <AppraisalSection title={t('appraisal.myAppraisals.goalsTitle', 'Goals in this review')} description={t('appraisal.myAppraisals.goalsDescription', 'Goal remains the source of truth. Appraisal captures evaluation without altering progress.')}>
            {goals.length ? <div className="space-y-3">{goals.map(goal => <GoalRow key={String(goal.id)} goal={goal} />)}</div> : <AppraisalEmpty title={t('appraisal.myAppraisals.noGoalsTitle', 'No goals included')} description={t('appraisal.myAppraisals.noGoalsDescription', 'Approved goals assigned for this period will appear here without creating duplicate Goal records.')} />}
          </AppraisalSection>

          <AppraisalSection title={t('appraisal.myAppraisals.selfAssessmentTitle', 'Self-assessment')} description={t('appraisal.myAppraisals.selfAssessmentDescription', 'Your submitted narrative and evidence remain attached to this review version.')}>
            {selected.selfAssessment ? <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{String(selected.selfAssessment)}</p> : <AppraisalEmpty title={t('appraisal.myAppraisals.noSelfAssessmentDraftTitle', 'No self-assessment draft yet')} description={t('appraisal.myAppraisals.noSelfAssessmentDraftDescription', 'Open the draft to capture achievements, challenges, evidence, strengths, and development areas.')} />}
          </AppraisalSection>

          {selected.releasedAt ? (
            <AppraisalSection title={t('appraisal.myAppraisals.finalResultTitle', 'Final review result')} description={t('appraisal.myAppraisals.finalResultDescription', 'Released by the formal workflow. Acknowledgment confirms receipt, not agreement.')}>
              <div className="grid gap-5 border border-slate-200 bg-[#faf9f6] p-5 dark:border-slate-800 dark:bg-slate-900/40">
                <RatingScale value={numberValue(selected.finalRating)} label={String(selected.ratingModelName || t('appraisal.myAppraisals.finalRatingFallback', 'Final rating'))} />
                {selected.managerComments ? <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{t('appraisal.myAppraisals.managerSummary', 'Manager summary')}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{String(selected.managerComments)}</p></div> : null}
                <div className="flex flex-wrap gap-2">
                  {!['acknowledged', 'discussion_requested', 'disputed'].includes(String(selected.acknowledgmentStatus)) ? <Button className="min-h-11 bg-[#284a73] text-white hover:bg-[#203c5e]" onClick={() => onAction('acknowledge', selected)}>{t('appraisal.myAppraisals.acknowledgeReceipt', 'Acknowledge receipt')}</Button> : <AppraisalStatusBadge status={selected.acknowledgmentStatus} />}
                  {!data.appeals.some(item => item.reviewId === selected.id && item.status !== 'closed') ? <Button variant="outline" className="min-h-11" onClick={() => onAction('appeal', selected)}>{t('appraisal.myAppraisals.submitAppeal', 'Submit appeal')}</Button> : null}
                </div>
              </div>
            </AppraisalSection>
          ) : (
            <AppraisalSection title={t('appraisal.myAppraisals.finalResultTitle', 'Final review result')}>
              <div className="flex items-center gap-3 border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <LockKeyhole className="h-5 w-5" aria-hidden />
                {t('appraisal.myAppraisals.finalResultPlaceholder', 'Final rating and manager result remain confidential until the official release stage.')}
              </div>
            </AppraisalSection>
          )}
        </div>
      </div>
    </div>
  );
}

export function FeedbackRequestsView({ data, onAction }: { data: AppraisalWorkspaceData; onAction: OpenAction }) {
  const { t } = useLocalization();
  const pending = data.reviewerAssignments.filter(item => !['submitted', 'declined'].includes(String(item.status)));
  return (
    <AppraisalSection title={t('appraisal.feedbackRequests.title', 'Feedback requests')} description={t('appraisal.feedbackRequests.description', 'Reviewer-specific assignments only. Other feedback, manager ratings, final ratings, and calibration decisions are not exposed.')}>
      {pending.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pending.map(item => (
            <article key={String(item.id)} className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#eef3f7] text-[#284a73] dark:bg-blue-950/30 dark:text-blue-200"><MessageSquareText className="h-4 w-4" /></div><AppraisalStatusBadge status={item.status} /></div>
              <h3 className="mt-4 text-base font-bold">{String(item.employeeName)}</h3>
            <p className="mt-1 text-sm text-slate-500">{String(item.cycleName)} - {label(item.reviewerRole)}</p>
              <div className="mt-4"><DueDate value={item.dueDate} /></div>
              {item.isAnonymous ? <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><ShieldCheck className="h-3.5 w-3.5" />{t('appraisal.feedbackRequests.anonymousToEmployee', 'Anonymous to employee')}</p> : null}
              <Button className="mt-5 min-h-11 w-full bg-[#284a73] text-white hover:bg-[#203c5e]" onClick={() => onAction('peer', item)}>{t('appraisal.feedbackRequests.provideFeedback', 'Provide feedback')}</Button>
            </article>
          ))}
        </div>
      ) : <AppraisalEmpty title={t('appraisal.feedbackRequests.emptyTitle', 'No feedback request is waiting')} description={t('appraisal.feedbackRequests.emptyDescription', 'New peer, upward, project, or 360-degree assignments will appear here with their confidentiality rules.')} />}
    </AppraisalSection>
  );
}

export function TeamAppraisalsView({ data, onAction }: { data: AppraisalWorkspaceData; onAction: OpenAction; onRemind: (reviews: Row[]) => Promise<boolean>; reminding: boolean }) {
  return <AppraisalReviewDesk data={data} onAction={onAction} />;
}

function TeamRow({ row, onAction }: { row: Row; onAction: OpenAction }) {
  const { t } = useLocalization();
  return (
    <tr className="bg-white dark:bg-slate-950">
      <td className="px-3 py-4"><p className="font-bold">{String(row.employeeName)}</p><p className="mt-1 text-xs text-slate-500">{String(row.employeeNumber)} - {String(row.department || t('appraisal.team.departmentMissing', 'Unassigned'))}</p></td>
      <td className="px-3 py-4"><AppraisalStatusBadge status={row.status} /></td>
      <td className="px-3 py-4 text-xs font-semibold">{row.submittedAt ? t('appraisal.team.status.submitted', 'Submitted') : t('appraisal.team.status.pending', 'Pending')}</td>
      <td className="px-3 py-4 text-xs font-semibold">{row.managerRating != null ? t('appraisal.team.status.drafted', 'Drafted') : t('appraisal.team.status.pending', 'Pending')}</td>
      <td className="px-3 py-4"><DueDate value={nextDue(row)} /></td>
      <td className="px-3 py-4 font-bold tabular-nums">{row.managerRating == null ? t('appraisal.team.managerRatingUnavailable', '-') : Number(row.managerRating).toFixed(1)}</td>
      <td className="w-32 px-3 py-4"><AppraisalProgress value={reviewProgress(row)} /></td>
      <td className="px-3 py-4"><TeamActions row={row} onAction={onAction} /></td>
    </tr>
  );
}

function TeamCard({ row, onAction }: { row: Row; onAction: OpenAction }) {
  const { t } = useLocalization();
  return (
    <article className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3"><div><p className="font-bold">{String(row.employeeName)}</p><p className="mt-1 text-xs text-slate-500">{String(row.department || t('appraisal.team.departmentMissing', 'Unassigned'))} - {String(row.employeeNumber)}</p></div><AppraisalStatusBadge status={row.status} /></div>
      <div className="mt-4"><AppraisalProgress value={reviewProgress(row)} /></div>
      <div className="mt-4 flex items-center justify-between"><DueDate value={nextDue(row)} /><TeamActions row={row} onAction={onAction} /></div>
    </article>
  );
}

function TeamActions({ row, onAction }: { row: Row; onAction: OpenAction }) {
  const { t } = useLocalization();
  if (canEditManager(row)) return <Button size="sm" variant="outline" className="min-h-9" onClick={() => onAction('manager', row)}>{t('appraisal.teamActions.assess', 'Assess')}</Button>;
  if (row.status === 'manager_review_in_progress') return <Button size="sm" variant="outline" className="min-h-9" onClick={() => onAction('submit-manager', row)}>{t('appraisal.teamActions.submit', 'Submit')}</Button>;
  if (row.status === 'awaiting_calibration') return <Button size="sm" variant="outline" className="min-h-9" onClick={() => onAction('calculate', row)}>{t('appraisal.teamActions.calculate', 'Calculate')}</Button>;
  if (row.status === 'awaiting_final_approval') return <Button size="sm" variant="outline" className="min-h-9" onClick={() => onAction('approve', row)}>{t('appraisal.teamActions.approve', 'Approve')}</Button>;
  if (row.status === 'ready_for_release') return <Button size="sm" variant="outline" className="min-h-9" onClick={() => onAction('release', row)}>{t('appraisal.teamActions.release', 'Release')}</Button>;
  return <Button size="sm" variant="ghost" className="min-h-9" onClick={() => onAction('assign-reviewer', row)}>{t('appraisal.teamActions.assignReviewer', 'Reviewer')}</Button>;
}

export function CalibrationView({ data, onAction }: { data: AppraisalWorkspaceData; onAction: OpenAction }) {
  const { t } = useLocalization();
  const rows = data.calibration;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:grid-cols-3">
        <AppraisalMetric label={t('appraisal.calibration.readyCases', 'Ready cases')} value={rows.filter(row => row.status === 'awaiting_calibration').length} helper={t('appraisal.calibration.readyCasesHelper', 'Manager assessment complete')} />
        <AppraisalMetric label={t('appraisal.calibration.inReview', 'In review')} value={rows.filter(row => row.status === 'calibration_in_progress').length} helper={t('appraisal.calibration.inReviewHelper', 'Committee work underway')} />
        <AppraisalMetric label={t('appraisal.calibration.finalized', 'Finalized')} value={rows.filter(row => ['awaiting_final_approval', 'ready_for_release'].includes(String(row.status))).length} helper={t('appraisal.calibration.finalizedHelper', 'Calibration decision recorded')} />
      </div>
      <div className="border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100">
        {t('appraisal.calibration.guidance', 'Rating distribution is guidance only. This workspace does not force a curve; each adjustment requires a documented decision.')}
      </div>
      {rows.length ? (
        <div className="overflow-x-auto border-y border-slate-200 dark:border-slate-800">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead><tr className="bg-slate-50 text-[11px] uppercase tracking-[0.1em] text-slate-500 dark:bg-slate-900/50">{[t('appraisal.calibration.table.employee', 'Employee'), t('appraisal.calibration.table.department', 'Department'), t('appraisal.calibration.table.calculated', 'Calculated'), t('appraisal.calibration.table.manager', 'Manager'), t('appraisal.calibration.table.previous', 'Previous'), t('appraisal.calibration.table.status', 'Status'), t('appraisal.calibration.table.decision', 'Decision')].map(column => <th key={column} className="px-3 py-3">{column}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{rows.map(row => (
              <tr key={String(row.id)}>
                <td className="px-3 py-4"><p className="font-bold">{String(row.employeeName)}</p><p className="mt-1 text-xs text-slate-500">{String(row.jobTitle || t('appraisal.calibration.rowRoleMissing', 'Role not assigned'))}</p></td>
                <td className="px-3 py-4">{String(row.department || t('appraisal.calibration.rowDepartmentMissing', 'Unassigned'))}</td>
                <td className="px-3 py-4 font-bold tabular-nums">{rating(row.calculatedRating)}</td>
                <td className="px-3 py-4 font-bold tabular-nums">{rating(row.managerRating)}</td>
                <td className="px-3 py-4 tabular-nums">{rating(row.rating)}</td>
                <td className="px-3 py-4"><AppraisalStatusBadge status={row.status} /></td>
                <td className="px-3 py-4"><Button variant="outline" size="sm" className="min-h-9" onClick={() => onAction('calibrate', row)}>{t('appraisal.calibration.reviewCase', 'Review case')}</Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <AppraisalEmpty title={t('appraisal.calibration.noReadyCasesTitle', 'No cases are ready for calibration')} description={t('appraisal.calibration.noReadyCasesDescription', 'Submitted manager assessments requiring calibration will appear here without exposing results to employees.')} />}
    </div>
  );
}

export function CyclesView({ data, onAction }: { data: AppraisalWorkspaceData; onAction: OpenAction }) {
  const { t } = useLocalization();
  const eligible = data.populationPreview.filter(item => item.eligibility === 'eligible');
  const missingManager = data.populationPreview.filter(item => item.eligibility === 'missing_manager');
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-xl font-bold tracking-[-0.035em]">{t('appraisal.cycles.title', 'Appraisal cycles')}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{t('appraisal.cycles.description', 'Configure periods, safely generate employee populations, control stage changes, and preserve history.')}</p></div>
        <Button className="min-h-11 bg-[#284a73] text-white hover:bg-[#203c5e]" onClick={() => onAction('create-cycle')}><FilePlus2 className="mr-2 h-4 w-4" />{t('appraisal.cycles.create', 'Create cycle')}</Button>
      </div>
      <AppraisalSection title={t('appraisal.cycles.populationReadinessTitle', 'Population readiness preview')} description={t('appraisal.cycles.populationReadinessDescription', "Live employee-master validation for your company scope. Cycle generation applies the selected cycle's inclusion and exclusion rules and skips existing records.")}>
        {data.populationPreview.length ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <AppraisalMetric label={t('appraisal.cycles.inScope', 'In scope')} value={data.populationPreview.length} helper={t('appraisal.cycles.inScopeHelper', 'Active, probation, or onboarding employees')} />
              <AppraisalMetric label={t('appraisal.cycles.ready', 'Ready')} value={eligible.length} helper={t('appraisal.cycles.readyHelper', 'Manager is assigned')} emphasis="positive" />
              <AppraisalMetric label={t('appraisal.cycles.blocked', 'Blocked')} value={missingManager.length} helper={t('appraisal.cycles.blockedHelper', 'Missing manager assignment')} emphasis={missingManager.length ? 'attention' : 'positive'} />
            </div>
            {missingManager.length ? (
              <div className="border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-100">{t('appraisal.cycles.resolveBeforeGeneration', 'Resolve before generation')}</p>
                <ul className="mt-2 grid gap-1 text-sm text-amber-800 dark:text-amber-200 sm:grid-cols-2">
                  {missingManager.slice(0, 8).map(item => <li key={String(item.id)}>{String(item.name)} - {String(item.employeeNumber)}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        ) : <AppraisalEmpty title={t('appraisal.cycles.noEligibleTitle', 'No eligible employees found')} description={t('appraisal.cycles.noEligibleDescription', 'Employee population is read from Employee master data and is never fabricated inside Appraisal.')} />}
      </AppraisalSection>
      {data.cycles.length ? <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">{data.cycles.map(cycle => (
        <article key={String(cycle.id)} className="grid gap-4 py-5 lg:grid-cols-[minmax(250px,1fr)_180px_160px_auto] lg:items-center">
          <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{String(cycle.name)}</h3><AppraisalStatusBadge status={cycle.status} /></div><p className="mt-1 text-sm text-slate-500">{label(cycle.reviewType)} - {formatDate(cycle.startDate, t)} - {formatDate(cycle.endDate, t)}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{t('appraisal.cycles.populationLabel', 'Population')}</p><p className="mt-1 text-sm font-bold">{Number(cycle.reviewCount || 0)} {t('appraisal.cycles.reviewsLabel', 'reviews')}</p></div>
          <AppraisalProgress value={Number(cycle.reviewCount) ? Math.round(Number(cycle.releasedCount || 0) / Number(cycle.reviewCount) * 100) : 0} label={t('appraisal.cycles.releasedLabel', 'Released')} />
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button variant="outline" size="sm" className="min-h-9" onClick={() => onAction('generate-population', cycle)}><Sparkles className="mr-1.5 h-3.5 w-3.5" />{t('appraisal.cycles.generatePopulation', 'Generate')}</Button>
            <Button variant="outline" size="sm" className="min-h-9" onClick={() => onAction('stage', cycle)}>{t('appraisal.cycles.manageStage', 'Stage')}</Button>
          </div>
        </article>
      ))}</div> : <AppraisalEmpty title={t('appraisal.cycles.noConfiguredTitle', 'No appraisal cycle configured')} description={t('appraisal.cycles.noConfiguredDescription', 'Create a draft cycle after publishing at least one review template and rating model.')} action={<Button onClick={() => onAction('create-cycle')}>{t('appraisal.cycles.createFirstCycle', 'Create first cycle')}</Button>} />}
    </div>
  );
}

export function TemplatesView({ data, onAction }: { data: AppraisalWorkspaceData; onAction: OpenAction }) {
  const { t } = useLocalization();
  return (
    <div className="space-y-8">
      <AppraisalSection title={t('appraisal.templates.title', 'Review templates')} description={t('appraisal.templates.description', 'Published versions are immutable snapshots for historical appraisals.')} action={<Button className="min-h-11 bg-[#284a73] text-white hover:bg-[#203c5e]" onClick={() => onAction('create-template')}><FilePlus2 className="mr-2 h-4 w-4" />{t('appraisal.templates.newTemplate', 'New template')}</Button>}>
        {data.templates.length ? <div className="grid gap-3 md:grid-cols-2">{data.templates.map(template => (
          <article key={String(template.id)} className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{String(template.name)}</h3><p className="mt-1 text-xs text-slate-500">{t('appraisal.templates.version', 'Version')} {String(template.version)} - {arrayValue(template.sections).length} {t('appraisal.templates.sections', 'sections')}</p></div><AppraisalStatusBadge status={template.versionStatus} /></div>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{stripIdempotency(String(template.description || t('appraisal.templates.templateDescriptionFallback', 'Reusable formal review structure.')))}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">{arrayValue(template.sections).slice(0, 5).map(section => <span key={String(section.key)} className="border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold dark:border-slate-800 dark:bg-slate-900">{String(section.title)}</span>)}</div>
          </article>
        ))}</div> : <AppraisalEmpty title={t('appraisal.templates.noTemplatesTitle', 'No review template published')} description={t('appraisal.templates.noTemplatesDescription', 'Publish a structured template before creating a cycle. Historical reviews retain the selected version.')} />}
      </AppraisalSection>

      <AppraisalSection title={t('appraisal.templates.ratingModelsTitle', 'Rating models')} description={t('appraisal.templates.ratingModelsDescription', 'Labels, thresholds, guidance, rounding, and missing-response behavior are configuration - not frontend constants.')}>
        {data.ratingModels.length ? <div className="space-y-4">{data.ratingModels.map(model => (
          <article key={String(model.id)} className="border-y border-slate-200 py-4 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-bold">{String(model.name)}</h3><p className="mt-1 text-sm text-slate-500">{label(model.scaleType)} - {String(model.minimumScore)} - {String(model.maximumScore)} - {String(model.roundingDecimals)} {t('appraisal.templates.decimals', 'decimals')}</p></div><AppraisalStatusBadge status={model.status} /></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{arrayValue(model.levels).map(level => (
              <div key={String(level.id)} className="border-l-2 border-[#cc7a3b] pl-3"><p className="text-xs font-bold">{String(level.label)}</p><p className="mt-1 text-[11px] text-slate-500">{String(level.minimumScore)} - {String(level.maximumScore)}</p></div>
            ))}</div>
          </article>
        ))}</div> : <AppraisalEmpty title={t('appraisal.templates.noRatingModelTitle', 'No rating model configured')} description={t('appraisal.templates.noRatingModelDescription', 'Apply the appraisal migration and seed data, or create a rating model through administration.')} />}
      </AppraisalSection>
    </div>
  );
}

export function ReportsView({ data }: { data: AppraisalWorkspaceData }) {
  const { t } = useLocalization();
  const maxRating = Math.max(1, ...data.analytics.ratingDistribution.map(item => item.count));
  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <AppraisalMetric label={t('appraisal.reports.cycleCompletion', 'Cycle completion')} value={`${data.analytics.completionRate}%`} helper={`${data.analytics.released} ${t('appraisal.reports.of', 'of')} ${data.analytics.total} ${t('appraisal.reports.released', 'released')}`} />
        <AppraisalMetric label={t('appraisal.reports.selfAssessment', 'Self-assessment')} value={data.analytics.selfCompleted} helper={t('appraisal.reports.selfAssessmentHelper', 'Submissions in authorized scope')} />
        <AppraisalMetric label={t('appraisal.reports.managerReview', 'Manager review')} value={data.analytics.managerCompleted} helper={t('appraisal.reports.managerReviewHelper', 'Records past manager stage')} />
        <AppraisalMetric label={t('appraisal.reports.overdue', 'Overdue')} value={data.analytics.overdue} helper={t('appraisal.reports.overdueHelper', 'Open actions past configured due date')} emphasis={data.analytics.overdue ? 'attention' : 'positive'} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <AppraisalSection title={t('appraisal.reports.ratingDistribution', 'Rating distribution')} description={t('appraisal.reports.ratingDistributionDescription', 'Only persisted proposed or final ratings in your authorized scope are counted.')}>
          {data.analytics.ratingDistribution.some(item => item.count) ? <div className="space-y-3">{data.analytics.ratingDistribution.map(item => (
            <div key={item.label} className="grid grid-cols-[minmax(120px,180px)_1fr_30px] items-center gap-3">
              <span className="truncate text-xs font-semibold">{item.label}</span>
              <div className="h-3 bg-slate-100 dark:bg-slate-800"><div className="h-full bg-[#284a73]" style={{ width: `${item.count / maxRating * 100}%` }} /></div>
              <span className="text-right text-xs font-bold tabular-nums">{item.count}</span>
            </div>
          ))}</div> : <AppraisalEmpty title={t('appraisal.reports.noRatingDistributionTitle', 'No rating distribution available')} description={t('appraisal.reports.noRatingDistributionDescription', 'Ratings are never fabricated. The chart appears after authorized ratings exist.')} />}
        </AppraisalSection>

        <AppraisalSection title={t('appraisal.reports.departmentProgress', 'Department progress')} description={t('appraisal.reports.departmentProgressDescription', 'Released reviews compared with the real cycle population in scope.')}>
          {data.analytics.departmentProgress.length ? <div className="space-y-4">{data.analytics.departmentProgress.map(item => (
            <div key={item.department}><AppraisalProgress value={item.total ? Math.round(item.completed / item.total * 100) : 0} label={`${item.department} - ${item.completed}/${item.total}`} /></div>
          ))}</div> : <AppraisalEmpty title={t('appraisal.reports.noDepartmentProgressTitle', 'No department comparison available')} description={t('appraisal.reports.noDepartmentProgressDescription', 'Department totals appear after appraisal records are generated.')} />}
        </AppraisalSection>
      </div>
    </div>
  );
}

export function AuditHistoryView({ data }: { data: AppraisalWorkspaceData }) {
  const { t } = useLocalization();
  return (
    <AppraisalSection title={t('appraisal.audit.title', 'Appraisal audit history')} description={t('appraisal.audit.description', 'Cycle, population, assessment, rating, calibration, approval, release, and acknowledgment actions are immutable to normal users.')}>
      {data.timeline.length ? <div className="relative ml-3 border-l border-slate-300 pl-6 dark:border-slate-700">{data.timeline.map(item => (
        <article key={String(item.id)} className="relative pb-6 last:pb-0">
          <span className="absolute -left-[1.9rem] top-1 grid h-3 w-3 rounded-full border-2 border-white bg-[#cc7a3b] dark:border-slate-950" />
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"><h3 className="text-sm font-bold">{label(item.eventType)}</h3><time className="text-xs text-slate-500">{formatDateTime(item.createdAt, t)}</time></div>
          <p className="mt-1 text-sm text-slate-500">{String(item.reason || t('appraisal.audit.reasonFallback', 'Recorded by the appraisal workflow.'))} - {String(item.actor || t('appraisal.audit.authorizedUser', 'Authorized user'))}</p>
        </article>
      ))}</div> : <AppraisalEmpty title={t('appraisal.audit.noAuditEventsTitle', 'No audit events recorded')} description={t('appraisal.audit.noAuditEventsDescription', 'Appraisal actions will appear here after the migration is applied and users begin the workflow.')} />}
    </AppraisalSection>
  );
}
