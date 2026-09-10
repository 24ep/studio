import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  default: {
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  },
}));

vi.mock('@/lib/minio', () => ({
  MINIO_BUCKET: 'test-bucket',
  minioClient: {
    putObject: vi.fn(),
  },
}));

vi.mock('@/lib/fileUtils', () => ({
  sanitizeFilename: (value: string) => value.replace(/\s+/g, '_'),
}));

vi.mock('@/lib/notificationService', () => ({
  NotificationService: {
    createNotification: vi.fn(),
  },
}));

import {
  calculateAttendanceHours,
  calculateInclusiveLeaveDays,
  calculateWorkingLeaveDays,
  essAttendanceActionSchema,
  essLearningPatchSchema,
  essLeaveRequestSchema,
  essGroupedLeaveRequestSchema,
  essProfileRequestSchema,
  essTeamActionSchema,
} from './ess-service';

describe('ESS service validation', () => {
  it('calculates inclusive leave days', () => {
    expect(calculateInclusiveLeaveDays(new Date('2026-07-01'), new Date('2026-07-01'))).toBe(1);
    expect(calculateInclusiveLeaveDays(new Date('2026-07-01'), new Date('2026-07-03'))).toBe(3);
  });

  it('excludes weekends and holidays when calculating policy leave time', () => {
    expect(calculateWorkingLeaveDays({
      startDate: new Date('2026-07-24T00:00:00Z'),
      endDate: new Date('2026-07-28T00:00:00Z'),
      excludeWeekends: true,
      holidayDates: ['2026-07-27'],
    })).toBe(2);
  });

  it('calculates clocked attendance hours without negative totals', () => {
    expect(calculateAttendanceHours(new Date('2026-07-01T09:00:00Z'), new Date('2026-07-01T17:30:00Z'))).toBe(8.5);
    expect(calculateAttendanceHours(new Date('2026-07-01T17:30:00Z'), new Date('2026-07-01T09:00:00Z'))).toBe(0);
  });

  it('validates employee leave requests', () => {
    expect(essLeaveRequestSchema.safeParse({ startDate: '2026-07-01', endDate: '2026-07-02', emergencyContact: '{"name":"Somchai"}' }).success).toBe(true);
    expect(essLeaveRequestSchema.safeParse({ startDate: '2026-07-01', endDate: '2026-07-02' }).success).toBe(false);
    expect(essLeaveRequestSchema.safeParse({ startDate: '', endDate: '2026-07-02' }).success).toBe(false);
  });

  it('accepts multiple leave types and date ranges in one request', () => {
    expect(essGroupedLeaveRequestSchema.safeParse({
      segments: [
        { policyId: '11111111-1111-4111-8111-111111111111', startDate: '2026-08-10', endDate: '2026-08-11', requestUnit: 'full_day' },
        { policyId: '22222222-2222-4222-8222-222222222222', startDate: '2026-08-14', endDate: '2026-08-14', requestUnit: 'half_day', halfDayPeriod: 'morning' },
      ],
      reason: 'Combined annual and personal leave',
      emergencyContact: '{"name":"Somchai"}',
      saveAsDraft: false,
    }).success).toBe(true);
  });

  it('limits profile change requests to employee-safe fields', () => {
    expect(essProfileRequestSchema.safeParse({ field: 'phone', requestedValue: '+66 2 555 0100' }).success).toBe(true);
    expect(essProfileRequestSchema.safeParse({ field: 'jobTitle', requestedValue: 'CEO' }).success).toBe(false);
  });

  it('validates self-service and manager actions', () => {
    expect(essAttendanceActionSchema.safeParse({ action: 'clock_in' }).success).toBe(true);
    expect(essAttendanceActionSchema.safeParse({ action: 'clock_out' }).success).toBe(true);
    expect(essAttendanceActionSchema.safeParse({ action: 'start_break' }).success).toBe(true);
    expect(essAttendanceActionSchema.safeParse({ action: 'end_break' }).success).toBe(true);
    expect(essAttendanceActionSchema.safeParse({ action: 'approve_attendance' }).success).toBe(false);
    expect(essLearningPatchSchema.safeParse({ id: '00000000-0000-0000-0000-000000000001', action: 'complete' }).success).toBe(true);
    expect(essTeamActionSchema.safeParse({ id: '00000000-0000-0000-0000-000000000001', action: 'approve_leave' }).success).toBe(true);
    expect(essTeamActionSchema.safeParse({ id: '00000000-0000-0000-0000-000000000001', action: 'reject_leave' }).success).toBe(false);
    expect(essTeamActionSchema.safeParse({ id: '00000000-0000-0000-0000-000000000001', action: 'reject_leave', comment: 'Insufficient coverage' }).success).toBe(true);
    expect(essTeamActionSchema.safeParse({ id: '00000000-0000-0000-0000-000000000001', action: 'approve_payroll' }).success).toBe(false);
  });
});
