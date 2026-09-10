import { Suspense } from 'react';

import { ShiftAttendanceWorkspace } from '@/components/shift/ShiftAttendanceWorkspace';
import { LoadingState } from '@/components/shift/ShiftShared';
import { LeaveWorkspaceRoute } from '@/components/leaves/LeaveWorkspaceRoute';

interface WorkforceLeavePageProps {
  searchParams?: Promise<{
    type?: string;
  }>;
}

export default async function WorkforceLeavePage({ searchParams }: WorkforceLeavePageProps) {
  const resolvedSearchParams = await searchParams;

  if (resolvedSearchParams?.type === 'shift-request') {
    return (
      <Suspense fallback={<main className="p-4"><LoadingState /></main>}>
        <ShiftAttendanceWorkspace initialView="requests" requestMode="shift" />
      </Suspense>
    );
  }

  return <LeaveWorkspaceRoute view="requests" />;
}
