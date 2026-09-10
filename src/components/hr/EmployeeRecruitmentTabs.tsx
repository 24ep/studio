"use client";

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowTopRightOnSquareIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ClockIcon,
  PaperClipIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';

import { ApplicantCommentsTimeline } from '@/components/applicants/ApplicantCommentsTimeline';
import {
  fetchApplicantActivitiesPage,
  fetchApplicantCommentsPage,
  fetchApplicantReminders,
} from '@/components/applicants/applicant-comments-api';
import {
  buildCombinedApplicantActivities,
  filterCombinedApplicantActivities,
  type CombinedActivityItem,
} from '@/components/applicants/applicant-comments-utils';
import { JobAppliedAttachmentsCard } from '@/components/applicants/tabs/JobAppliedAttachmentsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import {
  getEmployeeRecruitmentData,
  getRecruitmentRecord,
  getRecruitmentText,
  type EmployeeRecruitmentTransition,
} from './employee-recruitment-utils';

type RecruitmentTab = 'job' | 'attachments' | 'history' | 'comments' | 'activity';

interface EmployeeRecruitmentTabsProps {
  applicant: unknown;
  applicantId?: string | null;
}

interface RecruitmentDetail {
  label: string;
  value: React.ReactNode;
}

function formatRecruitmentDate(value: unknown, includeTime = false) {
  if (!(typeof value === 'string' || value instanceof Date)) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(date);
}

function displayText(value: unknown) {
  return getRecruitmentText(value) || 'Not set';
}

function RecruitmentDetails({ details }: { details: RecruitmentDetail[] }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {details.map(detail => (
        <div key={detail.label} className="border-b border-border/60 pb-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {detail.label}
          </dt>
          <dd className="mt-1.5 break-words text-sm font-medium text-foreground">{detail.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function JobAppliedPanel({ applicant }: { applicant: Record<string, unknown> }) {
  const position = getRecruitmentRecord(applicant.position);
  const grade = getRecruitmentRecord(position?.grade);
  const stage = getRecruitmentRecord(applicant.recruitmentStage);
  const source = getRecruitmentRecord(applicant.source);
  const recruiter = getRecruitmentRecord(applicant.recruiter);
  const positionId = getRecruitmentText(position?.id) || getRecruitmentText(applicant.positionId);
  const positionTitle = getRecruitmentText(position?.title);
  const fitScore = getRecruitmentText(applicant.fitScore);
  const expectedSalary = applicant.expectedSalary ?? applicant.expected_salary;

  const details: RecruitmentDetail[] = [
    {
      label: 'Position',
      value: positionId ? (
        <Link href={`/positions/${positionId}`} className="inline-flex items-center gap-1 text-primary hover:underline">
          {positionTitle || 'View position'}
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </Link>
      ) : displayText(positionTitle),
    },
    { label: 'Department', value: displayText(position?.department) },
    { label: 'Position level', value: displayText(position?.positionLevel) },
    { label: 'Grade', value: displayText(grade?.label ?? grade?.name) },
    {
      label: 'Current stage',
      value: getRecruitmentText(stage?.name) ? (
        <Badge variant="secondary" className="rounded-full">{displayText(stage?.name)}</Badge>
      ) : 'Not set',
    },
    { label: 'Applied on', value: formatRecruitmentDate(applicant.applicationDate) },
    { label: 'Source', value: displayText(source?.name) },
    { label: 'Recruiter', value: displayText(recruiter?.name ?? recruiter?.email) },
    { label: 'Fit score', value: fitScore ? `${fitScore}%` : 'Not set' },
    { label: 'Expected salary', value: displayText(expectedSalary) },
  ];

  return (
    <section aria-labelledby="job-applied-heading">
      <div className="mb-5">
        <h3 id="job-applied-heading" className="text-base font-semibold text-foreground">Job applied</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          The position and recruiting context that created this employee record.
        </p>
      </div>
      <RecruitmentDetails details={details} />
    </section>
  );
}

function RecruitmentHistoryPanel({ history }: { history: EmployeeRecruitmentTransition[] }) {
  return (
    <section aria-labelledby="recruitment-history-heading">
      <div className="mb-5">
        <h3 id="recruitment-history-heading" className="text-base font-semibold text-foreground">
          Recruitment history
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Read-only stage changes recorded during the applicant&apos;s hiring journey.
        </p>
      </div>

      {history.length > 0 ? (
        <ol className="relative ml-3 before:absolute before:bottom-3 before:left-[11px] before:top-3 before:w-px before:bg-border">
          {history.map((transition, index) => {
            const stage = getRecruitmentText(transition.stageName)
              || getRecruitmentText(transition.stage)
              || 'Stage updated';
            const actor = getRecruitmentText(transition.actingUser?.name);
            const positionTitle = getRecruitmentText(transition.position?.title);
            const notes = getRecruitmentText(transition.notes);
            const isLatest = index === 0;
            return (
              <li key={transition.id || `${stage}-${index}`} className="relative pb-8 pl-10 last:pb-0">
                <span
                  className={cn(
                    'absolute left-0 top-0 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background',
                    isLatest ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                  style={transition.stageColor ? { backgroundColor: transition.stageColor } : undefined}
                  aria-hidden="true"
                >
                  <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{stage}</h4>
                      {isLatest ? (
                        <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] uppercase tracking-wide">
                          Latest
                        </Badge>
                      ) : null}
                    </div>
                    {notes ? (
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {notes}
                      </p>
                    ) : null}
                    {(actor || positionTitle) ? (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {[actor ? `By ${actor}` : null, positionTitle].filter(Boolean).join(' · ')}
                      </p>
                    ) : null}
                  </div>
                  <time className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                    {formatRecruitmentDate(transition.date, true)}
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <RecruitmentEmptyState
          icon={QueueListIcon}
          title="No recruitment history"
          description="No recorded stage changes are available for this applicant."
        />
      )}
    </section>
  );
}

function RecruitmentFeedPanel({
  applicantId,
  mode,
}: {
  applicantId: string;
  mode: 'comments' | 'activity';
}) {
  const [items, setItems] = React.useState<CombinedActivityItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      setLoading(true);
      const [commentsPage, activitiesPage, reminders] = await Promise.all([
        mode === 'comments'
          ? fetchApplicantCommentsPage({ applicantId, limit: 100, offset: 0 })
          : Promise.resolve(null),
        mode === 'activity'
          ? fetchApplicantActivitiesPage({ applicantId, limit: 100, offset: 0 })
          : Promise.resolve(null),
        mode === 'activity' ? fetchApplicantReminders(applicantId) : Promise.resolve(null),
      ]);

      if (cancelled) return;

      const combined = buildCombinedApplicantActivities({
        comments: commentsPage?.comments,
        logs: activitiesPage?.logs,
        reminders,
      });
      setItems(filterCombinedApplicantActivities(combined, mode === 'comments' ? 'comment' : 'activity'));
      setLoading(false);
    }

    void loadFeed();
    return () => {
      cancelled = true;
    };
  }, [applicantId, mode]);

  return (
    <div className="rounded-lg border border-border/60 bg-background px-4">
      <ApplicantCommentsTimeline
        combinedActivities={items}
        logsLoading={loading}
        editingId={null}
        editingContent=""
        editingSaving={null}
        deleteLoading={null}
        isEditing={false}
        hasMoreItems={false}
        isLoadingMore={false}
        onEditingContentChange={() => undefined}
        onStartEdit={() => undefined}
        onCancelEdit={() => undefined}
        onEditComment={() => undefined}
        onDeleteComment={() => undefined}
        onFileClick={attachment => {
          if (attachment.url) window.open(attachment.url, '_blank', 'noopener,noreferrer');
        }}
        onLoadMoreItems={() => undefined}
      />
    </div>
  );
}

function RecruitmentEmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <Icon className="h-9 w-9 text-muted-foreground/60" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

export function EmployeeRecruitmentTabs({ applicant, applicantId }: EmployeeRecruitmentTabsProps) {
  const [activeTab, setActiveTab] = React.useState<RecruitmentTab>('job');
  const recruitment = getEmployeeRecruitmentData(applicant);

  if (!recruitment.applicant) {
    return (
      <RecruitmentEmptyState
        icon={BriefcaseIcon}
        title="No linked applicant record"
        description="Link this employee to an applicant to show their job application, attachments, and recruiting history here."
      />
    );
  }

  const tabs = [
    { id: 'job' as const, label: 'Job Applied', icon: BriefcaseIcon },
    { id: 'attachments' as const, label: 'Attachments', icon: PaperClipIcon, count: recruitment.attachments.length },
    { id: 'history' as const, label: 'Recruitment History', icon: QueueListIcon, count: recruitment.transitionHistory.length },
    { id: 'comments' as const, label: 'Comments', icon: ChatBubbleLeftRightIcon },
    { id: 'activity' as const, label: 'Activity', icon: ClockIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <div role="tablist" aria-label="Recruitment information" className="flex min-w-max gap-2 py-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`employee-recruitment-${tab.id}`}
                id={`employee-recruitment-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {'count' in tab ? (
                  <span className={cn(
                    'min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] leading-4',
                    active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background/70 text-muted-foreground',
                  )}>
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`employee-recruitment-${activeTab}`}
        aria-labelledby={`employee-recruitment-tab-${activeTab}`}
      >
        {activeTab === 'job' ? (
          <JobAppliedPanel applicant={recruitment.applicant} />
        ) : activeTab === 'attachments' ? (
          <JobAppliedAttachmentsCard resumes={recruitment.attachments} />
        ) : activeTab === 'history' ? (
          <RecruitmentHistoryPanel history={recruitment.transitionHistory} />
        ) : applicantId ? (
          <RecruitmentFeedPanel
            applicantId={applicantId}
            mode={activeTab}
          />
        ) : (
          <RecruitmentEmptyState
            icon={activeTab === 'comments' ? ChatBubbleLeftRightIcon : ClockIcon}
            title={`No ${activeTab} available`}
            description="This employee is not linked to an applicant feed."
          />
        )}
      </div>

      {applicantId ? (
        <div className="flex justify-end border-t border-border/60 pt-4">
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href={`/applicants/${applicantId}`}>
              View applicant
              <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
