import { getPool } from '@/lib/db';
import {
  TASKBOARD_QUERY_TIMEOUT,
  type DbClient,
  type TaskboardApplicantRow,
  type TaskboardPagination,
} from './taskboard-applicants-types';

export async function connectTaskboardApplicantClient() {
  const client = await getPool().connect() as DbClient;
  await client.query(`SET statement_timeout = '${TASKBOARD_QUERY_TIMEOUT}ms'`);
  return client;
}

export function fetchTaskboardApplicants(
  client: DbClient,
  input: {
    whereClause: string;
    queryParams: unknown[];
    pagination: TaskboardPagination;
    nextParamIndex: number;
  }
) {
  const dataQuery = `
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
      c."parsedData",
      c."avatarUrl",
      p.title as "positionTitle",
      u.name as "recruiterName"
    FROM "Applicant" c
    LEFT JOIN "Position" p ON c."positionId" = p.id
    LEFT JOIN "User" u ON c."recruiterId" = u.id
    LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
    ${input.whereClause}
    ORDER BY c."applicationDate" DESC
    LIMIT $${input.nextParamIndex} OFFSET $${input.nextParamIndex + 1}
  `;

  return client.query<TaskboardApplicantRow>(dataQuery, [
    ...input.queryParams,
    input.pagination.limit,
    input.pagination.offset,
  ]);
}
