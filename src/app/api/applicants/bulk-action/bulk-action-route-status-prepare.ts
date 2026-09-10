import {
  buildHeadcountValidationErrorRejection,
  validateApplicantHiringStatusWithClient,
} from './bulk-action-route-utils';
import type { BulkActionExecutionContext } from './bulk-action-route-types';
import type {
  ApplicantPermissionRow,
  StatusUpdatePreparation,
} from './bulk-action-route-status-types';

export async function prepareStatusUpdateApplicants(
  context: BulkActionExecutionContext,
  applicantsToProcess: ApplicantPermissionRow[],
  stageName: string | undefined
): Promise<StatusUpdatePreparation> {
  const { client, data } = context;
  const headcountValidationResults: StatusUpdatePreparation['headcountValidationResults'] = [];
  const applicantsToUpdate: ApplicantPermissionRow[] = [];
  const applicantsToReject: Record<string, unknown>[] = [];

  if (stageName !== 'Hired') {
    applicantsToUpdate.push(...applicantsToProcess);
    return { headcountValidationResults, applicantsToUpdate, applicantsToReject };
  }

  for (const applicant of applicantsToProcess) {
    if (applicant.statusId === data.newStatus) {
      applicantsToUpdate.push(applicant);
      continue;
    }

    if (!applicant.positionId) {
      applicantsToReject.push({
        applicantId: applicant.id,
        reason: 'NO_POSITION',
        message: 'Applicant must be assigned to a position to be hired',
      });
      continue;
    }

    try {
      const validation = await validateApplicantHiringStatusWithClient(client, applicant.id, applicant.positionId);
      if (validation.canHire) {
        applicantsToUpdate.push(applicant);
        headcountValidationResults.push({
          applicantId: applicant.id,
          validation,
          willAutoAssign: validation.reason === 'VACANT_HEADCOUNT_AVAILABLE',
        });
      } else {
        applicantsToReject.push({
          applicantId: applicant.id,
          reason: validation.reason,
          message: validation.message,
          headcountStatus: validation.headcountStatus,
        });
      }
    } catch (error) {
      console.error(`Error validating headcount for Applicant ${applicant.id}:`, error);
      applicantsToReject.push(buildHeadcountValidationErrorRejection(applicant, error));
    }
  }

  return { headcountValidationResults, applicantsToUpdate, applicantsToReject };
}
