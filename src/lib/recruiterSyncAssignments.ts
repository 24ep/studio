import { v4 as uuidv4 } from 'uuid';

import type { DbClient } from './db';
import { logApplicantRecruiterAssignmentFireAndForget } from './recruiterSyncAudit';
import {
  insertRecruiterAssignmentTransition,
  updateApplicantRecruiter,
} from './recruiterSyncData';
import type {
  RecruiterSyncApplicantRow,
  RecruiterSyncPositionRow,
  RecruiterSyncResult,
} from './recruiterSyncTypes';

const RECRUITER_SYNC_BATCH_SIZE = 50;
const RECRUITER_SYNC_BATCH_DELAY_MS = 10;

export async function syncApplicantBatchesForPosition({
  actingUserId,
  applicants,
  client,
  position,
  result,
}: {
  actingUserId: string;
  applicants: RecruiterSyncApplicantRow[];
  client: DbClient;
  position: RecruiterSyncPositionRow;
  result: RecruiterSyncResult;
}) {
  for (let index = 0; index < applicants.length; index += RECRUITER_SYNC_BATCH_SIZE) {
    const batch = applicants.slice(index, index + RECRUITER_SYNC_BATCH_SIZE);

    for (const applicant of batch) {
      await syncApplicantFromPosition({
        actingUserId,
        applicant,
        client,
        position,
        result,
      });
    }

    if (index + RECRUITER_SYNC_BATCH_SIZE < applicants.length) {
      await delay(RECRUITER_SYNC_BATCH_DELAY_MS);
    }
  }
}

export async function assignApplicantRecruiter({
  actingUserId,
  applicantId,
  client,
  position,
  positionId,
}: {
  actingUserId: string;
  applicantId: string;
  client: DbClient;
  position: RecruiterSyncPositionRow;
  positionId: string;
}) {
  if (!position.recruiterId) return;

  await updateApplicantRecruiter(client, applicantId, position.recruiterId);
  await insertRecruiterAssignmentTransition(client, uuidv4(), {
    actingUserId,
    applicantId,
    positionId,
    recruiterLabel: getRecruiterLabel(position),
  });
}

export function getRecruiterLabel(position: RecruiterSyncPositionRow) {
  return position.recruiterName || position.recruiterId || '';
}

async function syncApplicantFromPosition({
  actingUserId,
  applicant,
  client,
  position,
  result,
}: {
  actingUserId: string;
  applicant: RecruiterSyncApplicantRow;
  client: DbClient;
  position: RecruiterSyncPositionRow;
  result: RecruiterSyncResult;
}) {
  try {
    if (applicant.recruiterId !== null || !position.recruiterId) {
      result.applicantsSkipped++;
      return;
    }

    await assignApplicantRecruiter({
      actingUserId,
      applicantId: applicant.id,
      client,
      position,
      positionId: position.id,
    });

    result.applicantsUpdated++;

    logApplicantRecruiterAssignmentFireAndForget({
      actingUserId,
      applicantId: applicant.id,
      applicantName: applicant.name,
      positionId: position.id,
      recruiterId: position.recruiterId,
      recruiterLabel: getRecruiterLabel(position),
      source: 'RecruiterSync:Position',
    });
  } catch (error) {
    const errorMsg = `Failed to sync applicant ${applicant.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMsg);
    console.error(errorMsg, error);
  }
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
