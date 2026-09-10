import { describe, expect, it } from 'vitest';

import type { Applicant, Position, TransitionRecord } from '@/lib/types';
import {
  buildDashboardClientDerivedData,
  getDashboardFallbackRoute,
  shouldRedirectDashboardUnauthenticated,
} from './dashboard-page-client-utils';
import {
  buildDashboardStats,
  buildPipelineCounts,
  calculateAverageTimeToHire,
  createPlaceholderList,
  getActiveUnassignedApplicants,
  getHighPriorityApplicants,
  getOpenPositionsWithNoApplicants,
  paginateDashboardItems,
} from './dashboard-page-utils';

function makeApplicant(overrides: Partial<Applicant> = {}): Applicant {
  return {
    id: overrides.id ?? 'applicant-id',
    name: overrides.name ?? 'Applicant',
    email: overrides.email ?? '',
    parsedData: overrides.parsedData ?? null,
    positionId: overrides.positionId ?? null,
    fitScore: overrides.fitScore ?? 0,
    statusId: overrides.statusId ?? '',
    status: overrides.status ?? 'Applied',
    applicationDate: overrides.applicationDate ?? '2026-01-01T00:00:00.000Z',
    transitionHistory: overrides.transitionHistory ?? [],
    ...overrides,
  };
}

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    id: overrides.id ?? 'position-id',
    title: overrides.title ?? '',
    department: overrides.department ?? '',
    isOpen: overrides.isOpen ?? true,
    ...overrides,
  };
}

function makeTransition(overrides: Partial<TransitionRecord>): TransitionRecord {
  return {
    id: overrides.id ?? 'transition-id',
    date: overrides.date ?? '2026-01-01T00:00:00.000Z',
    stage: overrides.stage ?? 'stage',
    ...overrides,
  };
}

describe('dashboard page utilities', () => {
  it('derives open positions without applicants', () => {
    expect(getOpenPositionsWithNoApplicants([
      makePosition({ id: 'open-with-applicant' }),
      makePosition({ id: 'open-empty' }),
      makePosition({ id: 'closed-empty', isOpen: false }),
    ], [
      makeApplicant({ positionId: 'open-with-applicant' }),
    ]).map(position => position.id)).toEqual(['open-empty']);
  });

  it('filters active unassigned and high-priority applicants', () => {
    const applicants = [
      makeApplicant({ id: 'active-unassigned', status: 'Applied', recruiterId: null, fitScore: 90 }),
      makeApplicant({ id: 'assigned', status: 'Applied', recruiterId: 'recruiter-1', fitScore: 85 }),
      makeApplicant({ id: 'inactive', status: 'Hired', recruiterId: null, fitScore: 70 }),
    ];

    expect(getActiveUnassignedApplicants(applicants).map(applicant => applicant.id)).toEqual(['active-unassigned']);
    expect(getHighPriorityApplicants(applicants).map(applicant => applicant.id)).toEqual(['active-unassigned', 'assigned']);
  });

  it('paginates dashboard lists defensively', () => {
    expect(paginateDashboardItems(['a', 'b', 'c'], 2, 2)).toEqual(['c']);
    expect(paginateDashboardItems(['a', 'b', 'c'], 0, 0)).toEqual(['a', 'b', 'c']);
  });

  it('calculates average time to hire from latest hired transitions', () => {
    expect(calculateAverageTimeToHire([
      makeApplicant({
        status: 'Hired',
        applicationDate: '2026-01-01T00:00:00.000Z',
        transitionHistory: [
          makeTransition({ id: 'transition-1', stage: 'hired-stage', date: '2026-01-03T00:00:00.000Z' }),
          makeTransition({ id: 'transition-2', stage: 'hired-stage', date: '2026-01-05T00:00:00.000Z' }),
        ],
      }),
      makeApplicant({
        status: 'Hired',
        applicationDate: '2026-01-10T00:00:00.000Z',
        transitionHistory: [
          makeTransition({ id: 'transition-3', stage: 'hired-stage', date: '2026-01-11T00:00:00.000Z' }),
        ],
      }),
    ], 'hired-stage')).toBe(2.5);
  });

  it('builds pipeline count maps and placeholder lists', () => {
    expect(buildPipelineCounts([
      { stage: 'Applied', count: 2 },
      { recruiter: 'Ada', count: 3 },
    ])).toEqual({
      Applied: 2,
      Ada: 3,
    });
    expect(createPlaceholderList(3)).toEqual([null, null, null]);
    expect(createPlaceholderList(-1)).toEqual([]);
  });

  it('chooses dashboard fallback routes from available permissions', () => {
    expect(getDashboardFallbackRoute({
      canAccessMyTasks: true,
      canViewPositions: true,
    })).toBe('/my-tasks');

    expect(getDashboardFallbackRoute({
      canAccessMyTasks: false,
      canViewPositions: true,
    })).toBe('/positions');

    expect(getDashboardFallbackRoute({
      canAccessMyTasks: false,
      canViewPositions: false,
    })).toBe('/applicants');
  });

  it('detects when unauthenticated dashboard users should redirect', () => {
    expect(shouldRedirectDashboardUnauthenticated({
      isLogoutInProgress: false,
      isOnSigninPage: false,
    })).toBe(true);
    expect(shouldRedirectDashboardUnauthenticated({
      isLogoutInProgress: true,
      isOnSigninPage: false,
    })).toBe(false);
    expect(shouldRedirectDashboardUnauthenticated({
      isLogoutInProgress: false,
      isOnSigninPage: true,
    })).toBe(false);
  });

  it('builds combined dashboard stats from applicants, positions, and metrics', () => {
    const stats = buildDashboardStats({
      applicants: [
        makeApplicant({ id: 'a', status: 'Applied', applicationDate: new Date().toISOString(), positionId: 'position-1' }),
        makeApplicant({ id: 'b', status: 'Interviewing', recruiterId: 'recruiter-1', applicationDate: new Date().toISOString() }),
      ],
      positions: [
        makePosition({ id: 'position-1' }),
        makePosition({ id: 'position-2' }),
      ],
      myAssignedApplicants: [
        makeApplicant({ id: 'mine', status: 'Interviewing', applicationDate: new Date().toISOString() }),
      ],
      myBacklogApplicants: [
        makeApplicant({ id: 'action', recruiterId: 'recruiter-1' }),
        makeApplicant({ id: 'other', recruiterId: 'recruiter-2' }),
      ],
      metrics: {
        kpis: {
          activeApplicants: 7,
          openHeadcounts: 4,
          hiredThisMonth: 2,
          rejectedThisMonth: 1,
        },
        pipelineRecruiters: [{ recruiter: 'Ada', count: 2 }],
      },
      recruiterId: 'recruiter-1',
    });

    expect(stats.totalActiveApplicants).toBe(7);
    expect(stats.openPositionsWithNoApplicants.map(position => position.id)).toEqual(['position-2']);
    expect(stats.myApplicantsInInterviewCount).toBe(1);
    expect(stats.myActionItemsList.map(applicant => applicant.id)).toEqual(['action']);
  });

  it('builds dashboard client derived data from arrays and metrics', () => {
    const derived = buildDashboardClientDerivedData({
      allPositions: [makePosition({ id: 'position-1' })],
      filteredApplicants: [
        makeApplicant({
          status: 'Hired',
          applicationDate: '2026-01-01T00:00:00.000Z',
          transitionHistory: [
            makeTransition({ stage: 'hired-stage', date: '2026-01-04T00:00:00.000Z' }),
          ],
        }),
      ],
      hiredStageId: 'hired-stage',
      metrics: {
        kpis: {
          activeApplicants: 1,
          applicationsThisWeek: 2,
          avgTimeToHire: '3.00',
          highScoreApplicants: 4,
          hiredThisMonth: 5,
          openHeadcounts: 6,
          rejectedThisMonth: 7,
        },
        pipelineRecruiters: [{ recruiter: 'Ada', count: 2 }],
        pipelineStages: [{ stage: 'Applied', count: 3 }],
        scoreDistribution: [],
        timeSeries: [],
      },
      myAssignedApplicants: [makeApplicant({ status: 'Applied' })],
      myBacklogApplicants: [makeApplicant({ recruiterId: 'recruiter-1' })],
      recruiterId: 'recruiter-1',
    });

    expect(derived.averageTimeToHire).toBe(3);
    expect(derived.dashboardStats.totalOpenPositions).toBe(6);
    expect(derived.onProcessByRecruiter).toEqual({ Ada: 2 });
    expect(derived.onProcessByStage).toEqual({ Applied: 3 });
  });
});
