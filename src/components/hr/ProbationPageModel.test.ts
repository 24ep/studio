import { describe, expect, it, vi } from 'vitest';

import {
  daysUntil,
  employeeName,
  evaluationMeta,
  initials,
  rosterView,
  viewLabel,
  type ProbationEmployee,
} from './ProbationPageModel';

const employee = (overrides: Partial<ProbationEmployee> = {}): ProbationEmployee => ({
  id: 'employee-1',
  employeeNumber: 'EMP-001',
  firstName: 'Ava',
  lastName: 'Stone',
  email: 'ava@example.com',
  location: 'Bangkok',
  profilePhotoUrl: null,
  status: 'probation',
  hireDate: '2026-08-01T00:00:00.000Z',
  positionId: null,
  positionTitle: 'Analyst',
  managerName: 'Manager One',
  managerJobTitle: 'Lead',
  positionProbationPeriodDays: 90,
  positionEvaluationFrequencyDays: 30,
  probationPeriodDays: null,
  evaluationFrequencyDays: null,
  effectivePeriodDays: 90,
  effectiveFrequencyDays: 30,
  probationStartDate: '2026-08-01T00:00:00.000Z',
  probationEndDate: '2026-10-30T00:00:00.000Z',
  nextEvaluationDate: '2026-08-30T00:00:00.000Z',
  evaluationNumber: 1,
  daysRemaining: 68,
  progressPercent: 25,
  ...overrides,
});

describe('ProbationPageModel', () => {
  it('formats employee display identity', () => {
    expect(employeeName(employee())).toBe('Ava Stone');
    expect(initials(employee())).toBe('AS');
  });

  it('classifies roster timing from the next evaluation date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-23T12:00:00.000Z'));

    expect(daysUntil('2026-08-22T00:00:00.000Z')).toBe(-1);
    expect(rosterView(employee({ nextEvaluationDate: '2026-08-22T00:00:00.000Z' }))).toBe('overdue');
    expect(rosterView(employee({ nextEvaluationDate: '2026-08-29T00:00:00.000Z' }))).toBe('due');
    expect(rosterView(employee({ nextEvaluationDate: '2026-09-10T00:00:00.000Z' }))).toBe('upcoming');
    expect(rosterView(employee({ nextEvaluationDate: '2026-10-01T00:00:00.000Z' }))).toBe('on-track');

    vi.useRealTimers();
  });

  it('keeps evaluation and roster labels stable', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-23T12:00:00.000Z'));

    expect(evaluationMeta(employee({ nextEvaluationDate: '2026-08-23T00:00:00.000Z' })).label).toBe('Due today');
    expect(evaluationMeta(employee({ nextEvaluationDate: '2026-08-24T00:00:00.000Z' })).label).toBe('Due tomorrow');
    expect(viewLabel('on-track')).toBe('On track');
    expect(viewLabel('due')).toBe('Due this week');

    vi.useRealTimers();
  });
});
