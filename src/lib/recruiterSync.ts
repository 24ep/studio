import { getPool } from '@/lib/db';

import {
  logApplicantRecruiterAssignment,
  logPositionRecruiterSyncCompletion,
} from './recruiterSyncAudit';
import {
  assignApplicantRecruiter,
  getRecruiterLabel,
  syncApplicantBatchesForPosition,
} from './recruiterSyncAssignments';
import {
  fetchApplicantPositionId,
  fetchApplicantRecruiter,
  fetchApplicantsForRecruiterSync,
  fetchPositionsWithApplicants,
  fetchRecruiterSyncPosition,
} from './recruiterSyncData';
import type { RecruiterSyncResult } from './recruiterSyncTypes';

export type { RecruiterSyncResult } from './recruiterSyncTypes';

/**
 * Syncs recruiter assignments for all Applicants of a specific position
 * @param positionId - The position ID to sync recruiters for
 * @param actingUserId - The user performing the sync
 * @param actingUserName - The name of the user performing the sync
 * @returns Promise<RecruiterSyncResult>
 */
export async function syncRecruiterForPosition(
  positionId: string,
  actingUserId: string,
  actingUserName: string
): Promise<RecruiterSyncResult> {
  void actingUserName;

  const client = await getPool().connect();
  const result = createRecruiterSyncResult(positionId);

  try {
    await client.query('BEGIN');

    const position = await fetchRecruiterSyncPosition(client, positionId);
    if (!position) {
      throw new Error('Position not found');
    }

    result.positionTitle = position.title;

    const applicants = await fetchApplicantsForRecruiterSync(client, positionId);
    await syncApplicantBatchesForPosition({
      actingUserId,
      applicants,
      client,
      position,
      result,
    });

    await client.query('COMMIT');

    logPositionRecruiterSyncCompletion({
      actingUserId,
      positionId,
      positionTitle: position.title,
      result,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    const errorMsg = `Failed to sync recruiters for position: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.error(errorMsg, error);
    throw error;
  } finally {
    client.release();
  }

  return result;
}

/**
 * Syncs recruiter assignments for all positions and their Applicants
 * @param actingUserId - The user performing the sync
 * @param actingUserName - The name of the user performing the sync
 * @returns Promise<RecruiterSyncResult[]>
 */
export async function syncAllRecruiter(
  actingUserId: string,
  actingUserName: string
): Promise<RecruiterSyncResult[]> {
  const client = await getPool().connect();
  const results: RecruiterSyncResult[] = [];

  try {
    const positions = await fetchPositionsWithApplicants(client);

    for (const position of positions) {
      try {
        results.push(await syncRecruiterForPosition(
          position.id,
          actingUserId,
          actingUserName
        ));
      } catch (error) {
        const errorMsg = `Failed to sync position ${position.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg, error);
        results.push({
          positionId: position.id,
          positionTitle: position.title,
          applicantsUpdated: 0,
          applicantsSkipped: 0,
          errors: [errorMsg],
        });
      }
    }
  } finally {
    client.release();
  }

  return results;
}

/**
 * Syncs recruiter for a single Applicant when their position's recruiter changes
 * @param applicantId - The Applicant ID to sync
 * @param positionId - The position ID (optional, will be fetched if not provided)
 * @param actingUserId - The user performing the sync
 * @param actingUserName - The name of the user performing the sync
 * @returns Promise<boolean> - True if sync was successful
 */
export async function syncRecruiterForApplicant(
  applicantId: string,
  positionId: string | null = null,
  actingUserId: string,
  actingUserName: string
): Promise<boolean> {
  void actingUserName;

  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const resolvedPositionId = positionId ?? await fetchApplicantPositionId(client, applicantId);
    if (!resolvedPositionId) {
      await client.query('COMMIT');
      return true;
    }

    const position = await fetchRecruiterSyncPosition(client, resolvedPositionId);
    if (!position) {
      throw new Error('Position not found');
    }

    const applicantRecord = await fetchApplicantRecruiter(client, applicantId);
    if (!applicantRecord) {
      throw new Error('Applicant not found');
    }

    if (applicantRecord.recruiterId !== null || !position.recruiterId) {
      await client.query('COMMIT');
      return true;
    }

    await assignApplicantRecruiter({
      actingUserId,
      applicantId,
      client,
      position,
      positionId: resolvedPositionId,
    });

    await client.query('COMMIT');

    await logApplicantRecruiterAssignment({
      actingUserId,
      applicantId,
      positionId: resolvedPositionId,
      recruiterId: position.recruiterId,
      recruiterLabel: getRecruiterLabel(position),
    });

    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to sync recruiter for Applicant:', error);
    return false;
  } finally {
    client.release();
  }
}

function createRecruiterSyncResult(positionId: string): RecruiterSyncResult {
  return {
    positionId,
    positionTitle: '',
    applicantsUpdated: 0,
    applicantsSkipped: 0,
    errors: [],
  };
}
