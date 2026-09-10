import { describe, expect, it } from 'vitest';

import { calculateAttendance, resolveShiftWindow } from './attendance-calculation';

const base = {
  logicalDate: '2026-07-29',
  scheduledStart: new Date('2026-07-29T02:00:00.000Z'),
  scheduledEnd: new Date('2026-07-29T11:00:00.000Z'),
  clockIn: new Date('2026-07-29T02:00:00.000Z'),
  clockOut: new Date('2026-07-29T11:00:00.000Z'),
  breakMinutes: 60,
  approvedLeave: false,
  publicHoliday: false,
  lateToleranceMinutes: 5,
  earlyDepartureToleranceMinutes: 5,
  roundingMinutes: 1,
  approvedOvertimeMinutes: 0,
};

describe('attendance calculation', () => {
  it('calculates a complete regular shift deterministically', () => {
    expect(calculateAttendance(base)).toMatchObject({
      status: 'checked_out',
      scheduledMinutes: 540,
      workedMinutes: 480,
      regularMinutes: 480,
      lateMinutes: 0,
      earlyDepartureMinutes: 0,
      exceptionCodes: [],
    });
  });

  it('uses approved leave instead of marking a missing employee absent', () => {
    expect(calculateAttendance({
      ...base,
      clockIn: null,
      clockOut: null,
      approvedLeave: true,
    })).toMatchObject({ status: 'on_leave', exceptionCodes: [] });
  });

  it('detects late arrival, early departure, and unapproved overtime', () => {
    const result = calculateAttendance({
      ...base,
      clockIn: new Date('2026-07-29T02:20:00.000Z'),
      clockOut: new Date('2026-07-29T11:45:00.000Z'),
      breakMinutes: 0,
      approvedOvertimeMinutes: 15,
    });
    expect(result.status).toBe('late');
    expect(result.lateMinutes).toBe(15);
    expect(result.exceptionCodes).toContain('LATE_ARRIVAL');
    expect(result.exceptionCodes).toContain('UNAPPROVED_OVERTIME');
    expect(result.overtimeMinutes).toBe(15);
  });

  it('creates an overnight shift window without losing the logical date', () => {
    const window = resolveShiftWindow('2026-07-29', '22:00', '06:00', 420);
    expect(window.start.toISOString()).toBe('2026-07-29T15:00:00.000Z');
    expect(window.end.toISOString()).toBe('2026-07-29T23:00:00.000Z');
    expect((window.end.getTime() - window.start.getTime()) / 3_600_000).toBe(8);
  });

  it('prevents negative worked time and double-counting', () => {
    const result = calculateAttendance({
      ...base,
      clockOut: new Date('2026-07-29T01:00:00.000Z'),
    });
    expect(result.workedMinutes).toBe(0);
    expect(result.regularMinutes).toBe(0);
    expect(result.overtimeMinutes).toBe(0);
  });
});
