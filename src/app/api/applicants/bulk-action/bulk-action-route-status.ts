import { assignHeadcountsForHiredApplicants } from './bulk-action-route-status-headcount';
import { prepareStatusUpdateApplicants } from './bulk-action-route-status-prepare';
import {
  buildStatusPermissionDeniedExit,
  buildStatusUpdateAuditMessage,
} from './bulk-action-route-status-result';
import { updateApplicantStatuses } from './bulk-action-route-status-update';
import {
  getValidatedStageName,
  partitionStatusUpdateApplicants,
} from './bulk-action-route-status-validation';
import type {
  BulkActionActionResult,
  BulkActionExecutionContext,
} from './bulk-action-route-types';

export async function executeChangeStatusBulkAction(
  context: BulkActionExecutionContext
): Promise<BulkActionActionResult> {
  const { data, actingUserName } = context;
  const stage = await getValidatedStageName(context.client, data.newStatus!);
  if (!stage.ok) {
    return { earlyExit: { status: stage.status, body: stage.body } };
  }

  const {
    applicantsWithPermission,
    applicantsWithoutPermission,
  } = await partitionStatusUpdateApplicants(context);

  if (applicantsWithoutPermission.length > 0) {
    return {
      earlyExit: buildStatusPermissionDeniedExit({
        deniedApplicants: applicantsWithoutPermission,
        actingUserName,
      }),
    };
  }

  const {
    headcountValidationResults,
    applicantsToUpdate,
    applicantsToReject,
  } = await prepareStatusUpdateApplicants(context, applicantsWithPermission, stage.name);

  await updateApplicantStatuses(context, applicantsToUpdate);

  const {
    headcountAssignmentResults,
    autoCloseResults,
  } = await assignHeadcountsForHiredApplicants(
    context,
    applicantsToUpdate,
    applicantsToReject,
    headcountValidationResults,
    stage.name
  );

  return {
    result: {
      updatedCount: applicantsToUpdate.length,
      rejectedCount: applicantsToReject.length,
      headcountAssignments: headcountAssignmentResults,
      autoCloseResults,
      rejectedApplicants: applicantsToReject,
    },
    auditMessage: buildStatusUpdateAuditMessage({
      newStatus: data.newStatus,
      updatedCount: applicantsToUpdate.length,
      rejectedCount: applicantsToReject.length,
      autoCloseResults,
    }),
  };
}
