"use client";

import * as React from 'react';
import { AlertTriangle, CheckCircle2, ClockAlert, Users } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HrisApprovalInbox,
  type HrisApprovalDecision,
  type HrisApprovalTask,
} from '@/components/hris/HrisApprovalInbox';
import { HrisUnifiedTaskInbox } from '@/components/hris/HrisUnifiedTaskInbox';
import { EmptyState, MetricStrip, Section, StatusBadge } from './EssShared';
import type { EssDashboard, EssRow, TeamDashboard } from './ess-types';
import { dateValue, personName, statusLabel, stringValue } from './ess-types';

type TeamWithApprovals = TeamDashboard & { approvals?: EssRow[] };

export function MyTeamView({
  data,
  team,
  submitting,
  mutate,
}: {
  data: EssDashboard;
  team: TeamWithApprovals | null;
  submitting: boolean;
  mutate: (url: string, method: 'POST' | 'PATCH', body: unknown, successMessage: string) => Promise<unknown>;
}) {
  if (!team || data.metrics.directReports <= 0) {
    return <EmptyState title="Manager access required" description="My Team is available only to people managers or users with explicit team permission." />;
  }
  const approvals = team.approvals || team.pendingLeave;
  const approvalTasks = approvals.map(toApprovalTask);
  const decideApproval = (task: HrisApprovalTask, action: HrisApprovalDecision, comment: string) => {
    const item = task.source as EssRow;
    const isBenefit = item.request_type === 'benefit_enrollment';
    if (isBenefit) {
      const benefitAction = action === 'approve' ? 'approve_benefit' : action === 'reject' ? 'reject_benefit' : 'return_benefit';
      return mutate(
        '/api/ess/team',
        'POST',
        { id: item.id, action: benefitAction, comment: comment || null, expectedVersion: item.version },
        action === 'approve' && item.status === 'pending_termination'
          ? 'Benefit termination approved.'
          : `Benefit request ${action.replace(/_/g, ' ')}d.`,
      );
    }
    const isLeave = item.request_type === 'leave_request' || Boolean(item.start_date);
    if (isLeave) {
      const leaveAction = action === 'approve' ? 'approve_leave' : action === 'reject' ? 'reject_leave' : 'return_leave';
      return mutate(
        '/api/ess/team',
        'POST',
        { id: item.id, action: leaveAction, comment: comment || null, expectedVersion: item.version },
        'Leave request ' + action.replace(/_/g, ' ') + 'd.',
      );
    }
    return mutate(
      '/api/ess/requests',
      'PATCH',
      { id: item.id, action, comment: comment || null, expectedVersion: item.version },
      'Request ' + action.replace(/_/g, ' ') + 'd.',
    );
  };
  return (
    <div className="space-y-4">
      <MetricStrip items={[
        { label: 'Direct reports', value: team.metrics.directReports, icon: Users },
        { label: 'Pending approvals', value: approvals.length, icon: CheckCircle2 },
        { label: 'Attendance alerts', value: team.metrics.attendanceExceptions, icon: ClockAlert },
        { label: 'Follow-ups', value: team.metrics.onboardingFollowUp, icon: AlertTriangle },
      ]} />
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto max-w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="min-h-9">Overview</TabsTrigger>
          <TabsTrigger value="approvals" className="min-h-9">Approval inbox</TabsTrigger>
          <TabsTrigger value="calendar" className="min-h-9">Team calendar</TabsTrigger>
          <TabsTrigger value="performance" className="min-h-9">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Section title="Direct reports" description="Only manager-permitted employment and operational fields are shown.">
            <div className="grid gap-3 sm:grid-cols-2">
              {team.reports.map(report => <TeamMemberCard key={String(report.id)} report={report} />)}
            </div>
          </Section>
          <div className="space-y-4">
            <Section title="Attendance exceptions">
              {team.attendanceExceptions.length ? <div className="divide-y divide-border">{team.attendanceExceptions.map(item => <CompactAlert key={String(item.id)} title={personName(item)} meta={`${dateValue(item.work_date)} · ${Number(item.hours_worked || 0)} hours`} status={item.status} />)}</div> : <EmptyState title="No attendance exceptions" description="There are no late, absent, or missing attendance alerts." />}
            </Section>
            <Section title="Employee milestones">
              {team.onboardingFollowUp.length ? <div className="divide-y divide-border">{team.onboardingFollowUp.map(item => <CompactAlert key={String(item.id)} title={personName(item)} meta={`${stringValue(item.progress, '0')}% complete · target ${dateValue(item.target_date)}`} status={item.status} />)}</div> : <EmptyState title="No milestones due" description="Probation, onboarding, and contract follow-ups will appear here." />}
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <Section title="Unified approval inbox" description="Profile, leave, attendance, documents, performance, and benefits share the same decision pattern.">
            <HrisApprovalInbox tasks={approvalTasks} submitting={submitting} onDecision={decideApproval} />
            <HrisUnifiedTaskInbox />
          </Section>
        </TabsContent>

        <TabsContent value="calendar">
          <Section title="Team availability" description="Private leave reasons and attachments are not displayed.">
            <div className="overflow-x-auto">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-[12rem_repeat(7,1fr)] gap-px bg-border text-xs">
                  <div className="bg-muted p-2 font-semibold">Employee</div>
                  {Array.from({ length: 7 }, (_, index) => {
                    const day = new Date();
                    day.setDate(day.getDate() + index);
                    return <div key={index} className="bg-muted p-2 text-center font-semibold">{day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</div>;
                  })}
                  {team.reports.map(report => <React.Fragment key={String(report.id)}>
                    <div className="bg-card p-2 font-medium">{stringValue(report.name)}</div>
                    {Array.from({ length: 7 }, (_, index) => {
                      const day = new Date();
                      day.setDate(day.getDate() + index);
                      const key = day.toLocaleDateString('en-CA');
                      const availability = team.availability?.find(item => (
                        String(item.employee_id) === String(report.id)
                        && String(item.availability_date || '').slice(0, 10) === key
                      ));
                      const status = availability?.availability_status || 'working';
                      return <div key={index} className="bg-card p-2 text-center" aria-label={`${stringValue(report.name)} ${statusLabel(status)}`}><StatusBadge status={status} /></div>;
                    })}
                  </React.Fragment>)}
                </div>
              </div>
            </div>
          </Section>
        </TabsContent>

        <TabsContent value="performance">
          <Section title="Team performance actions" description="Open a direct report to review goals, check-ins, and assessments.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {team.reports.map(report => <article key={String(report.id)} className="rounded-md border border-border p-4"><p className="text-sm font-semibold">{stringValue(report.name)}</p><p className="mt-1 text-xs text-muted-foreground">{stringValue(report.jobTitle, 'Role not assigned')}</p><Button asChild variant="outline" size="sm" className="mt-4"><a href={`/workforce/performance?employeeId=${report.id}`}>Open performance</a></Button></article>)}
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function toApprovalTask(item: EssRow): HrisApprovalTask {
  const isBenefit = item.request_type === 'benefit_enrollment';
  const isLeave = !isBenefit && (item.request_type === 'leave_request' || Boolean(item.start_date));
  const requestedValues = item.requested_values && typeof item.requested_values === 'object'
    ? item.requested_values as Record<string, unknown>
    : {};
  const requestType = statusLabel(item.request_type || 'leave request');
  const summary = isBenefit ? (
    <dl className="grid gap-2 sm:grid-cols-2">
      <div><dt className="text-xs font-medium text-muted-foreground">Benefit</dt><dd className="text-sm font-semibold">{stringValue(item.benefit_name, 'Benefit plan')}</dd></div>
      <div><dt className="text-xs font-medium text-muted-foreground">Requested coverage</dt><dd className="text-sm">{dateValue(item.effective_from)}</dd></div>
      <div><dt className="text-xs font-medium text-muted-foreground">Employee contribution</dt><dd className="text-sm">THB {Number(item.employee_contribution || 0).toLocaleString()}</dd></div>
      <div><dt className="text-xs font-medium text-muted-foreground">Request</dt><dd className="text-sm capitalize">{item.status === 'pending_termination' ? 'End coverage' : statusLabel(item.life_event_type || 'enrollment')}</dd></div>
    </dl>
  ) : isLeave ? (
    <p>{dateValue(item.start_date)} – {dateValue(item.end_date)} · {Number(item.days || 0)} day(s)</p>
  ) : Object.entries(requestedValues).length ? (
    <dl className="grid gap-2">
      {Object.entries(requestedValues).map(([key, value]) => (
        <div key={key} className="grid gap-1 sm:grid-cols-[10rem_1fr]">
          <dt className="text-xs font-medium capitalize text-muted-foreground">{statusLabel(key)}</dt>
          <dd className="break-words text-sm">{typeof value === 'object' ? JSON.stringify(value) : stringValue(value)}</dd>
        </div>
      ))}
    </dl>
  ) : <p>{stringValue(item.title)}</p>;

  return {
    id: stringValue(item.request_type, 'request') + '-' + String(item.id),
    type: requestType,
    title: personName(item),
    meta: requestType + ' · submitted ' + dateValue(item.submitted_at || item.created_at || item.updated_at),
    status: item.status,
    summary,
    reason: Boolean(item.reason) ? stringValue(item.reason) : null,
    source: item,
  };
}

function TeamMemberCard({ report }: { report: EssRow }) {
  const name = stringValue(report.name, 'Employee');
  const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  return (
    <article className="rounded-md border border-border p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10"><AvatarFallback>{initials}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{name}</p><p className="truncate text-xs text-muted-foreground">{stringValue(report.jobTitle, 'Role not assigned')}</p></div>
        <StatusBadge status={report.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div><dt className="text-muted-foreground">Location</dt><dd className="mt-0.5 font-medium">{stringValue(report.location)}</dd></div>
        <div><dt className="text-muted-foreground">Work email</dt><dd className="mt-0.5 truncate font-medium">{stringValue(report.email)}</dd></div>
      </dl>
      <Button asChild size="sm" variant="outline" className="mt-4 w-full"><a href={`/people/${report.id}`}>Employee quick view</a></Button>
    </article>
  );
}

function CompactAlert({ title, meta, status }: { title: string; meta: string; status: unknown }) {
  return <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground">{meta}</p></div><StatusBadge status={status} /></div>;
}
