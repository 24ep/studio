import type {
  PositionJobMatchesQuery,
  PositionJobMatchesQueryInput,
} from './position-job-matches-schema';

export function buildPositionJobMatchesQuery(input: PositionJobMatchesQueryInput): PositionJobMatchesQuery {
  const whereConditions = ['jm."jobId" = $1'];
  const params: unknown[] = [input.positionId];
  let paramIndex = 2;

  if (input.filters.notApplied) {
    whereConditions.push('(c."positionId" IS NULL OR c."positionId" != $1)');
  }

  if (input.filters.hasJobMatch) {
    whereConditions.push('jm."fitScore" > 0');
  }

  if (input.filters.searchTerm) {
    whereConditions.push(`(c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`);
    params.push(`%${input.filters.searchTerm}%`);
    paramIndex++;
  }

  const whereClause = whereConditions.join(' AND ');
  const applicantsQuery = `
    SELECT
      c.*,
      c."isPinned",
      c."pinnedAt",
      rs.name as "statusName",
      p.id as "positionId",
      p.title as "positionTitle",
      p.department as "positionDepartment",
      p."positionLevel" as "positionLevel",
      r.id as "recruiterId",
      r.name as "recruiterName", r."avatarUrl" as "recruiterAvatarUrl",
      jm."fitScore" as "matchScore",
      jm."matchReasons" as "matchReasons",
      jm.id as "jobMatchId",
      COALESCE(th_data.history, '[]'::json) as "transitionHistory",
      COALESCE(jm_data.jobMatches, '[]'::json) as "jobMatches"
    FROM "Applicant" c
    INNER JOIN "JobMatch" jm ON c.id = jm."applicant_id"
    LEFT JOIN "Position" p ON c."positionId" = p.id
    LEFT JOIN "User" r ON c."recruiterId" = r.id
    LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
    LEFT JOIN LATERAL (
      SELECT json_agg(
        json_build_object(
          'id', th.id, 'date', th.date, 'stage', th.stage, 'notes', th.notes
        ) ORDER BY th.date DESC
      ) AS history
      FROM "TransitionRecord" th
      WHERE th."applicant_id" = c.id
    ) AS th_data ON true
    LEFT JOIN LATERAL (
      SELECT json_agg(
        json_build_object(
          'id', jm2.id, 'jobId', jm2."jobId", 'jobTitle', jm2."jobTitle", 'fitScore', jm2."fitScore",
          'matchReasons', jm2."matchReasons", 'jobDescriptionSummary', jm2."job_description_summary",
          'createdAt', jm2."createdAt", 'updatedAt', jm2."updatedAt"
        ) ORDER BY jm2."fitScore" DESC
      ) AS jobMatches
      FROM "JobMatch" jm2
      WHERE jm2."applicant_id" = c.id
    ) AS jm_data ON true
    WHERE ${whereClause}
    ORDER BY ${input.sort.sortClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
  `;

  const countQuery = `
    SELECT COUNT(DISTINCT c.id) as total
    FROM "Applicant" c
    INNER JOIN "JobMatch" jm ON c.id = jm."applicant_id"
    WHERE ${whereClause};
  `;

  return {
    applicantsQuery,
    countQuery,
    dataParams: [...params, input.pagination.limit, input.pagination.offset],
    countParams: params,
  };
}
