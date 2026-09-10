import type { QueryResultRow } from 'pg';
import type { DbClient } from '@/lib/db';
import type { ApplicantExportSourceRow } from './applicants-export-format';

type ApplicantExportQueryRow = QueryResultRow & ApplicantExportSourceRow;

export async function queryApplicantsForExport(
  client: DbClient,
  whereClause: string,
  queryParams: unknown[],
  isJobMatchEnabled: boolean
) {
  return client.query<ApplicantExportQueryRow>(
    `
      SELECT
        c.*,
        rs.name as status_name,
        p.title as position_title,
        u.name as recruiter_name
        ${isJobMatchEnabled ? `,
        COALESCE(
          json_agg(
            json_build_object(
              'jobTitle', jm."jobTitle",
              'fitScore', jm."fitScore",
              'matchReasons', jm."matchReasons",
              'jobDescriptionSummary', jm."job_description_summary"
            ) ORDER BY jm."fitScore" DESC NULLS LAST
          ) FILTER (WHERE jm.id IS NOT NULL),
          '[]'::json
        ) as job_matches` : ''}
      FROM "Applicant" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
      LEFT JOIN "User" u ON c."recruiterId" = u.id
      LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
      ${isJobMatchEnabled ? 'LEFT JOIN "JobMatch" jm ON c.id = jm."applicant_id"' : ''}
      ${whereClause}
      GROUP BY c.id, p.title, u.name, rs.name
      ORDER BY c."applicationDate" DESC
    `,
    queryParams
  );
}
