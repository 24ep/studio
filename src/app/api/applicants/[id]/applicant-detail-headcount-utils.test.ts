import { describe, expect, it, vi } from 'vitest';

import {
  assignApplicantHeadcountAfterHire,
  validateApplicantHeadcountForHire,
} from './applicant-detail-headcount-utils';

describe('applicant-detail-headcount-utils', () => {
  it('allows non-hired stage changes without headcount validation failure', async () => {
    const validateHiringStatus = vi.fn();
    const client = {
      query: async () => ({ rows: [{ name: 'Interviewing' }] }),
    };

    await expect(validateApplicantHeadcountForHire({
      client,
      applicantId: 'applicant-1',
      positionId: 'position-1',
      nextStatus: 'stage-1',
      previousStatus: 'stage-0',
      validateHiringStatus,
    })).resolves.toEqual({ ok: true });

    expect(validateHiringStatus).not.toHaveBeenCalled();
  });

  it('blocks hired status when no headcount is available', async () => {
    const client = {
      query: async () => ({ rows: [{ name: 'Hired' }] }),
    };

    await expect(validateApplicantHeadcountForHire({
      client,
      applicantId: 'applicant-1',
      positionId: 'position-1',
      nextStatus: 'hired-stage',
      previousStatus: 'stage-0',
      validateHiringStatus: async () => ({
        canHire: false,
        message: 'No headcount available',
        reason: 'NO_HEADCOUNT',
        headcountStatus: { available: 0 },
      }),
    })).resolves.toEqual({
      ok: false,
      status: 400,
      body: {
        message: 'No headcount available',
        reason: 'NO_HEADCOUNT',
        headcountStatus: { available: 0 },
      },
    });
  });

  it('assigns headcount after hired status with race revalidation', async () => {
    const validateHiringStatus = vi.fn(async () => ({
      canHire: true,
      message: 'OK',
      reason: 'VACANT_HEADCOUNT_AVAILABLE',
      headcountStatus: { available: 1 },
    }));
    const assignToHeadcount = vi.fn(async () => ({ assigned: true }));
    const client = {
      query: async () => ({ rows: [{ name: 'Hired' }] }),
    };

    await expect(assignApplicantHeadcountAfterHire({
      client,
      applicantId: 'applicant-1',
      positionId: 'position-1',
      nextStatus: 'hired-stage',
      previousStatus: 'stage-0',
      actingUserId: 'user-1',
      actingUserName: 'Ada',
      validateHiringStatus,
      assignToHeadcount,
    })).resolves.toEqual({
      ok: true,
      headcountAssignment: { assigned: true },
    });

    expect(validateHiringStatus).toHaveBeenCalledTimes(2);
    expect(assignToHeadcount).toHaveBeenCalledWith('applicant-1', 'position-1', 'user-1', 'Ada');
  });

  it('returns a race-condition failure when headcount disappears before assignment', async () => {
    const raceDetails: Record<string, unknown>[] = [];
    const validateHiringStatus = vi.fn()
      .mockResolvedValueOnce({
        canHire: true,
        message: 'OK',
        reason: 'VACANT_HEADCOUNT_AVAILABLE',
        headcountStatus: { available: 1 },
      })
      .mockResolvedValueOnce({
        canHire: false,
        message: 'Filled',
        reason: 'NO_HEADCOUNT',
        headcountStatus: { available: 0 },
      });
    const client = {
      query: async () => ({ rows: [{ name: 'Hired' }] }),
    };

    await expect(assignApplicantHeadcountAfterHire({
      client,
      applicantId: 'applicant-1',
      positionId: 'position-1',
      nextStatus: 'hired-stage',
      previousStatus: 'stage-0',
      actingUserId: 'user-1',
      actingUserName: 'Ada',
      validateHiringStatus,
      assignToHeadcount: async () => ({ assigned: true }),
      now: () => new Date('2026-01-01T00:00:00.000Z'),
      onRaceCondition: (details) => raceDetails.push(details),
    })).resolves.toEqual({
      ok: false,
      status: 400,
      body: {
        message: 'Headcount became unavailable: Filled',
        reason: 'NO_HEADCOUNT',
        headcountStatus: { available: 0 },
      },
    });

    expect(raceDetails[0]).toMatchObject({
      applicantId: 'applicant-1',
      positionId: 'position-1',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
  });
});
