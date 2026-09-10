import { describe, expect, it } from 'vitest';

import type { EvaluationApplicant } from './evaluate-calendar';
import {
  getApplicantsForDate,
  getDaysInMonth,
  getDayCellOverflowCount,
  getEvaluationApplicantScheduleState,
  getFirstDayOfMonth,
  getRemindersForDate,
  groupEvaluationApplicantsByDate,
  isCalendarActivationKey,
  sortEvaluationApplicantsByScheduleDate,
} from './evaluate-calendar-utils';

function applicant(overrides: Partial<EvaluationApplicant> = {}): EvaluationApplicant {
  return {
    id: 'applicant-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    avatarUrl: null,
    position: { id: 'position-1', title: 'Engineer' },
    evaluationLink: {
      url: '/evaluate',
      expiresAt: '2026-01-03T09:00:00.000Z',
      interviewDateTime: '2026-01-02T09:00:00.000Z',
      revokedAt: null,
    },
    ...overrides,
  };
}

describe('evaluate-calendar-utils', () => {
  it('builds month days and first weekday', () => {
    expect(getDaysInMonth(2026, 1)).toHaveLength(28);
    expect(getFirstDayOfMonth(2026, 1)).toBe(0);
  });

  it('summarizes item keyboard activation and day-cell overflow', () => {
    expect(isCalendarActivationKey('Enter')).toBe(true);
    expect(isCalendarActivationKey(' ')).toBe(true);
    expect(isCalendarActivationKey('Escape')).toBe(false);
    expect(getDayCellOverflowCount(3, 2)).toBe(0);
    expect(getDayCellOverflowCount(4, 3)).toBe(2);
  });

  it('finds applicants and reminders matching a date', () => {
    const date = new Date('2026-01-02T12:00:00.000Z');

    expect(getApplicantsForDate([
      applicant(),
      applicant({
        id: 'applicant-2',
        evaluationLink: { url: '/evaluate', expiresAt: '2026-01-05T09:00:00.000Z' },
      }),
    ], date).map(item => item.id)).toEqual(['applicant-1']);

    expect(getRemindersForDate([
      {
        id: 'reminder-1',
        title: 'Follow up',
        reminderDate: '2026-01-02T08:00:00.000Z',
        applicant: { id: 'applicant-1', name: 'Ada' },
      },
    ], date).map(item => item.id)).toEqual(['reminder-1']);
  });

  it('summarizes applicant schedule status', () => {
    expect(getEvaluationApplicantScheduleState(
      applicant({ evaluationLink: { url: '/evaluate', expiresAt: '2026-01-03T09:00:00.000Z', interviewDateTime: '2026-01-02T09:00:00.000Z' } }),
      new Date('2026-01-01T00:00:00.000Z')
    )).toMatchObject({
      isInactive: false,
      inactiveLabel: null,
    });

    expect(getEvaluationApplicantScheduleState(
      applicant({ evaluationLink: { url: '/evaluate', expiresAt: '2026-01-01T09:00:00.000Z', revokedAt: '2026-01-01T10:00:00.000Z' } }),
      new Date('2026-01-02T00:00:00.000Z')
    )).toMatchObject({
      isInactive: true,
      inactiveLabel: 'Revoked',
    });
  });

  it('sorts and groups applicants by schedule date', () => {
    const later = applicant({ id: 'later', evaluationLink: { url: '/evaluate', expiresAt: '2026-01-04T09:00:00.000Z' } });
    const earlier = applicant({ id: 'earlier', evaluationLink: { url: '/evaluate', expiresAt: '2026-01-02T09:00:00.000Z' } });

    expect(sortEvaluationApplicantsByScheduleDate([later, earlier]).map(item => item.id)).toEqual(['earlier', 'later']);

    const grouped = groupEvaluationApplicantsByDate([earlier, later]);
    expect(Object.values(grouped).map(items => items.map(item => item.id))).toEqual([
      ['earlier'],
      ['later'],
    ]);
  });
});
