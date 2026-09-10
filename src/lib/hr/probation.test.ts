import { describe, expect, it } from 'vitest';

import { calculateProbationSchedule } from './probation';

describe('calculateProbationSchedule', () => {
  it('calculates the next recurring evaluation inside the probation period', () => {
    const schedule = calculateProbationSchedule({
      hireDate: '2026-07-01T00:00:00.000Z',
      probationPeriodDays: 90,
      evaluationFrequencyDays: 30,
      now: new Date('2026-07-29T00:00:00.000Z'),
    });

    expect(schedule).not.toBeNull();
    expect(schedule?.evaluationNumber).toBe(1);
    expect(schedule?.nextEvaluationDate.toISOString().slice(0, 10)).toBe('2026-07-31');
    expect(schedule?.endDate.toISOString().slice(0, 10)).toBe('2026-09-29');
    expect(schedule?.isOnProbation).toBe(true);
  });

  it('clamps the final evaluation to the probation end date', () => {
    const schedule = calculateProbationSchedule({
      hireDate: '2026-07-01T00:00:00.000Z',
      probationPeriodDays: 45,
      evaluationFrequencyDays: 30,
      now: new Date('2026-08-05T00:00:00.000Z'),
    });

    expect(schedule?.evaluationNumber).toBe(2);
    expect(schedule?.nextEvaluationDate.toISOString().slice(0, 10)).toBe('2026-08-15');
  });

  it('uses safe defaults and rejects missing hire dates', () => {
    expect(calculateProbationSchedule({ hireDate: null })).toBeNull();
    expect(calculateProbationSchedule({
      hireDate: '2026-07-01',
      probationPeriodDays: 0,
      evaluationFrequencyDays: -5,
      now: new Date('2026-07-01'),
    })).toMatchObject({
      periodDays: 90,
      evaluationFrequencyDays: 30,
    });
  });

  it('retains an overdue schedule so unresolved decisions can be surfaced', () => {
    expect(calculateProbationSchedule({
      hireDate: '2026-02-03',
      probationPeriodDays: 90,
      now: new Date('2026-08-13'),
    })).toMatchObject({
      isOnProbation: false,
      daysRemaining: -101,
      progressPercent: 100,
    });
  });
});
