import { getPool } from '@/lib/db';

export type EvaluateFitRecord = Record<string, unknown>;

export type EvaluateFitApplicant = EvaluateFitRecord & {
  id: string;
  name?: string | null;
  positionId?: string | null;
  recruiterId?: string | null;
  parsedData?: unknown;
};

export type EvaluateFitPosition = EvaluateFitRecord & {
  id: string;
  title?: string | null;
};

export type EvaluateFitClient = {
  query: (query: string, values?: unknown[]) => Promise<{ rows: EvaluateFitRecord[] }>;
  release: () => void;
};

export type EvaluateFitContext = {
  applicant: EvaluateFitApplicant;
  position: EvaluateFitPosition;
  resumesAndAttachments: EvaluateFitRecord[];
  existingJobMatches: EvaluateFitRecord[];
  interviewerEvaluations: EvaluateFitRecord[];
  recruiterComments: EvaluateFitRecord[];
};

export async function getEvaluateFitClient() {
  return await getPool().connect() as EvaluateFitClient;
}

export async function fetchApplicantForFitEvaluation(client: EvaluateFitClient, applicantId: string) {
  const applicantResult = await client.query(`
    SELECT 
      a.id,
      a.name,
      a.email,
      a.phone,
      a."statusId",
      a."positionId",
      a."recruiterId",
      a."fitScore",
      a."parsedData",
      a."customAttributes",
      a."assignmentJustification",
      a."educationData",
      a."experienceData",
      a."resumePath",
      a."applicationDate",
      rs.name as "stageName",
      u.name as "recruiterName"
    FROM "Applicant" a
    LEFT JOIN "RecruitmentStage" rs ON a."statusId" = rs.id
    LEFT JOIN "User" u ON a."recruiterId" = u.id
    WHERE a.id = $1
  `, [applicantId]);

  return (applicantResult.rows[0] as EvaluateFitApplicant | undefined) ?? null;
}

export async function fetchPositionForFitEvaluation(client: EvaluateFitClient, positionId: string) {
  const positionResult = await client.query(`
    SELECT
      p.id,
      p.title,
      p.department,
      p.description,
      p."positionLevel",
      p."matchCriteria",
      p."customAttributes",
      p."isOpen"
    FROM "Position" p
    WHERE p.id = $1
  `, [positionId]);

  return (positionResult.rows[0] as EvaluateFitPosition | undefined) ?? null;
}

export async function fetchFitEvaluationContextRows(client: EvaluateFitClient, applicantId: string) {
  const attachmentsResult = await client.query(`
    SELECT "fileName", "filePath", label, "isPrimary", "uploadedAt"
    FROM "Attachment"
    WHERE "applicantId" = $1
    ORDER BY "isPrimary" DESC, "uploadedAt" DESC
  `, [applicantId]);
  const matchesResult = await client.query(`
    SELECT jm."fitScore", jm."matchReasons", jm."jobTitle", jm."jobId", p.title as "positionTitle", p."matchCriteria"
    FROM "JobMatch" jm
    LEFT JOIN "Position" p ON jm."jobId" = p.id
    WHERE jm."applicant_id" = $1
    ORDER BY jm."fitScore" DESC NULLS LAST
    LIMIT 10
  `, [applicantId]);
  const evaluationsResult = await client.query(`
    SELECT ae."overallScore", ae.comments, ae.status, ae."completedAt", u.name as "evaluatorName"
    FROM "ApplicantEvaluation" ae
    LEFT JOIN "User" u ON ae."evaluatorId" = u.id
    WHERE ae."applicantId" = $1
    ORDER BY ae."completedAt" DESC NULLS LAST, ae."updatedAt" DESC
    LIMIT 10
  `, [applicantId]);
  const commentsResult = await client.query(`
    SELECT ac.content, ac."createdAt", u.name as "authorName"
    FROM "ApplicantComment" ac
    LEFT JOIN "User" u ON ac."authorId" = u.id
    WHERE ac."applicantId" = $1
    ORDER BY ac."createdAt" DESC
    LIMIT 10
  `, [applicantId]);

  return {
    resumesAndAttachments: attachmentsResult.rows,
    existingJobMatches: matchesResult.rows,
    interviewerEvaluations: evaluationsResult.rows,
    recruiterComments: commentsResult.rows,
  };
}

export async function buildFitEvaluationContext(
  client: EvaluateFitClient,
  applicant: EvaluateFitApplicant,
  position: EvaluateFitPosition
): Promise<EvaluateFitContext> {
  return {
    applicant,
    position,
    ...await fetchFitEvaluationContextRows(client, applicant.id),
  };
}
