import { type PositionApplicantsQueryOptions } from './position-applicants-route-types';

function applicantSelect(associationType: 'applied' | 'matched') {
  return `
    SELECT
      c.*,
      rs.name as "status",
      p.id as "positionId",
      p.title as "positionTitle",
      p.department as "positionDepartment",
      p."positionLevel" as "positionLevel",
      r.id as "recruiterId",
      r.name as "recruiterName", r."avatarUrl" as "recruiterAvatarUrl",
      '${associationType}' as association_type,
      COALESCE(th_data.history, '[]'::json) as "transitionHistory",
      COALESCE(jm_data.jobMatches, '[]'::json) as "jobMatches"
    FROM "Applicant" c
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
          'id', jm.id, 'jobId', jm."jobId", 'jobTitle', jm."jobTitle", 'fitScore', jm."fitScore",
          'matchReasons', jm."matchReasons", 'jobDescriptionSummary', jm."job_description_summary",
          'createdAt', jm."createdAt", 'updatedAt', jm."updatedAt"
        ) ORDER BY jm."fitScore" DESC
      ) AS jobMatches
      FROM "JobMatch" jm
      WHERE jm."applicant_id" = c.id
    ) AS jm_data ON true
  `;
}

function appliedWhere(filterClauses: string) {
  return `
    WHERE c."positionId" = $1
    AND ($2 = '' OR c.name ILIKE $3 OR c.email ILIKE $3)
    ${filterClauses}
  `;
}

function matchedWhere(filterClauses: string) {
  return `
    WHERE (c."positionId" IS NULL OR c."positionId" != $1)
    AND EXISTS (
      SELECT 1 FROM "JobMatch" jm
      WHERE jm."applicant_id" = c.id AND jm."jobId" = $1
    )
    AND ($2 = '' OR c.name ILIKE $3 OR c.email ILIKE $3)
    ${filterClauses}
  `;
}

function buildSingleAssociationQueries(
  options: PositionApplicantsQueryOptions,
  associationType: 'applied' | 'matched',
  limitParam: number,
  offsetParam: number
) {
  const whereClause = associationType === 'applied'
    ? appliedWhere(options.filterClauses)
    : matchedWhere(options.filterClauses);

  return {
    applicantsQuery: `
      ${applicantSelect(associationType)}
      ${whereClause}
      ORDER BY ${options.sortClause}
      LIMIT $${limitParam} OFFSET $${offsetParam};
    `,
    countQuery: `
      SELECT COUNT(*) as total
      FROM "Applicant" c
      LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
      ${whereClause};
    `,
  };
}

export function buildPositionApplicantsQueries(options: PositionApplicantsQueryOptions) {
  const baseParams = [options.positionId, options.searchTerm, options.searchPattern, ...options.filterValues];
  const limitParam = baseParams.length + 1;
  const offsetParam = baseParams.length + 2;
  const queryParams = [...baseParams, options.limit, options.offset];

  if (options.type === 'applied' || options.type === 'matched') {
    return {
      ...buildSingleAssociationQueries(options, options.type, limitParam, offsetParam),
      queryParams,
      countParams: baseParams,
    };
  }

  return {
    applicantsQuery: `
      WITH applied_applicants AS (
        ${applicantSelect('applied')}
        ${appliedWhere(options.filterClauses)}
      ),
      matched_applicants AS (
        ${applicantSelect('matched')}
        ${matchedWhere(options.filterClauses)}
      )
      SELECT * FROM (
        SELECT *, 1 as sort_order FROM applied_applicants
        UNION ALL
        SELECT *, 2 as sort_order FROM matched_applicants
      ) combined_results
      ORDER BY sort_order, ${options.sortClause}
      LIMIT $${limitParam} OFFSET $${offsetParam};
    `,
    countQuery: `
      WITH applied_applicants AS (
        SELECT c.id
        FROM "Applicant" c
        LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
        ${appliedWhere(options.filterClauses)}
      ),
      matched_applicants AS (
        SELECT c.id
        FROM "Applicant" c
        LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
        ${matchedWhere(options.filterClauses)}
      )
      SELECT (SELECT COUNT(*) FROM applied_applicants) + (SELECT COUNT(*) FROM matched_applicants) as total;
    `,
    queryParams,
    countParams: baseParams,
  };
}
