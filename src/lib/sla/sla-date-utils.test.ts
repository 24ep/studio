import { describe, expect, it } from 'vitest';
import {
  getDeadlineDate,
  getEffectiveSLAStartDateForHeadcount,
  getRemainingDaysUntil,
  getWholeDaysBetween,
} from './sla-date-utils';
import { formatSLAMessage, getSLABadgeVariant } from './sla-display-utils';

describe('SLA date and display utilities', () => {
  it('calculates deadlines and whole elapsed days', () => {
    const start = new Date('2026-06-01T00:00:00.000Z');
    const end = new Date('2026-06-04T23:59:00.000Z');

    expect(getDeadlineDate(start, 10).toISOString()).toBe('2026-06-11T00:00:00.000Z');
    expect(getWholeDaysBetween(start, end)).toBe(3);
  });

  it('rounds remaining days up and clamps overdue dates to zero', () => {
    const now = new Date('2026-06-01T12:00:00.000Z');

    expect(getRemainingDaysUntil(new Date('2026-06-02T00:00:00.000Z'), now)).toBe(1);
    expect(getRemainingDaysUntil(new Date('2026-05-31T00:00:00.000Z'), now)).toBe(0);
  });

  it('uses onboarding date only for filled headcounts', () => {
    expect(
      getEffectiveSLAStartDateForHeadcount({
        status: 'filled',
        onboardingDate: '2026-06-03T00:00:00.000Z',
        requestDate: '2026-06-01T00:00:00.000Z',
      })?.toISOString()
    ).toBe('2026-06-03T00:00:00.000Z');

    expect(
      getEffectiveSLAStartDateForHeadcount({
        status: 'vacant',
        onboardingDate: '2026-06-03T00:00:00.000Z',
        requestDate: '2026-06-01T00:00:00.000Z',
      })?.toISOString()
    ).toBe('2026-06-01T00:00:00.000Z');
  });

  it('formats SLA badge and copy consistently', () => {
    expect(getSLABadgeVariant(0)).toBe('default');
    expect(getSLABadgeVariant(2)).toBe('destructive');

    expect(
      formatSLAMessage({
        isViolated: false,
        daysOverdue: 0,
        slaDays: 14,
        gradeName: 'Senior',
        gradeColor: '#000',
      })
    ).toBe('Senior - 14 days SLA');

    expect(
      formatSLAMessage({
        isViolated: true,
        daysOverdue: 3,
        slaDays: 14,
        gradeName: 'Senior',
        gradeColor: '#000',
      })
    ).toBe('Senior - 3 days overdue (14 days SLA)');
  });

});
