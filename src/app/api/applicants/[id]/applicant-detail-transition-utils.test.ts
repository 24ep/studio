import { describe, expect, it } from 'vitest';

import {
  buildRecruiterChangeTransitionMessage,
  fetchApplicantRecruiterChangeDetails,
  insertApplicantTransitionRecord,
  resolveApplicantTransitionPositionId,
} from './applicant-detail-transition-utils';

describe('applicant-detail-transition-utils', () => {
  it('builds recruiter change transition messages', () => {
    expect(buildRecruiterChangeTransitionMessage({
      oldRecruiterId: null,
      newRecruiterId: 'recruiter-1',
      newRecruiterName: 'Ada',
    })).toBe('Recruiter assigned: Ada');

    expect(buildRecruiterChangeTransitionMessage({
      oldRecruiterId: 'old-id',
      newRecruiterId: 'new-id',
      oldRecruiterName: 'Grace',
      newRecruiterName: 'Linus',
    })).toBe('Recruiter changed from Grace to Linus');

    expect(buildRecruiterChangeTransitionMessage({
      oldRecruiterId: 'old-id',
      newRecruiterId: null,
    })).toBe('Recruiter unassigned (was old-id)');

    expect(buildRecruiterChangeTransitionMessage({})).toBe('Recruiter assignment changed.');
  });

  it('fetches recruiter change names only when recruiter assignment changes', async () => {
    const queries: Array<{ query: string; values?: unknown[] }> = [];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        queries.push({ query, values });
        return {
          rows: [{ name: values?.[0] === 'old-rec' ? 'Old Recruiter' : 'New Recruiter' }],
        };
      },
    };

    await expect(fetchApplicantRecruiterChangeDetails({
      client,
      previousRecruiterId: 'old-rec',
      nextRecruiterId: 'new-rec',
    })).resolves.toEqual({
      recruiterChanged: true,
      oldRecruiterName: 'Old Recruiter',
      newRecruiterName: 'New Recruiter',
    });

    expect(queries.map(query => query.values)).toEqual([['old-rec'], ['new-rec']]);

    await expect(fetchApplicantRecruiterChangeDetails({
      client,
      previousRecruiterId: 'same-rec',
      nextRecruiterId: 'same-rec',
    })).resolves.toEqual({
      recruiterChanged: false,
      oldRecruiterName: null,
      newRecruiterName: null,
    });
  });

  it('resolves transition position ids with fallback and missing-position handling', async () => {
    const missingPositions: string[] = [];
    const client = {
      query: async (_query: string, values?: unknown[]) => ({
        rows: values?.[0] === 'missing-position' ? [] : [{ id: values?.[0] }],
      }),
    };

    await expect(resolveApplicantTransitionPositionId({
      client,
      requestedPositionId: undefined,
      fallbackPositionId: 'fallback-position',
    })).resolves.toBe('fallback-position');

    await expect(resolveApplicantTransitionPositionId({
      client,
      requestedPositionId: 'requested-position',
      fallbackPositionId: 'fallback-position',
    })).resolves.toBe('requested-position');

    await expect(resolveApplicantTransitionPositionId({
      client,
      requestedPositionId: 'missing-position',
      fallbackPositionId: 'fallback-position',
      onMissingPosition: (positionId) => missingPositions.push(positionId),
    })).resolves.toBeNull();

    expect(missingPositions).toEqual(['missing-position']);
  });

  it('inserts applicant transition records and broadcasts fetched transition data', async () => {
    const queries: Array<{ query: string; values?: unknown[] }> = [];
    const broadcasts: Array<{ payload: Record<string, unknown>; actingUserId: string }> = [];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        queries.push({ query, values });
        return query.includes('SELECT * FROM "TransitionRecord"')
          ? { rows: [{ id: 'transition-1', stage: 'Applied' }] }
          : { rows: [] };
      },
    };

    await expect(insertApplicantTransitionRecord({
      client,
      transitionId: 'transition-1',
      applicantId: 'applicant-1',
      positionId: 'position-1',
      stage: 'Applied',
      notes: 'Moved to applied',
      actingUserId: 'user-1',
      broadcastTransition: (payload, actingUserId) => {
        broadcasts.push({ payload, actingUserId });
      },
    })).resolves.toEqual({ id: 'transition-1', stage: 'Applied' });

    expect(queries[0].query).toContain('INSERT INTO "TransitionRecord"');
    expect(queries[0].values).toEqual([
      'transition-1',
      'applicant-1',
      'position-1',
      'Applied',
      'Moved to applied',
      'user-1',
    ]);
    expect(broadcasts).toEqual([{
      payload: {
        id: 'applicant-1',
        transition: { id: 'transition-1', stage: 'Applied' },
      },
      actingUserId: 'user-1',
    }]);
  });
});
