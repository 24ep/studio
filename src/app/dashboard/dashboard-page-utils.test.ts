import { describe, expect, it } from 'vitest';

import {
  createDefaultDashboardMetrics,
  mapDashboardApplicants,
  mapDashboardPositions,
  mapDashboardStages,
  mapDashboardUsers,
  toDashboardIsoDate,
} from './dashboard-page-utils';

describe('dashboard page utilities', () => {
  it('creates default dashboard metrics', () => {
    expect(createDefaultDashboardMetrics()).toMatchObject({
      kpis: {
        activeApplicants: 0,
        openHeadcounts: 0,
        avgTimeToHire: '0.00',
      },
      timeSeries: [],
      scoreDistribution: [],
      pipelineStages: [],
      pipelineRecruiters: [],
    });
  });

  it('normalizes dashboard dates', () => {
    expect(toDashboardIsoDate(new Date('2026-01-01T00:00:00.000Z'))).toBe('2026-01-01T00:00:00.000Z');
    expect(toDashboardIsoDate('2026-01-02')).toBe('2026-01-02');
  });

  it('maps applicant rows with parsed JSON and nested relations', () => {
    const applicants = mapDashboardApplicants([{
      id: 'applicant-1',
      name: 'Ada',
      email: 'ada@example.com',
      parsedData: '{"personal_info":{"firstname":"Ada"}}',
      customAttributes: '{"seniority":"senior"}',
      positionId: 'position-1',
      positionTitle: 'Engineer',
      positionDepartment: 'Product',
      positionIsOpen: true,
      recruiterId: 'user-1',
      recruiterName: 'Grace',
      recruiterEmail: 'grace@example.com',
      statusId: 'stage-1',
      statusName: 'Applied',
      applicationDate: '2026-01-01',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    }]);

    expect(applicants[0]).toMatchObject({
      id: 'applicant-1',
      parsedData: { personal_info: { firstname: 'Ada' } },
      customAttributes: { seniority: 'senior' },
      position: {
        id: 'position-1',
        title: 'Engineer',
        department: 'Product',
        isOpen: true,
      },
      recruiter: {
        id: 'user-1',
        name: 'Grace',
        email: 'grace@example.com',
      },
      status: 'Applied',
      transitionHistory: [],
    });
  });

  it('maps positions and users', () => {
    expect(mapDashboardPositions([{
      id: 'position-1',
      title: 'Engineer',
      department: 'Product',
      isOpen: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    }])[0]).toMatchObject({
      id: 'position-1',
      title: 'Engineer',
      department: 'Product',
      isOpen: true,
    });

    expect(mapDashboardUsers([{
      id: 'user-1',
      name: 'Grace',
      email: 'grace@example.com',
      role: 'Recruiter',
      avatarUrl: null,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
    }])[0]).toMatchObject({
      id: 'user-1',
      name: 'Grace',
      role: 'Recruiter',
      avatarUrl: undefined,
    });
  });

  it('maps dashboard stage ids and display names', () => {
    expect(mapDashboardStages([
      { id: 'stage-applied', name: 'Applied' },
      { id: 'stage-interview', name: 'Interview Scheduled' },
    ])).toEqual({
      stageIds: {
        applied: 'stage-applied',
        'interview scheduled': 'stage-interview',
        interviewScheduled: 'stage-interview',
      },
      stageNames: {
        'stage-applied': 'Applied',
        'stage-interview': 'Interview Scheduled',
      },
    });
  });
});
