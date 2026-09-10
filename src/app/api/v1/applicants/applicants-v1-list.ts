import { type NextRequest } from 'next/server';
import type { QueryResultRow } from 'pg';
import { getPool } from '@/lib/db';
import {
  SimpleErrorHandler,
  createInternalServerError,
} from '@/lib/errors';
import { normalizeFitScore } from '@/lib/scoreUtils';
import { requireV1ApplicantsUser } from './applicants-v1-auth';

type ApplicantV1ListRow = QueryResultRow & {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  positionId: string | null;
  recruiterId: string | null;
  sourceId: string | null;
  subSource: string | null;
  fitScore: number | null;
  statusName: string | null;
  applicationDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  positionTitle: string | null;
  positionDepartment: string | null;
  recruiterName: string | null;
  recruiterAvatarUrl: string | null;
  sourceName: string | null;
  sourceDescription: string | null;
  sourceEmail: string | null;
  sourceLogo: string | null;
};

type CountRow = QueryResultRow & {
  count: string;
};

function buildApplicantListQuery(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const offset = (page - 1) * limit;
  let whereClause = 'WHERE 1=1';
  const queryParams: unknown[] = [];

  if (search) {
    whereClause += ` AND (c.name ILIKE $${queryParams.length + 1} OR c.email ILIKE $${queryParams.length + 1})`;
    queryParams.push(`%${search}%`);
  }

  if (status) {
    whereClause += ` AND c."statusId" = $${queryParams.length + 1}`;
    queryParams.push(status);
  }

  return {
    page,
    limit,
    offset,
    whereClause,
    queryParams,
  };
}

function mapApplicantListRow(applicant: ApplicantV1ListRow) {
  return {
    id: applicant.id,
    name: applicant.name,
    email: applicant.email,
    phone: applicant.phone,
    avatarUrl: applicant.avatarUrl,
    positionId: applicant.positionId,
    recruiterId: applicant.recruiterId,
    sourceId: applicant.sourceId,
    subSource: applicant.subSource,
    fitScore: normalizeFitScore(applicant.fitScore),
    status: applicant.statusName || 'Applied',
    applicationDate: applicant.applicationDate,
    createdAt: applicant.createdAt,
    updatedAt: applicant.updatedAt,
    position: applicant.positionId ? {
      title: applicant.positionTitle,
      department: applicant.positionDepartment,
    } : null,
    recruiter: applicant.recruiterId ? {
      name: applicant.recruiterName,
      avatarUrl: applicant.recruiterAvatarUrl || null,
    } : null,
    source: applicant.sourceId ? {
      id: applicant.sourceId,
      name: applicant.sourceName,
      description: applicant.sourceDescription,
      email: applicant.sourceEmail,
      logo: applicant.sourceLogo,
    } : null,
  };
}

export async function handleListV1Applicants(request: NextRequest) {
  const authorization = await requireV1ApplicantsUser(request);
  if (!authorization.ok) {
    return authorization.response;
  }

  const listQuery = buildApplicantListQuery(new URL(request.url).searchParams);

  try {
    const client = await getPool().connect();

    try {
      const countResult = await client.query<CountRow>(
        `SELECT COUNT(*) FROM "Applicant" c ${listQuery.whereClause}`,
        listQuery.queryParams
      );
      const total = parseInt(countResult.rows[0].count, 10);

      const applicantsResult = await client.query<ApplicantV1ListRow>(
        `
          SELECT c.*, rs.name as "statusName", p.title as "positionTitle", p.department as "positionDepartment", r.name as "recruiterName", r."avatarUrl" as "recruiterAvatarUrl",
                 cs.name as "sourceName", cs.description as "sourceDescription", cs.email as "sourceEmail", cs.logo as "sourceLogo"
          FROM "Applicant" c
          LEFT JOIN "Position" p ON c."positionId" = p.id
          LEFT JOIN "User" r ON c."recruiterId" = r.id
          LEFT JOIN "ApplicantSource" cs ON c."sourceId" = cs.id
          LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
          ${listQuery.whereClause}
          ORDER BY c."createdAt" DESC
          LIMIT $${listQuery.queryParams.length + 1} OFFSET $${listQuery.queryParams.length + 2}
        `,
        [...listQuery.queryParams, listQuery.limit, listQuery.offset]
      );

      return SimpleErrorHandler.createSuccessResponse(request, {
        data: applicantsResult.rows.map(mapApplicantListRow),
        pagination: {
          page: listQuery.page,
          limit: listQuery.limit,
          total,
          totalPages: Math.ceil(total / listQuery.limit),
        },
      }, 200);
    } finally {
      client.release();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return SimpleErrorHandler.handleApiError(request, createInternalServerError(`Error fetching Applicants: ${errorMessage}`));
  }
}
