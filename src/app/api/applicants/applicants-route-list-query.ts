import { buildApplicantRouteWhereParts } from './applicants-route-list-where';
import type {
  ApplicantRouteListQueryClient,
  ApplicantRouteListUser,
} from './applicants-route-list-where';
import type { ApplicantRouteFilters } from './applicants-route-query-types';

interface ApplicantRouteListQueryInput {
  client: ApplicantRouteListQueryClient;
  filters: ApplicantRouteFilters;
  pinnedOnly: boolean;
  user: ApplicantRouteListUser;
  sortClause: string;
  limit: number;
  offset: number;
  hasPermission: (user: ApplicantRouteListUser, permission: string) => boolean;
  readSystemSetting: (key: string) => Promise<unknown>;
}

export interface ApplicantRouteListQueryParts {
  countQuery: string;
  countParams: unknown[];
  dataQuery: string;
  dataParams: unknown[];
  whereClause: string;
}

function buildCountQuery(whereClause: string) {
  return `
    SELECT COUNT(*) as total
    FROM "Applicant" c
    ${whereClause}
  `;
}

function buildDataQuery({
  whereClause,
  sortClause,
  readStatusUserParamIndex,
  limitParamIndex,
  offsetParamIndex,
}: {
  whereClause: string;
  sortClause: string;
  readStatusUserParamIndex: number;
  limitParamIndex: number;
  offsetParamIndex: number;
}) {
  return `
    SELECT
      c.id,
      c.name,
      c.email,
      c.phone,
      c."fitScore",
      c."statusId",
      rs.name as "status",
      c."applicationDate",
      c."updatedAt",
      c."positionId",
      c."recruiterId",
      c."sourceId",
      c."parsedData",
      c."avatarUrl",
      c."isPinned",
      c."pinnedAt",
      p.title as "positionTitle",
      u.name as "recruiterName",
      cs.name as "sourceName",
      c."isBlacklisted",
      ars.is_read as "isRead"
    FROM "Applicant" c
    LEFT JOIN "Position" p ON c."positionId" = p.id
    LEFT JOIN "User" u ON c."recruiterId" = u.id
    LEFT JOIN "ApplicantSource" cs ON c."sourceId" = cs.id
    LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
    LEFT JOIN "applicant_read_status" ars ON (c.id = ars.applicant_id AND ars.user_id = $${readStatusUserParamIndex})
    ${whereClause}
    ORDER BY
      ${sortClause}
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;
}

export async function buildApplicantRouteListQuery({
  client,
  filters,
  pinnedOnly,
  user,
  sortClause,
  limit,
  offset,
  hasPermission,
  readSystemSetting,
}: ApplicantRouteListQueryInput): Promise<ApplicantRouteListQueryParts> {
  const whereParts = await buildApplicantRouteWhereParts({
    client,
    filters,
    pinnedOnly,
    user,
    hasPermission,
    readSystemSetting,
  });
  let paramIndex = whereParts.nextParamIndex;
  const readStatusUserParamIndex = paramIndex++;
  const limitParamIndex = paramIndex++;
  const offsetParamIndex = paramIndex++;

  return {
    countQuery: buildCountQuery(whereParts.whereClause),
    countParams: whereParts.queryParams,
    dataQuery: buildDataQuery({
      whereClause: whereParts.whereClause,
      sortClause,
      readStatusUserParamIndex,
      limitParamIndex,
      offsetParamIndex,
    }),
    dataParams: [...whereParts.queryParams, user.id, limit, offset],
    whereClause: whereParts.whereClause,
  };
}
