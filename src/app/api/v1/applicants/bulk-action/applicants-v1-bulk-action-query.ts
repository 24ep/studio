import type { V1ApplicantsBulkActionInput } from './applicants-v1-bulk-action-types';

export function buildV1BulkActionQuery(input: V1ApplicantsBulkActionInput, applicantIds: string[]) {
  switch (input.action) {
    case 'delete':
      return {
        sql: 'DELETE FROM "Applicant" WHERE id = ANY($1::uuid[])',
        params: [applicantIds],
      };
    case 'update_status':
      return {
        sql: 'UPDATE "Applicant" SET "statusId" = $1 WHERE id = ANY($2::uuid[])',
        params: [input.data?.status, applicantIds],
      };
    case 'assign_recruiter':
      return {
        sql: 'UPDATE "Applicant" SET "recruiterId" = $1 WHERE id = ANY($2::uuid[])',
        params: [input.data?.recruiterId, applicantIds],
      };
    case 'assign_position':
      return {
        sql: 'UPDATE "Applicant" SET "positionId" = $1 WHERE id = ANY($2::uuid[])',
        params: [input.data?.positionId, applicantIds],
      };
  }
}
