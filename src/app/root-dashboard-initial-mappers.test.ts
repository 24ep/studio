import { describe, expect, it, vi } from 'vitest';

import {
  mapDashboardApplicantRows,
  mapDashboardPositionRows,
  mapDashboardStageRows,
  mapDashboardUserRows,
  normalizeFitScore,
  toIsoString,
} from './root-dashboard-initial-mappers';

vi.mock('@/lib/utils', () => ({
  safeJsonParse: (value: unknown, fallback: unknown) => {
    if (typeof value !== 'string') return value ?? fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  },
}));

describe('root dashboard initial mappers', () => {
  it('normalizes dates and fit scores from dashboard rows', () => {
    expect(toIsoString(new Date('2026-01-01T00:00:00Z'))).toBe('2026-01-01T00:00:00.000Z');
    expect(toIsoString('2026-01-02')).toBe('2026-01-02');
    expect(normalizeFitScore(0.75, null)).toBe(75);
    expect(normalizeFitScore(150, null)).toBe(100);
    expect(normalizeFitScore(10, { job_applied: { fitScore: 0.9 } } as never)).toBe(90);
  });

  it('maps applicant, position, and user rows into dashboard models', () => {
    expect(mapDashboardApplicantRows([{
      id: 'applicant-1',
      name: 'Ada',
      email: 'ada@example.com',
      parsedData: JSON.stringify({ job_applied: { fitScore: 0.82 } }),
      positionId: 'position-1',
      positionTitle: 'Engineer',
      positionDepartment: 'Product',
      fitScore: 30,
      status: 'Applied',
      applicationDate: '2026-01-01',
      recruiterId: 'user-1',
      recruiterName: 'Grace',
      recruiterEmail: 'grace@example.com',
    }])[0]).toMatchObject({
      id: 'applicant-1',
      fitScore: 82,
      position: { id: 'position-1', title: 'Engineer' },
      recruiter: { id: 'user-1', name: 'Grace' },
    });

    expect(mapDashboardPositionRows([{
      id: 'position-1',
      title: 'Engineer',
      isOpen: null,
    }])[0]).toMatchObject({
      id: 'position-1',
      isOpen: true,
    });

    expect(mapDashboardUserRows([{
      id: 'user-1',
      name: 'Grace',
      email: 'grace@example.com',
      role: 'Recruiter',
    }])[0]).toMatchObject({
      id: 'user-1',
      avatarUrl: undefined,
    });
  });

  it('maps stage names by normalized name and canonical aliases', () => {
    expect(mapDashboardStageRows([
      { id: 'stage-1', name: 'Interview Scheduled' },
      { id: 'stage-2', name: 'Offer Extended' },
      { id: 'stage-3', name: 'Custom Stage' },
    ])).toEqual({
      stageIds: {
        'interview scheduled': 'stage-1',
        interviewScheduled: 'stage-1',
        'offer extended': 'stage-2',
        offerExtended: 'stage-2',
        'custom stage': 'stage-3',
      },
      stageNames: {
        'stage-1': 'Interview Scheduled',
        'stage-2': 'Offer Extended',
        'stage-3': 'Custom Stage',
      },
    });
  });
});
