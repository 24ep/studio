"use client";

import * as React from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ExternalLink,
  FileCheck2,
  Filter,
  LockKeyhole,
  MessageSquareText,
  MoreHorizontal,
  Search,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AppraisalWorkspaceData } from '@/lib/appraisal/appraisal-contracts';
import { cn } from '@/lib/utils';
import type { AppraisalActionMode } from './AppraisalActionSheet';
import { AppraisalEmpty, AppraisalStatusBadge } from './appraisal-ui';

type Row = Record<string, unknown>;
type OpenAction = (mode: AppraisalActionMode, record?: Row) => void;

export function AppraisalReviewDesk({
  data,
  onAction,
  employee,
  showDirectory = true,
}: {
  data: AppraisalWorkspaceData;
  onAction: OpenAction;
  employee?: { id: string; name: string; employeeNumber?: string | null } | null;
  showDirectory?: boolean;
}) {
  const [query, setQuery] = React.useState('');
  const [attentionOnly, setAttentionOnly] = React.useState(false);
  const [contextOpen, setContextOpen] = React.useState(true);
  const availableReviews = React.useMemo(() => {
    if (!employee) return data.teamReviews;
    const reviews = [...data.teamReviews, ...data.reviews.filter(review => !data.teamReviews.some(teamReview => String(teamReview.id) === String(review.id)))];
    return reviews.filter(review =>
      String(review.employeeId || '') === employee.id
      || Boolean(employee.employeeNumber && String(review.employeeNumber || '') === employee.employeeNumber)
      || String(review.employeeName || '').trim().toLowerCase() === employee.name.trim().toLowerCase(),
    );
  }, [data.reviews, data.teamReviews, employee]);
  const reports = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return availableReviews.filter(review => {
      const matchesQuery = !normalized || [review.employeeName, review.employeeNumber, review.jobTitle, review.department]
        .some(value => String(value || '').toLowerCase().includes(normalized));
      const matchesAttention = !attentionOnly || reviewNeedsAttention(review);
      return matchesQuery && matchesAttention;
    });
  }, [attentionOnly, availableReviews, query]);
  const [selectedId, setSelectedId] = React.useState(String(availableReviews[0]?.id || ''));
  const selected = reports.find(review => String(review.id) === selectedId)
    || availableReviews.find(review => String(review.id) === selectedId)
    || reports[0]
    || availableReviews[0];

  React.useEffect(() => {
    setSelectedId(String(availableReviews[0]?.id || ''));
  }, [availableReviews]);

  if (!selected) {
    return (
      <div className="px-5 py-10 sm:px-6">
        <AppraisalEmpty
          title={employee ? `No appraisal found for ${employee.name}` : 'No team appraisals assigned'}
          description={employee ? 'This employee does not have an appraisal in the current review cycle.' : 'Team reviews will appear here when a formal cycle includes employees inside your authorized scope.'}
        />
      </div>
    );
  }

  const goals = arrayValue(selected.goals);
  const competencies = competencyRows(selected.competencyAssessment);
  const relatedFeedback = data.reviewerAssignments.filter(item => String(item.reviewId) === String(selected.id));
  const submittedFeedback = relatedFeedback.filter(item => String(item.status) === 'submitted').length;
  const progress = reviewProgress(selected);
  const dueDate = selected.managerDueDate || selected.selfDueDate || selected.cycleEndDate;
  const canContinue = canEditManager(selected);
  const checklist = [
    { label: 'Employee self-review', complete: Boolean(selected.submittedAt || selected.selfAssessment) },
    { label: 'Review goals and outcomes', complete: goals.length > 0 },
    { label: 'Rate competencies', complete: Boolean(selected.competencyAssessment) },
    { label: 'Provide overall feedback', complete: Boolean(selected.managerComments || selected.managerAssessment) },
    { label: 'Finalize and submit review', complete: Boolean(selected.completedAt || selected.managerRating) },
  ];
  const completeCount = checklist.filter(item => item.complete).length;

  return (
    <div className={cn('grid min-h-[690px] border-t border-border bg-background', showDirectory ? 'lg:grid-cols-[355px_minmax(0,1fr)_292px]' : 'lg:grid-cols-[minmax(0,1fr)_292px]')}>
      {showDirectory ? <aside className="min-w-0 border-b border-border lg:border-b-0 lg:border-r" aria-label="Direct reports">
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Direct reports ({data.teamReviews.length})</h2>
              <p className="mt-1 text-xs text-muted-foreground">Reviews in your authorized scope</p>
            </div>
            <Users className="h-4 w-4 text-blue-400" aria-hidden />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
              <Input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search by name"
                aria-label="Search direct reports"
                className="h-10 rounded border-slate-700 bg-transparent pl-9 text-sm"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Show reviews needing attention"
              aria-pressed={attentionOnly}
              onClick={() => setAttentionOnly(value => !value)}
              className={cn('h-10 w-10 rounded border-slate-700', attentionOnly && 'border-blue-500 bg-blue-500/10 text-blue-300')}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-[680px] overflow-y-auto">
          {reports.length ? reports.map(review => {
            const active = String(review.id) === String(selected.id);
            const itemProgress = reviewProgress(review);
            const due = review.managerDueDate || review.selfDueDate || review.cycleEndDate;
            return (
              <button
                key={String(review.id)}
                type="button"
                onClick={() => setSelectedId(String(review.id))}
                className={cn(
                  'relative w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-slate-900/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                  active && 'bg-blue-500/10 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-blue-500',
                )}
                aria-current={active ? 'true' : undefined}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0 border border-slate-700">
                    {review.profilePhotoUrl ? <AvatarImage src={String(review.profilePhotoUrl)} alt="" /> : null}
                    <AvatarFallback className="bg-[#284a73] text-xs font-semibold text-white">{initials(String(review.employeeName || 'Employee'))}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{String(review.employeeName || 'Employee')}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{String(review.jobTitle || review.department || review.employeeNumber || 'Role not assigned')}</p>
                      </div>
                      <p className="shrink-0 text-right text-[11px] text-muted-foreground">{shortDueDate(due)}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className={cn('h-2 w-2 shrink-0 rounded-full', statusDot(review.status))} />
                        <span className="truncate">{statusLabel(review.status)}</span>
                      </span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">{itemProgress}%</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${itemProgress}%` }} />
                    </div>
                  </div>
                </div>
              </button>
            );
          }) : (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">No reviews match this search.</p>
          )}
        </div>
      </aside> : null}

      <section className="min-w-0 border-b border-border lg:border-b-0 lg:border-r" aria-label={`${String(selected.employeeName)} review details`}>
        <header className="border-b border-border px-5 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-12 w-12 shrink-0 border border-slate-700">
                {selected.profilePhotoUrl ? <AvatarImage src={String(selected.profilePhotoUrl)} alt="" /> : null}
                <AvatarFallback className="bg-[#16558e] text-sm font-semibold text-white">{initials(String(selected.employeeName || 'Employee'))}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">{String(selected.employeeName || 'Employee')}</h2>
                <p className="mt-1 truncate text-xs text-muted-foreground">{String(selected.jobTitle || 'Role not assigned')} · {String(selected.department || 'Department not assigned')}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Employee ID: {String(selected.employeeNumber || '—')} · {tenureLabel(selected.createdAt)}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded border-slate-700 bg-transparent" onClick={() => onAction('manager', selected)}>
              View review <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold text-foreground">Review stage</p>
            <ReviewStage status={selected.status} />
          </div>
        </header>

        <div className="px-5 py-4">
          <ReviewSection
            title="Goals and outcomes"
            icon={Target}
            action={goals.length ? `${goals.length} goals` : undefined}
          >
            {goals.length ? (
              <div className="divide-y divide-border border-y border-border">
                <div className="grid grid-cols-[minmax(0,1fr)_70px_104px_104px] gap-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Goal</span><span>Progress</span><span>Employee</span><span>Manager</span>
                </div>
                {goals.slice(0, 4).map((goal, index) => {
                  const goalProgress = numberValue(goal.progress);
                  return (
                    <div key={String(goal.id || index)} className="grid grid-cols-[minmax(0,1fr)_70px_104px_104px] items-center gap-3 py-2.5 text-xs">
                      <div className="min-w-0"><p className="truncate font-medium text-foreground">{String(goal.title || 'Performance goal')}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{String(goal.description || statusLabel(goal.status))}</p></div>
                      <span className="tabular-nums text-muted-foreground">{goalProgress}%</span>
                      <RatingChip value={goalProgress} />
                      <span className="text-center text-muted-foreground">—</span>
                    </div>
                  );
                })}
              </div>
            ) : <InlineEmpty icon={Target} label="No goals are linked to this review." />}
          </ReviewSection>

          <ReviewSection title="Competency evidence" icon={BriefcaseBusiness} action={competencies.length ? `${competencies.length} items` : undefined}>
            {competencies.length ? (
              <div className="divide-y divide-border border-y border-border">
                {competencies.slice(0, 4).map((competency, index) => (
                  <div key={`${competency.label}-${index}`} className="grid gap-1 py-2.5 text-xs sm:grid-cols-[150px_minmax(0,1fr)_124px] sm:items-center sm:gap-4">
                    <p className="font-medium text-foreground">{competency.label}</p>
                    <p className="truncate text-muted-foreground">{competency.evidence}</p>
                    <p className="text-[11px] text-muted-foreground">{competency.source}</p>
                  </div>
                ))}
              </div>
            ) : <InlineEmpty icon={FileCheck2} label="Competency evidence will appear when it is recorded." />}
          </ReviewSection>
        </div>

        <div className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-background/95 px-5 py-4 backdrop-blur sm:flex-row">
          <Button
            className="min-h-11 flex-1 rounded bg-blue-600 text-white hover:bg-blue-500"
            onClick={() => onAction(canContinue ? 'manager' : nextAction(selected), selected)}
          >
            {canContinue ? 'Continue manager review' : actionLabel(selected)}
          </Button>
          <Button variant="outline" className="min-h-11 rounded border-slate-700 bg-transparent" onClick={() => onAction('manager', selected)}>Save draft</Button>
          <Button variant="outline" size="icon" aria-label="More review actions" className="h-11 w-11 rounded border-slate-700 bg-transparent"><MoreHorizontal className="h-4 w-4" /></Button>
        </div>
      </section>

      <aside className="min-w-0 px-5 py-5" aria-label="Review context">
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setContextOpen(value => !value)} aria-expanded={contextOpen}>
          <span className="text-sm font-semibold text-foreground">Review context</span>
          {contextOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        {contextOpen ? (
          <div className="mt-5 space-y-5">
            <ContextBlock>
              <p className="text-xs font-medium text-muted-foreground">Due date</p>
              <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-foreground"><CalendarDays className="h-4 w-4 text-muted-foreground" />{formatDate(dueDate)}</p>
              <p className={cn('mt-1 text-xs font-medium', isOverdue(dueDate) ? 'text-amber-400' : 'text-blue-300')}>{relativeDue(dueDate)}</p>
            </ContextBlock>

            <ContextBlock>
              <p className="text-xs font-semibold text-foreground">Completion checklist</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{completeCount} of {checklist.length} completed</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round(completeCount / checklist.length * 100)}%` }} /></div>
              <div className="mt-4 space-y-3">
                {checklist.map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-xs">
                    {item.complete ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <Circle className="h-4 w-4 shrink-0 text-slate-600" />}
                    <span className={cn(item.complete ? 'text-muted-foreground line-through' : 'text-foreground')}>{item.label}</span>
                  </div>
                ))}
              </div>
            </ContextBlock>

            <ContextBlock>
              <p className="text-xs font-semibold text-foreground">Feedback and input</p>
              <div className="mt-4 space-y-4">
                <ContextRow icon={MessageSquareText} label="Peer feedback" value={relatedFeedback.length ? `${submittedFeedback} of ${relatedFeedback.length} received` : 'No requests assigned'} complete={relatedFeedback.length > 0 && submittedFeedback === relatedFeedback.length} />
                <ContextRow icon={Users} label="Direct reports feedback" value="Not applicable" />
              </div>
            </ContextBlock>

            <ContextBlock>
              <p className="flex items-center gap-2 text-xs font-semibold text-foreground"><LockKeyhole className="h-4 w-4" />Confidentiality reminder</p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">Appraisal discussions and ratings are confidential. Share feedback respectfully and focus on performance and growth.</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-blue-300"><ShieldCheck className="h-3.5 w-3.5" />Permissions enforced by the API</p>
            </ContextBlock>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function ReviewSection({ title, icon: Icon, action, children }: { title: string; icon: typeof Target; action?: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border py-4 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Icon className="h-4 w-4 text-blue-300" />{title}</h3>
        {action ? <span className="text-[11px] text-blue-300">{action}</span> : null}
      </div>
      {children}
    </section>
  );
}

function ReviewStage({ status }: { status: unknown }) {
  const current = stageIndex(status);
  const stages = ['Self review', 'Manager review', 'Calibration', 'Final review'];
  return (
    <ol className="mt-4 grid grid-cols-4" aria-label="Review stage">
      {stages.map((stage, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <li key={stage} className="relative flex flex-col items-center text-center">
            {index > 0 ? <span className={cn('absolute right-1/2 top-3 h-px w-full', index <= current ? 'bg-blue-500' : 'bg-slate-700')} aria-hidden /> : null}
            <span className={cn('relative z-10 grid h-6 w-6 place-items-center rounded-full border text-[10px] font-semibold', complete ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-600 bg-slate-800 text-slate-300')}>
              {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className={cn('mt-2 text-[11px]', active ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{stage}</span>
            <span className="mt-0.5 text-[10px] text-muted-foreground">{complete ? 'Complete' : active ? 'In progress' : 'Upcoming'}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ContextBlock({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-border pb-5 last:border-b-0">{children}</div>;
}

function ContextRow({ icon: Icon, label, value, complete }: { icon: typeof Users; label: string; value: string; complete?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1"><p className="text-xs text-foreground">{label}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{value}</p></div>
      {complete ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-600" />}
    </div>
  );
}

function InlineEmpty({ icon: Icon, label }: { icon: typeof Target; label: string }) {
  return <div className="flex items-center gap-2 border-y border-border py-4 text-xs text-muted-foreground"><Icon className="h-4 w-4" />{label}</div>;
}

function RatingChip({ value }: { value: number }) {
  const label = value >= 90 ? 'Exceeds' : value >= 70 ? 'Meets' : value > 0 ? 'Developing' : 'Not rated';
  return <span className={cn('inline-flex w-fit rounded px-2 py-1 text-[10px] font-medium', value >= 90 ? 'bg-emerald-950 text-emerald-300' : value >= 70 ? 'bg-blue-950 text-blue-300' : 'bg-slate-800 text-slate-300')}>{label}</span>;
}

function competencyRows(value: unknown) {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.map((item, index) => competencyRow(item, index));
  return Object.entries(value as Record<string, unknown>).map(([key, item], index) => competencyRow(item, index, key));
}

function competencyRow(value: unknown, index: number, fallback?: string) {
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return {
      label: String(row.name || row.label || row.competency || fallback || `Competency ${index + 1}`),
      evidence: String(row.evidence || row.comment || row.comments || row.summary || 'Evidence recorded in the review.'),
      source: String(row.source || row.submittedBy || 'Manager review'),
    };
  }
  return { label: statusLabel(fallback || `Competency ${index + 1}`), evidence: String(value || 'Evidence recorded in the review.'), source: 'Manager review' };
}

function arrayValue(value: unknown): Row[] {
  return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') as Row[] : [];
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(100, Math.round(numeric))) : 0;
}

function reviewProgress(review: Row) {
  if (review.releasedAt || ['released', 'acknowledged', 'completed'].includes(String(review.status))) return 100;
  if (['ready_for_release', 'awaiting_final_approval'].includes(String(review.status))) return 90;
  if (['awaiting_calibration', 'calibration_in_progress'].includes(String(review.status))) return 75;
  if (review.managerRating || review.managerAssessment) return 65;
  if (['manager_review_in_progress', 'awaiting_manager_review'].includes(String(review.status))) return 50;
  if (review.submittedAt || review.selfAssessment) return 35;
  return 0;
}

function stageIndex(status: unknown) {
  const value = String(status || '');
  if (['released', 'acknowledged', 'ready_for_release', 'awaiting_final_approval'].includes(value)) return 3;
  if (['awaiting_calibration', 'calibration_in_progress'].includes(value)) return 2;
  if (['awaiting_manager_review', 'manager_review_in_progress'].includes(value)) return 1;
  return 0;
}

function canEditManager(review: Row) {
  return ['awaiting_manager_review', 'manager_review_in_progress'].includes(String(review.status));
}

function nextAction(review: Row): AppraisalActionMode {
  const status = String(review.status);
  if (status === 'awaiting_calibration') return 'calibrate';
  if (status === 'awaiting_final_approval') return 'approve';
  if (status === 'ready_for_release') return 'release';
  return 'manager';
}

function actionLabel(review: Row) {
  const status = String(review.status);
  if (status === 'awaiting_calibration') return 'Review calibration';
  if (status === 'awaiting_final_approval') return 'Review approval';
  if (status === 'ready_for_release') return 'Review release';
  if (review.releasedAt) return 'View final review';
  return 'Open manager review';
}

function reviewNeedsAttention(review: Row) {
  const due = review.managerDueDate || review.selfDueDate || review.cycleEndDate;
  return isOverdue(due) || !['released', 'acknowledged', 'completed'].includes(String(review.status));
}

function isOverdue(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  return Boolean(date && !Number.isNaN(date.getTime()) && date.getTime() < Date.now());
}

function relativeDue(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return 'No due date configured';
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  return `${days} day${days === 1 ? '' : 's'} left`;
}

function formatDate(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Not configured';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function shortDueDate(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return 'No due date';
  return `Due ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}`;
}

function tenureLabel(value: unknown) {
  const date = value ? new Date(String(value)) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Company tenure unavailable';
  const years = Math.max(0, Math.floor((Date.now() - date.getTime()) / 31_557_600_000));
  return years ? `${years} yr${years === 1 ? '' : 's'} with company` : 'Less than a year with company';
}

function statusLabel(value: unknown) {
  return String(value || 'not_started').replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function statusDot(value: unknown) {
  const status = String(value || '');
  if (['released', 'acknowledged', 'completed'].includes(status)) return 'bg-emerald-500';
  if (['awaiting_manager_review', 'manager_review_in_progress', 'awaiting_calibration', 'calibration_in_progress'].includes(status)) return 'bg-blue-500';
  return 'bg-amber-500';
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
}
