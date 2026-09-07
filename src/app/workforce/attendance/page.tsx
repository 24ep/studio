import { Suspense } from 'react';

import {
  ShiftAttendanceWorkspace,
  type ShiftWorkspaceView,
} from '@/components/shift/ShiftAttendanceWorkspace';
import { LoadingState } from '@/components/shift/ShiftShared';

interface WorkforceAttendancePageProps {
  searchParams?: Promise<{
    view?: string;
  }>;
}

export default async function WorkforceAttendancePage({ searchParams }: WorkforceAttendancePageProps) {
  const resolvedSearchParams = await searchParams;
  const requested = resolvedSearchParams?.view;
  const view: ShiftWorkspaceView = requested && ['roster', 'attendance', 'requests', 'overtime', 'timesheet', 'reports'].includes(requested)
    ? requested as ShiftWorkspaceView
    : 'attendance';
  return (
    <Suspense fallback={<main className="p-4"><LoadingState /></main>}>
      <ShiftAttendanceWorkspace initialView={view} requestMode="attendance" />
    </Suspense>
  );
}
