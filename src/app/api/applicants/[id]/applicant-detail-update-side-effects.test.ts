import { describe, expect, it } from 'vitest';

import {
  broadcastApplicantPositionHeadcountChanges,
  runApplicantTransitionSideEffects,
} from './applicant-detail-update-side-effects';

describe('applicant-detail-update-side-effects', () => {
  it('broadcasts position list and stats when status changes to or from Hired', async () => {
    const broadcasts: Array<unknown> = [];
    const client = {
      query: async () => ({
        rows: [{ total: '10', open: '7', closed: '3' }],
      }),
    };

    await broadcastApplicantPositionHeadcountChanges({
      client,
      previousStatus: 'applied-stage',
      nextStatus: 'hired-stage',
      getRecruitmentStageByName: async () => 'hired-stage',
      broadcastPositionListUpdated: () => broadcasts.push('list'),
      broadcastPositionStatisticsUpdated: (statistics) => broadcasts.push(statistics),
    });

    expect(broadcasts).toEqual([
      'list',
      { total: 10, open: 7, closed: 3 },
    ]);
  });

  it('skips position broadcasts when the status did not touch Hired', async () => {
    let queried = false;
    let broadcasted = false;

    await broadcastApplicantPositionHeadcountChanges({
      client: {
        query: async () => {
          queried = true;
          return { rows: [] };
        },
      },
      previousStatus: 'applied-stage',
      nextStatus: 'screening-stage',
      getRecruitmentStageByName: async () => 'hired-stage',
      broadcastPositionListUpdated: () => {
        broadcasted = true;
      },
      broadcastPositionStatisticsUpdated: () => {
        broadcasted = true;
      },
    });

    expect(queried).toBe(false);
    expect(broadcasted).toBe(false);
  });

  it('creates a status transition and sends recruiter notification', async () => {
    const queries: Array<{ query: string; values?: unknown[] }> = [];
    const broadcasts: Array<{ payload: Record<string, unknown>; actingUserId: string }> = [];
    const notifications: unknown[][] = [];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        queries.push({ query, values });
        if (query.includes('SELECT id FROM "Position"')) {
          return { rows: [{ id: values?.[0] }] };
        }
        if (query.includes('SELECT * FROM "TransitionRecord"')) {
          return { rows: [{ id: 'transition-1', stage: 'hired-stage' }] };
        }
        if (query.includes('FROM "Applicant" c')) {
          return {
            rows: [{
              name: 'Ada Lovelace',
              positionId: 'position-1',
              positionTitle: 'Engineer',
              recruiterId: 'recruiter-1',
            }],
          };
        }
        return { rows: [] };
      },
    };

    await runApplicantTransitionSideEffects({
      client,
      applicantId: 'applicant-1',
      requestedPositionId: undefined,
      fallbackPositionId: 'position-1',
      previousStatus: 'screening-stage',
      nextStatus: 'hired-stage',
      transitionNotes: 'Approved by panel',
      recruiterChanged: false,
      actingUserId: 'user-1',
      createTransitionId: () => 'transition-1',
      broadcastApplicantUpdate: (payload, actingUserId) => {
        broadcasts.push({ payload, actingUserId });
      },
      notifyApplicantStatusChange: async (...args) => {
        notifications.push(args);
      },
    });

    const insertQuery = queries.find(entry => entry.query.includes('INSERT INTO "TransitionRecord"'));
    expect(insertQuery?.values).toEqual([
      'transition-1',
      'applicant-1',
      'position-1',
      'hired-stage',
      'Approved by panel',
      'user-1',
    ]);
    expect(broadcasts).toEqual([{
      payload: {
        id: 'applicant-1',
        transition: { id: 'transition-1', stage: 'hired-stage' },
      },
      actingUserId: 'user-1',
    }]);
    expect(notifications).toEqual([[
      'applicant-1',
      'Ada Lovelace',
      'screening-stage',
      'hired-stage',
      'position-1',
      'Engineer',
      'recruiter-1',
      'user-1',
    ]]);
  });

  it('creates a recruiter-change transition when status is unchanged', async () => {
    const queries: Array<{ query: string; values?: unknown[] }> = [];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        queries.push({ query, values });
        if (query.includes('SELECT id FROM "Position"')) {
          return { rows: [{ id: values?.[0] }] };
        }
        if (query.includes('SELECT * FROM "TransitionRecord"')) {
          return { rows: [{ id: 'transition-2', stage: 'Applied' }] };
        }
        return { rows: [] };
      },
    };

    await runApplicantTransitionSideEffects({
      client,
      applicantId: 'applicant-1',
      requestedPositionId: 'position-1',
      fallbackPositionId: null,
      previousStatus: 'applied-stage',
      nextStatus: 'applied-stage',
      recruiterChanged: true,
      oldRecruiterId: 'old-rec',
      newRecruiterId: 'new-rec',
      oldRecruiterName: 'Old Recruiter',
      newRecruiterName: 'New Recruiter',
      actingUserId: 'user-1',
      createTransitionId: () => 'transition-2',
      broadcastApplicantUpdate: () => undefined,
      notifyApplicantStatusChange: async () => undefined,
    });

    const insertQuery = queries.find(entry => entry.query.includes('INSERT INTO "TransitionRecord"'));
    expect(insertQuery?.values).toEqual([
      'transition-2',
      'applicant-1',
      'position-1',
      'Applied',
      'Recruiter changed from Old Recruiter to New Recruiter',
      'user-1',
    ]);
  });
});
