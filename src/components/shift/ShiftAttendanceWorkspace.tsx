"use client";

import * as React from 'react';
import { useSearchParams } from 'next/navigation';

import { AttendanceOperationsView } from './views/AttendanceOperationsView';
import { OvertimeView } from './views/OvertimeView';
import { ReportsView } from './views/ReportsView';
import { RequestsView } from './views/RequestsView';
import { RosterView } from './views/RosterView';
import { TimesheetView } from './views/TimesheetView';

export type ShiftWorkspaceView = 'roster' | 'attendance' | 'requests' | 'overtime' | 'timesheet' | 'reports';

export function ShiftAttendanceWorkspace({
  initialView = 'attendance',
  requestMode,
}: {
  initialView?: ShiftWorkspaceView;
  requestMode?: 'shift' | 'attendance';
}) {
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view') as ShiftWorkspaceView | null;
  const view = requestedView && ['roster', 'attendance', 'requests', 'overtime', 'timesheet', 'reports'].includes(requestedView)
    ? requestedView
    : initialView;

  if (view === 'roster') return <RosterView />;
  if (view === 'requests') return <RequestsView mode={requestMode || 'attendance'} />;
  if (view === 'overtime') return <OvertimeView />;
  if (view === 'timesheet') return <TimesheetView />;
  if (view === 'reports') return <ReportsView />;
  return <AttendanceOperationsView />;
}
