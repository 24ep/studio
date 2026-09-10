import { getPool } from '@/lib/db';

export async function fetchApplicantExportData(applicantId: string) {
  const applicantResult = await getPool().query(`
    SELECT
      c.*,
      rs.name as "statusName",
      p.title as "positionTitle",
      p.department as "positionDepartment",
      u.name as "recruiterName"
    FROM "Applicant" c
    LEFT JOIN "Position" p ON c."positionId" = p.id
    LEFT JOIN "User" u ON c."recruiterId" = u.id
    LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
    WHERE c.id = $1::uuid
  `, [applicantId]);

  if (applicantResult.rows.length === 0) {
    return null;
  }

  const jobMatchesResult = await getPool().query(`
    SELECT
      jm.*,
      p.title as "positionTitle"
    FROM "JobMatch" jm
    LEFT JOIN "Position" p ON jm."jobId" = p.id
    WHERE jm."applicant_id" = $1::uuid
    ORDER BY jm."fitScore" DESC NULLS LAST
  `, [applicantId]);

  return {
    applicant: applicantResult.rows[0],
    jobMatches: jobMatchesResult.rows,
  };
}
