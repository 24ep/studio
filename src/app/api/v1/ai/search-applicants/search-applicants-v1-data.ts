import { getPool } from '@/lib/db';
import { generateMatchReasons } from './search-applicants-v1-match-reasons';

export type SearchApplicantsDetailOptions = {
  query: string;
  matchedApplicantIds: string[];
  aiReasoning?: string;
  positionId?: string;
  limit: number;
  offset: number;
};

type ApplicantSearchRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  fitScore: number | null;
  parsedData: Record<string, unknown> | null;
  customAttributes: Record<string, unknown> | null;
  applicationDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean | null;
  pinnedAt: Date | null;
  status: string | null;
  positionTitle: string | null;
  positionDepartment: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  sourceName: string | null;
  sourceLogo: string | null;
};

function buildApplicantSearchDetailQueries(positionId?: string) {
  const params: unknown[] = [];
  let paramIndex = 1;
  const matchedIdsParam = paramIndex++;
  params.push(null);

  let positionFilter = '';
  if (positionId) {
    positionFilter = ` AND c."positionId" = $${paramIndex++}`;
    params.push(positionId);
  }

  const limitParam = paramIndex++;
  const offsetParam = paramIndex++;

  const detailQuery = `
    SELECT 
      c.id,
      c.name,
      c.email,
      c.phone,
      c.fitScore,
      c.parsedData,
      c.customAttributes,
      c.applicationDate,
      c."createdAt",
      c."updatedAt",
      c."isPinned",
      c."pinnedAt",
      rs.name as status,
      p.title as positionTitle,
      p.department as positionDepartment,
      u.name as recruiterName,
      u.email as recruiterEmail,
      cs.name as sourceName,
      cs.logo as sourceLogo
    FROM "Applicant" c
    LEFT JOIN "RecruitmentStage" rs ON c."statusId" = rs.id
    LEFT JOIN "Position" p ON c."positionId" = p.id
    LEFT JOIN "User" u ON c."recruiterId" = u.id
    LEFT JOIN "ApplicantSource" cs ON c."sourceId" = cs.id
    WHERE c.id = ANY($${matchedIdsParam}::uuid[])${positionFilter}
    ORDER BY c."createdAt" DESC
    LIMIT $${limitParam} OFFSET $${offsetParam}
  `;

  const countQuery = `
    SELECT COUNT(*) as total
    FROM "Applicant" c
    WHERE c.id = ANY($${matchedIdsParam}::uuid[])${positionFilter}
  `;

  return { detailQuery, countQuery, params };
}

function formatApplicant(row: ApplicantSearchRow, query: string, aiReasoning?: string) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    fitScore: row.fitScore,
    matchReasons: generateMatchReasons(query, row, aiReasoning),
    parsedData: row.parsedData,
    customAttributes: row.customAttributes,
    applicationDate: row.applicationDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isPinned: row.isPinned,
    pinnedAt: row.pinnedAt,
    positionTitle: row.positionTitle,
    positionDepartment: row.positionDepartment,
    recruiterName: row.recruiterName,
    recruiterEmail: row.recruiterEmail,
    sourceName: row.sourceName,
    sourceLogo: row.sourceLogo,
  };
}

export async function fetchSearchApplicantDetails(options: SearchApplicantsDetailOptions) {
  const client = await getPool().connect();

  try {
    const { detailQuery, countQuery, params } = buildApplicantSearchDetailQueries(options.positionId);
    const filterParams = [...params];
    filterParams[0] = options.matchedApplicantIds;
    const detailParams = [...filterParams, options.limit, options.offset];

    const applicantResult = await client.query(detailQuery, detailParams);
    const countResult = await client.query(countQuery, filterParams);

    const applicants = (applicantResult.rows as ApplicantSearchRow[]).map(applicant =>
      formatApplicant(applicant, options.query, options.aiReasoning)
    );

    return {
      data: applicants,
      total: parseInt(countResult.rows[0].total, 10),
    };
  } finally {
    client.release();
  }
}
