"use client";

import { useSearchParams } from 'next/navigation';

import { AttendanceView } from '@/components/ess/AttendanceView';
import { DocumentsView } from '@/components/ess/DocumentsView';
import { EmployeeProfileView } from '@/components/ess/EmployeeProfileView';
import { EssLoadingState, EssShell, ErrorState, MissingEmployeePlaceholder } from '@/components/ess/EssShared';
import type { EssView } from '@/components/ess/ess-types';
import { LeaveRequestView } from '@/components/ess/LeaveRequestView';
import { MyTeamView } from '@/components/ess/MyTeamView';
import { PerformanceView } from '@/components/ess/PerformanceView';
import { OvertimeView } from '@/components/shift/views/OvertimeView';
import { RequestsView } from '@/components/shift/views/RequestsView';
import { TimesheetView } from '@/components/shift/views/TimesheetView';
import { useEssData } from '@/components/ess/use-ess-data';
import { essAttendancePreviewData } from '@/components/ess/ess-attendance-preview-data';
import { essLeavePreviewData } from '@/components/ess/ess-leave-preview-data';

export type { EssView };

export function EmployeeSelfServicePage({
  view,
  attendanceMode = 'history',
}: {
  view: EssView;
  attendanceMode?: 'history' | 'check-in';
}) {
  const state = useEssData(view);
  const searchParams = useSearchParams();
  const preview = searchParams.get('preview');
  const previewData = process.env.NODE_ENV !== 'production'
    ? view === 'leave' && preview === 'leave'
      ? essLeavePreviewData
      : view === 'attendance' && preview === 'attendance'
        ? essAttendancePreviewData
        : null
    : null;
  const data = previewData || state.data;
  const previewMutate = async () => true;

  if (state.loading && !previewData) return <EssLoadingState />;
  if (!data) {
    const message = state.error || 'Employee self-service is not available for this account.';
    const isMissingEmployee = message.toLowerCase().includes('no employee record');

    if (isMissingEmployee) {
      return (
        <main className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8">
          <MissingEmployeePlaceholder message={message} />
        </main>
      );
    }

    return (
      <main className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <ErrorState
            message={message}
            onRetry={() => void state.load()}
          />
        </div>
      </main>
    );
  }

  const content = {
    profile: <EmployeeProfileView data={data} submitting={state.submitting} mutate={state.mutate} />,
    leave: <LeaveRequestView data={data} submitting={state.submitting} mutate={previewData ? previewMutate : state.mutate} />,
    attendance: <AttendanceView mode={attendanceMode} data={data} submitting={state.submitting} mutate={previewData ? previewMutate : state.mutate} />,
    'shift-requests': <RequestsView mode="shift" employeeSelfService />,
    'attendance-corrections': <RequestsView mode="attendance" employeeSelfService />,
    overtime: <OvertimeView employeeSelfService />,
    timesheet: <TimesheetView />,
    documents: <DocumentsView data={data} submitting={state.submitting} mutate={state.mutate} upload={state.upload} />,
    performance: <PerformanceView data={data} submitting={state.submitting} mutate={state.mutate} />,
    team: <MyTeamView data={data} team={state.team} submitting={state.submitting} mutate={state.mutate} />,
  }[view];

  // My Profile owns the same full-height chrome as Employee Detail through
  // EmployeeProfileScaffold, so it must not be nested inside the generic ESS shell.
  if (view === 'profile') return content;

  return (
    <EssShell
      view={view}
      employee={data.employee}
      backgroundLoading={state.backgroundLoading}
      error={previewData ? null : state.error}
      onRetry={() => void state.load(true)}
    >
      {content}
    </EssShell>
  );
}
