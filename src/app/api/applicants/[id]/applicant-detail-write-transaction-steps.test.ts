import { describe, expect, it, vi } from 'vitest';
import type { ApplicantDetailUpdateClient } from './applicant-detail-update-db';
import {
  applyApplicantUpdateMutation,
  buildApplicantUpdateSnapshot,
  type ExistingApplicantForUpdate,
} from './applicant-detail-write-transaction-steps';

vi.mock('./applicant-detail-update-auth', () => ({
  validateApplicantUpdateOwnershipAccess: vi.fn(),
}));

vi.mock('./applicant-detail-update-db', () => ({
  fetchExistingApplicantForUpdate: vi.fn(),
}));

describe('applicant-detail-write-transaction-steps', () => {
  it('derives the update snapshot from the existing applicant and request payload', () => {
    const existingApplicant = {
      id: 'applicant-1',
      name: 'Ada Lovelace',
      positionId: 'position-old',
      recruiterId: 'recruiter-old',
      statusId: 'screening',
      isPinned: false,
    } as ExistingApplicantForUpdate;

    expect(buildApplicantUpdateSnapshot({
      recruiterId: null,
      isPinned: true,
    }, existingApplicant)).toEqual({
      oldPositionId: 'position-old',
      oldRecruiterId: 'recruiter-old',
      oldStatus: 'screening',
      pinChangeRequested: true,
      requestedRecruiterId: null,
    });
  });

  it('throws when the applicant update mutation returns no rows', async () => {
    const calls: Array<{ query: string; values?: unknown[] }> = [];
    const client = {
      query: async (query: string, values?: unknown[]) => {
        calls.push({ query, values });
        return { rows: [] };
      },
      release: () => undefined,
    } as unknown as ApplicantDetailUpdateClient;

    await expect(applyApplicantUpdateMutation({
      actingUserId: 'user-1',
      applicantId: 'applicant-1',
      client,
      isRead: undefined,
      updatePayload: { name: 'Ada Updated' },
    })).rejects.toThrow('Failed to update Applicant - no rows returned');

    expect(calls).toHaveLength(1);
    expect(calls[0].query).toContain('UPDATE "Applicant"');
    expect(calls[0].values).toContain('Ada Updated');
  });
});
