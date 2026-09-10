import { v4 as uuidv4 } from 'uuid';
import { broadcastApplicantStatusChanged, broadcastApplicantUpdate } from '@/lib/simple-broadcaster';

import type { BulkActionExecutionContext } from './bulk-action-route-types';
import type { ApplicantPermissionRow } from './bulk-action-route-status-types';

export async function updateApplicantStatuses(
  context: BulkActionExecutionContext,
  applicantsToUpdate: ApplicantPermissionRow[]
) {
  const { client, data, actingUserId } = context;
  if (applicantsToUpdate.length === 0) {
    return;
  }

  await client.query(
    'UPDATE "Applicant" SET "statusId" = $1, "updatedAt" = NOW() WHERE id = ANY($2::uuid[]) RETURNING id',
    [data.newStatus, applicantsToUpdate.map((applicant) => applicant.id)]
  );

  for (const applicant of applicantsToUpdate) {
    if (applicant.statusId !== data.newStatus) {
      await createTransitionRecordAndBroadcast(context, applicant);
    }
  }
}

async function createTransitionRecordAndBroadcast(
  context: BulkActionExecutionContext,
  applicant: ApplicantPermissionRow
) {
  const { client, data, actingUserId } = context;
  const newTransitionId = uuidv4();

  await client.query(
    'INSERT INTO "TransitionRecord" (id, "applicant_id", stage, notes, "actingUserId", date, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())',
    [newTransitionId, applicant.id, data.newStatus, data.transitionNotes || null, actingUserId]
  );

  const transitionResult = await client.query('SELECT * FROM "TransitionRecord" WHERE id = $1', [newTransitionId]);
  if (transitionResult.rows.length === 0) {
    return;
  }

  const updatedApplicant = { ...applicant, status: data.newStatus };
  broadcastApplicantUpdate(updatedApplicant, actingUserId);

  if (applicant.statusId) {
    broadcastApplicantStatusChanged(updatedApplicant, applicant.statusId, String(data.newStatus), actingUserId);
  }
}
