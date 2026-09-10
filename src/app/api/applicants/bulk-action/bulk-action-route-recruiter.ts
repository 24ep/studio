import { v4 as uuidv4 } from 'uuid';
import { broadcastApplicantUpdate } from '@/lib/simple-broadcaster';
import { canAssignRecruiter } from '@/lib/permissions';
import { partitionApplicantsByPermission } from './bulk-action-route-utils';
import type {
  BulkActionActionResult,
  BulkActionExecutionContext,
} from './bulk-action-route-types';

type ApplicantPermissionRow = {
  id: string;
  positionId?: string | null;
  recruiterId?: string | null;
};

export async function executeAssignRecruiterBulkAction(
  context: BulkActionExecutionContext
): Promise<BulkActionActionResult> {
  const { client, data, sessionUser, actingUserId, actingUserName } = context;

  if (data.newRecruiterId !== null && data.newRecruiterId !== undefined) {
    const recruiterCheck = await client.query('SELECT id FROM "User" WHERE id = $1 AND role = $2', [
      data.newRecruiterId,
      'Recruiter',
    ]);
    if (recruiterCheck.rows.length === 0) {
      throw new Error('Invalid recruiter ID or user is not a recruiter');
    }
  }

  const currentRecruiterResult = await client.query(
    'SELECT id, "recruiterId", "positionId", "statusId" FROM "Applicant" WHERE id = ANY($1::uuid[])',
    [data.applicantIds]
  );

  const {
    applicantsWithPermission,
    applicantsWithoutPermission,
  } = partitionApplicantsByPermission(currentRecruiterResult.rows as ApplicantPermissionRow[], (applicant) => {
    const recruiterPermission = canAssignRecruiter(sessionUser, applicant.recruiterId, actingUserId);
    return {
      allowed: recruiterPermission.canAssign,
      reason: recruiterPermission.reason,
    };
  });

  if (applicantsWithoutPermission.length > 0) {
    const deniedApplicants = applicantsWithoutPermission.map((applicant) => applicant.applicantId).join(', ');
    return {
      earlyExit: {
        status: 403,
        body: {
          message: `Forbidden: You don't have permission to assign recruiters for some Applicants. Denied Applicants: ${deniedApplicants}`,
          deniedApplicants: applicantsWithoutPermission,
        },
        audit: {
          level: 'WARN',
          message: `Bulk recruiter assignment denied for Applicants: ${deniedApplicants} by ${actingUserName}`,
        },
      },
    };
  }

  const assignRecruiterResult = await client.query(
    'UPDATE "Applicant" SET "recruiterId" = $1, "updatedAt" = NOW() WHERE id = ANY($2::uuid[]) RETURNING id',
    [data.newRecruiterId, applicantsWithPermission.map((applicant) => applicant.id)]
  );

  for (const applicant of applicantsWithPermission) {
    if (applicant.recruiterId !== data.newRecruiterId) {
      const transitionMessage = data.newRecruiterId
        ? `Recruiter assigned: ${data.newRecruiterId}`
        : 'Recruiter unassigned';

      await client.query(`
        INSERT INTO "TransitionRecord" (id, "applicant_id", "positionId", stage, notes, "actingUserId", date, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
      `, [
        uuidv4(),
        applicant.id,
        applicant.positionId,
        'Applied',
        transitionMessage,
        actingUserId,
      ]);

      broadcastApplicantUpdate({ ...applicant, recruiterId: data.newRecruiterId }, actingUserId);
    }
  }

  return {
    result: { updatedCount: assignRecruiterResult.rowCount },
    auditMessage: `Bulk assigned recruiter for ${assignRecruiterResult.rowCount} Applicants`,
  };
}
