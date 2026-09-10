import { type NextRequest } from 'next/server';
import type { QueryResultRow } from 'pg';
import { getPool } from '@/lib/db';
import {
  SimpleErrorHandler,
  createInternalServerError,
  createNotFoundError,
} from '@/lib/errors';
import { requireV1ApplicantUser } from './applicant-v1-detail-auth';
import { type V1ApplicantDetailContext } from './applicant-v1-detail-schema';

type ApplicantDetailRow = QueryResultRow & {
  customAttributes?: Record<string, unknown> | null;
  positionId?: string | null;
  positionTitle?: string | null;
  positionDepartment?: string | null;
  recruiterId?: string | null;
  recruiterName?: string | null;
  recruiterAvatarUrl?: string | null;
  sourceId?: string | null;
  sourceName?: string | null;
  sourceDescription?: string | null;
  sourceEmail?: string | null;
  sourceLogo?: string | null;
};

type JobMatchRow = QueryResultRow & {
  fitScore?: number | null;
  jobTitle?: string | null;
  positionTitle?: string | null;
};

type ResumeHistoryRow = QueryResultRow;

function shapeApplicantDetail(applicant: ApplicantDetailRow, jobMatches: JobMatchRow[], resumeHistory: ResumeHistoryRow[]) {
  return {
    ...applicant,
    custom_attributes: applicant.customAttributes || {},
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
    jobMatches: jobMatches.map((match) => ({
      ...match,
      fitScore: match.fitScore,
      jobTitle: match.jobTitle || match.positionTitle || null,
      positionTitle: match.positionTitle || match.jobTitle || null,
    })),
    resumeHistory,
  };
}

export async function handleGetV1Applicant(req: NextRequest, { params }: V1ApplicantDetailContext) {
  const authorization = await requireV1ApplicantUser(req);
  if (!authorization.ok) {
    return authorization.response;
  }

  const { id } = await params;
  const client = await getPool().connect();

  try {
    const applicantResult = await client.query<ApplicantDetailRow>(
      `
        SELECT c.*, p.title as "positionTitle", p.department as "positionDepartment", r.name as "recruiterName", r."avatarUrl" as "recruiterAvatarUrl",
               cs.name as "sourceName", cs.description as "sourceDescription", cs.email as "sourceEmail", cs.logo as "sourceLogo"
        FROM "Applicant" c
        LEFT JOIN "Position" p ON c."positionId" = p.id
        LEFT JOIN "User" r ON c."recruiterId" = r.id
        LEFT JOIN "ApplicantSource" cs ON c."sourceId" = cs.id
        WHERE c.id = $1;
      `,
      [id]
    );

    if (applicantResult.rows.length === 0) {
      return SimpleErrorHandler.handleApiError(req, createNotFoundError('Applicant not found'));
    }

    const [jobMatchesResult, resumeHistoryResult] = await Promise.all([
      client.query<JobMatchRow>(
        `
          SELECT
            jm.*,
            p.title as "positionTitle",
            p.department as "positionDepartment",
            p.description as "positionDescription"
          FROM "JobMatch" jm
          LEFT JOIN "Position" p ON jm."jobId" = p.id
          WHERE jm."applicant_id" = $1
          ORDER BY jm."fitScore" DESC;
        `,
        [id]
      ),
      client.query<ResumeHistoryRow>(
        `
          SELECT
            a.id,
            a."applicantId",
            a."filePath",
            a."fileName" as "originalFileName",
            a."uploadedAt" as "uploadedAt",
            a."uploadedAt" as "createdAt",
            a."uploadedById" as "uploadedByUserId",
            a."updatedAt",
            u.name as "uploadedByUserName"
          FROM "Attachment" a
          LEFT JOIN "User" u ON a."uploadedById" = u.id
          WHERE a."applicantId" = $1
          ORDER BY a."uploadedAt" DESC;
        `,
        [id]
      ),
    ]);

    return SimpleErrorHandler.createSuccessResponse(
      req,
      shapeApplicantDetail(applicantResult.rows[0], jobMatchesResult.rows, resumeHistoryResult.rows),
      200
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return SimpleErrorHandler.handleApiError(req, createInternalServerError(`Error fetching Applicant: ${errorMessage}`));
  } finally {
    client.release();
  }
}
