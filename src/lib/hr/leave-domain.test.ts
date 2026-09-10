import { describe, expect, it } from 'vitest';

import { availableLeaveBalance, calculateLeave, calculateShiftHours, prorateEntitlement } from './leave-domain';

describe('leave calculation engine', () => {
  it('excludes weekends and public holidays', () => {
    const result = calculateLeave({
      startDate: '2026-08-03',
      endDate: '2026-08-10',
      holidayDates: ['2026-08-07'],
      availableBalance: 12,
    });
    expect(result.calendarDays).toBe(8);
    expect(result.workingDays).toBe(5);
    expect(result.leaveUnits).toBe(5);
    expect(result.balanceAfterApproval).toBe(7);
    expect(result.excludedDates).toHaveLength(3);
  });

  it('calculates half-day and hourly leave', () => {
    expect(calculateLeave({ startDate: '2026-08-03', endDate: '2026-08-03', unit: 'half_day' }).leaveUnits).toBe(0.5);
    expect(calculateLeave({ startDate: '2026-08-03', endDate: '2026-08-03', unit: 'hourly', requestedHours: 2 }).leaveUnits).toBe(0.25);
  });

  it('supports overnight roster shifts', () => {
    const result = calculateLeave({
      startDate: '2026-08-03',
      endDate: '2026-08-03',
      roster: [{ date: '2026-08-03', startTime: '22:00', endTime: '06:00', status: 'published' }],
    });
    expect(calculateShiftHours('22:00', '06:00')).toEqual({ hours: 8, overnight: true });
    expect(result.workingHours).toBe(8);
    expect(result.includedDates[0].overnight).toBe(true);
  });

  it('blocks a request that exceeds a non-negative balance', () => {
    const result = calculateLeave({
      startDate: '2026-08-03',
      endDate: '2026-08-05',
      availableBalance: 2,
    });
    expect(result.validation).toContainEqual(expect.objectContaining({ code: 'BALANCE', level: 'blocked' }));
  });

  it('accounts for accrued and reserved units in the balance', () => {
    expect(availableLeaveBalance({
      allocated: 10,
      accrued: 2,
      carryForward: 3,
      used: 4,
      pending: 1,
      reserved: 2,
    })).toBe(8);
  });

  it('prorates annual entitlement to half-unit precision', () => {
    expect(prorateEntitlement(12, '2026-07-01', '2026-12-31')).toBe(6);
  });
});
