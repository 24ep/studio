import { describe, expect, it } from 'vitest';

import { shiftAttendanceMutationSchema } from './shift-attendance-contracts';

describe('Shift & Attendance mutation contracts', () => {
  it('accepts an overnight roster assignment', () => {
    expect(shiftAttendanceMutationSchema.safeParse({
      action: 'create_assignment',
      employeeIds: ['00000000-0000-0000-0000-000000000001'],
      shiftDate: '2026-07-29',
      startTime: '22:00',
      endTime: '06:00',
      workLocation: 'Bangkok Office',
      reason: 'Night operations coverage',
    }).success).toBe(true);
  });

  it('requires a colleague for a shift swap', () => {
    expect(shiftAttendanceMutationSchema.safeParse({
      action: 'create_shift_request',
      requestType: 'shift_swap',
      effectiveStart: '2026-07-29',
      effectiveEnd: '2026-07-29',
      reason: 'Family appointment',
      saveAsDraft: false,
    }).success).toBe(false);
  });

  it('validates audited roster updates and cancellations', () => {
    const assignmentId = '00000000-0000-0000-0000-000000000001';
    expect(shiftAttendanceMutationSchema.safeParse({
      action: 'update_assignment',
      assignmentId,
      shiftDate: '2026-08-14',
      startTime: '09:00',
      endTime: '18:00',
      workLocation: 'Bangkok Office',
      expectedVersion: 2,
      reason: 'Coverage requirements changed',
    }).success).toBe(true);
    expect(shiftAttendanceMutationSchema.safeParse({
      action: 'delete_assignment',
      assignmentId,
      expectedVersion: 2,
      reason: '',
    }).success).toBe(false);
  });

  it('rejects overtime with an end before the start', () => {
    expect(shiftAttendanceMutationSchema.safeParse({
      action: 'create_overtime',
      date: '2026-07-29',
      startAt: '2026-07-29T20:00:00.000Z',
      endAt: '2026-07-29T19:00:00.000Z',
      breakMinutes: 0,
      overtimeType: 'planned',
      reason: 'Quarterly close support',
      compensationMethod: 'paid',
      saveAsDraft: false,
    }).success).toBe(false);
  });

  it('requires comments for negative timesheet decisions', () => {
    const base = {
      action: 'decide_timesheet',
      timesheetId: '00000000-0000-0000-0000-000000000001',
      expectedVersion: 1,
    };
    expect(shiftAttendanceMutationSchema.safeParse({ ...base, decision: 'return' }).success).toBe(false);
    expect(shiftAttendanceMutationSchema.safeParse({ ...base, decision: 'return', comment: 'Clarify the client allocation.' }).success).toBe(true);
  });

  it('requires an explicit reason to reopen a closed attendance period', () => {
    expect(shiftAttendanceMutationSchema.safeParse({
      action: 'reopen_period',
      attendancePeriodId: '00000000-0000-0000-0000-000000000001',
      expectedVersion: 1,
      reason: '',
    }).success).toBe(false);
  });
});
