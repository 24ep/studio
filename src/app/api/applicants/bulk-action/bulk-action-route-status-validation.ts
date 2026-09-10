import { canUpdateApplicantPipelineStage } from '@/lib/permissions';

import {
  partitionApplicantsByPermission,
} from './bulk-action-route-utils';
import type { BulkActionExecutionContext } from './bulk-action-route-types';
import type { ApplicantPermissionRow, RecruitmentStageRow } from './bulk-action-route-status-types';

export async function getValidatedStageName(
  client: BulkActionExecutionContext['client'],
  newStatus: string
) {
  try {
    const statusCheck = await client.query<RecruitmentStageRow>(
      'SELECT id, name FROM "RecruitmentStage" WHERE id = $1::uuid',
      [newStatus]
    );

    return statusCheck.rows.length === 0
      ? { ok: false as const, status: 400, body: { message: 'Invalid status: Status must reference a valid recruitment stage' } }
      : { ok: true as const, name: statusCheck.rows[0]?.name };
  } catch (error) {
    console.error('Error validating status:', error);
    return { ok: false as const, status: 500, body: { message: 'Error validating status' } };
  }
}

export async function partitionStatusUpdateApplicants(context: BulkActionExecutionContext) {
  const { client, data, sessionUser, actingUserId } = context;
  const oldStatusesResult = await client.query<ApplicantPermissionRow>(
    'SELECT id, "statusId", "positionId", "recruiterId" FROM "Applicant" WHERE id = ANY($1::uuid[])',
    [data.applicantIds]
  );

  return partitionApplicantsByPermission(oldStatusesResult.rows, (applicant) => {
    const pipelinePermission = canUpdateApplicantPipelineStage(sessionUser, applicant.recruiterId, actingUserId);
    return {
      allowed: pipelinePermission.canUpdate,
      reason: pipelinePermission.reason,
    };
  });
}
