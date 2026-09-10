import { logAudit } from '@/lib/auditLog';
import { getV1BulkActionActorName } from './applicants-v1-bulk-action-auth';
import type { V1ApplicantsBulkActionInput, V1BulkActionUser } from './applicants-v1-bulk-action-types';

const AUDIT_ACTION = 'API:V1:Applicants:BulkAction';

export function logV1BulkActionDenied(
  user: V1BulkActionUser,
  action: string,
  deniedApplicantIds: string[]
) {
  return logAudit(
    'WARN',
    `Bulk ${action} denied for Applicants: ${deniedApplicantIds.join(', ')} by ${getV1BulkActionActorName(user)}`,
    AUDIT_ACTION,
    user.id
  );
}

export function logV1BulkActionMissingData(user: V1BulkActionUser, input: V1ApplicantsBulkActionInput) {
  return logAudit(
    'ERROR',
    `Bulk ${input.action} failed (missing ${getMissingFieldLabel(input.action)}) by ${getV1BulkActionActorName(user)}.`,
    AUDIT_ACTION,
    user.id,
    { applicantIds: input.applicantIds }
  );
}

export function logV1BulkActionSuccess(user: V1BulkActionUser, input: V1ApplicantsBulkActionInput, affectedCount: number | null) {
  return logAudit(
    'AUDIT',
    `Bulk action '${input.action}' performed by ${getV1BulkActionActorName(user)}. Affected: ${affectedCount}.`,
    AUDIT_ACTION,
    user.id,
    { action: input.action, applicantIds: input.applicantIds, data: input.data, affectedCount }
  );
}

export function logV1BulkActionFailure(user: V1BulkActionUser, input: V1ApplicantsBulkActionInput, error: Error) {
  return logAudit(
    'ERROR',
    `Bulk action '${input.action}' failed by ${getV1BulkActionActorName(user)}. Error: ${error.message}`,
    AUDIT_ACTION,
    user.id,
    { action: input.action, applicantIds: input.applicantIds, data: input.data, error: error.message }
  );
}

function getMissingFieldLabel(action: string) {
  if (action === 'update_status') {
    return 'status';
  }

  if (action === 'assign_recruiter') {
    return 'recruiterId';
  }

  return 'positionId';
}
