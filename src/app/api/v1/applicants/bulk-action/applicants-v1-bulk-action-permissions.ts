import {
  canAssignRecruiter,
  canEditApplicant,
  canUpdateApplicantPipelineStage,
} from '@/lib/permissions';
import type { QueryResultRow } from 'pg';
import type {
  V1ApplicantsBulkAction,
  V1BulkActionApplicantPermissionRow,
  V1BulkActionUser,
} from './applicants-v1-bulk-action-types';

type V1BulkActionPermissionClient = {
  query: (query: string, values?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
};

export async function fetchV1BulkActionApplicants(client: V1BulkActionPermissionClient, applicantIds: string[]) {
  const result = await client.query(
    'SELECT id, "recruiterId" FROM "Applicant" WHERE id = ANY($1::uuid[])',
    [applicantIds]
  );
  return result.rows as V1BulkActionApplicantPermissionRow[];
}

export function splitApplicantsByActionPermission(
  user: V1BulkActionUser,
  action: V1ApplicantsBulkAction,
  applicants: V1BulkActionApplicantPermissionRow[]
) {
  const allowed: V1BulkActionApplicantPermissionRow[] = [];
  const denied: Array<{ applicantId: string; reason: string }> = [];

  for (const applicant of applicants) {
    if (hasApplicantPermission(user, action, applicant)) {
      allowed.push(applicant);
    } else {
      denied.push({
        applicantId: applicant.id,
        reason: 'No permission for this Applicant',
      });
    }
  }

  return { allowed, denied };
}

function hasApplicantPermission(
  user: V1BulkActionUser,
  action: V1ApplicantsBulkAction,
  applicant: V1BulkActionApplicantPermissionRow
) {
  switch (action) {
    case 'update_status':
      return canUpdateApplicantPipelineStage(user, applicant.recruiterId, user.id).canUpdate;
    case 'assign_recruiter':
      return canAssignRecruiter(user, applicant.recruiterId, user.id).canAssign;
    case 'assign_position':
      return canEditApplicant(user, applicant.recruiterId, user.id).canEdit;
    case 'delete':
      return true;
  }
}
