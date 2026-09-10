import { describe, expect, it } from 'vitest';

import {
  buildDashboardClientResponseState,
  buildDashboardApplicantsUrl,
  getApiList,
  getDashboardBacklogApplicants,
} from './dashboard-client-data-utils';
import type { SafeFetchResult } from '@/lib/safe-fetch';

function safeResult<T>(data: T): SafeFetchResult<T> {
  return {
    data,
    error: null,
    ok: true,
    status: 200,
  };
}

function failedResult(error: string): SafeFetchResult<unknown> {
  return {
    data: null,
    error,
    ok: false,
    status: null,
  };
}

describe('dashboard client data utilities', () => {
  it('reads API lists from arrays or data envelopes', () => {
    const rows = [{ id: 'row-1' }];

    expect(getApiList(rows)).toBe(rows);
    expect(getApiList({ data: rows })).toBe(rows);
    expect(getApiList(null)).toEqual([]);
  });

  it('filters active backlog applicants using stage names or direct status', () => {
    const applicants = [
      { id: 'a1', statusId: 'stage-active' },
      { id: 'a2', status: 'Applied' },
      { id: 'a3', status: 'Rejected' },
    ];

    expect(getDashboardBacklogApplicants(applicants as never, {
      'stage-active': 'Screening',
    }).map(applicant => applicant.id)).toEqual(['a1', 'a2']);
  });

  it('builds the applicant URL for all-applicant and recruiter-scoped fetches', () => {
    expect(buildDashboardApplicantsUrl({
      canViewAllApplicants: true,
      userId: 'user-1',
    })).toBe('/api/applicants?limit=200');
    expect(buildDashboardApplicantsUrl({
      canViewAllApplicants: false,
      userId: 'user-1',
    })).toBe('/api/applicants?recruiterId=user-1&limit=200');
  });

  it('builds dashboard client state from successful endpoint responses', () => {
    const applicants = [
      { id: 'a1', statusId: 'screening' },
      { id: 'a2', status: 'Rejected' },
    ];
    const positions = [{ id: 'p1' }];
    const users = [{ id: 'u1' }];
    const metrics = {
      kpis: {
        activeApplicants: 1,
        applicationsThisWeek: 2,
        avgTimeToHire: '3.00',
        highScoreApplicants: 4,
        hiredThisMonth: 5,
        openHeadcounts: 6,
        rejectedThisMonth: 7,
      },
      pipelineRecruiters: [],
      pipelineStages: [],
      scoreDistribution: [],
      timeSeries: [],
    };

    const state = buildDashboardClientResponseState({
      applicantsRes: safeResult({ data: applicants }),
      canViewAllApplicants: true,
      canViewAllUsers: true,
      metricsRes: safeResult(metrics),
      positionsRes: safeResult({ data: positions }),
      stageNames: { screening: 'Screening' },
      usersRes: safeResult(users),
    });

    expect(state.fetchError).toBeNull();
    expect(state.nextFilteredApplicants?.map(applicant => applicant.id)).toEqual(['a1', 'a2']);
    expect(state.nextMyBacklogApplicants?.map(applicant => applicant.id)).toEqual(['a1']);
    expect(state.nextAllPositions?.map(position => position.id)).toEqual(['p1']);
    expect(state.nextAllUsers?.map(user => user.id)).toEqual(['u1']);
    expect(state.nextMetrics).toBe(metrics);
    expect(state.warnings).toEqual([]);
  });

  it('builds permission-aware dashboard client state from failed endpoint responses', () => {
    const state = buildDashboardClientResponseState({
      applicantsRes: failedResult('timeout'),
      canViewAllApplicants: false,
      canViewAllUsers: false,
      metricsRes: failedResult('metrics down'),
      positionsRes: failedResult('HTTP 500'),
      stageNames: {},
      usersRes: failedResult('No permission'),
    });

    expect(state.nextFilteredApplicants).toBeUndefined();
    expect(state.nextMyAssignedApplicants).toEqual([]);
    expect(state.nextAllUsers).toEqual([]);
    expect(state.nextAllPositions).toEqual([]);
    expect(state.fetchError).toBe('Failed to fetch Applicants: timeout. Failed to fetch positions: HTTP 500.');
    expect(state.warnings.map(warning => warning.endpoint)).toEqual([
      '/api/applicants',
      '/api/positions',
      '/api/dashboard/metrics',
    ]);
  });
});
