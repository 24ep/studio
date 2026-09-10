import { v4 as uuidv4 } from 'uuid';
import { getPool, withDbTransaction, type DbClient } from '@/lib/db';
import type { JobMatchInput } from './job-matches-schema';

const SELECT_APPLICANT_QUERY = 'SELECT id FROM "Applicant" WHERE id = $1';

const SELECT_JOB_MATCHES_QUERY = `
  SELECT jm.*, p.title as "positionTitle"
  FROM "JobMatch" jm
  LEFT JOIN "Position" p ON jm."jobId" = p.id
  WHERE jm."applicant_id" = $1
  ORDER BY jm."fitScore" DESC;
`;

const INSERT_JOB_MATCH_QUERY = `
  INSERT INTO "JobMatch" (id, "applicant_id", "jobId", "fitScore", "matchReasons", "createdAt", "updatedAt")
  VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  RETURNING *
`;

const UPDATE_JOB_MATCH_QUERY = `
  UPDATE "JobMatch"
  SET "fitScore" = $1, "matchReasons" = $2, "updatedAt" = NOW()
  WHERE "applicant_id" = $3 AND "jobId" IS NOT DISTINCT FROM $4
  RETURNING *
`;

const CHECK_EXISTING_JOB_MATCH_QUERY = `
  SELECT id FROM "JobMatch" WHERE "applicant_id" = $1 AND "jobId" IS NOT DISTINCT FROM $2
`;

type JobMatchRow = {
  id: string;
  fitScore?: number | null;
  jobId?: string | null;
  matchReasons?: string[] | null;
  positionTitle?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

async function ensureApplicantExists(client: DbClient, applicantId: string) {
  const applicantResult = await client.query(SELECT_APPLICANT_QUERY, [applicantId]);
  if (applicantResult.rows.length === 0) {
    throw new Error('Applicant not found');
  }
}

function normalizeProcessedMatch(match: JobMatchRow) {
  return {
    id: match.id,
    fitScore: match.fitScore,
    jobId: match.jobId || null,
    matchReasons: match.matchReasons || [],
  };
}

function normalizeFetchedMatch(match: JobMatchRow) {
  return {
    ...normalizeProcessedMatch(match),
    positionTitle: match.positionTitle,
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
  };
}

async function upsertSingleJobMatch(client: DbClient, applicantId: string, match: JobMatchInput) {
  const jobId = match.jobId ?? null;
  const existingResult = await client.query(CHECK_EXISTING_JOB_MATCH_QUERY, [applicantId, jobId]);

  if (existingResult.rows.length > 0) {
    return client.query<JobMatchRow>(UPDATE_JOB_MATCH_QUERY, [
      match.fitScore ?? null,
      match.matchReasons || [],
      applicantId,
      jobId,
    ]);
  }

  return client.query<JobMatchRow>(INSERT_JOB_MATCH_QUERY, [
    uuidv4(),
    applicantId,
    jobId,
    match.fitScore ?? null,
    match.matchReasons || [],
  ]);
}

async function insertSingleJobMatch(client: DbClient, applicantId: string, match: JobMatchInput) {
  return client.query<JobMatchRow>(INSERT_JOB_MATCH_QUERY, [
    uuidv4(),
    applicantId,
    match.jobId ?? null,
    match.fitScore ?? null,
    match.matchReasons || [],
  ]);
}

export async function fetchApplicantJobMatches(applicantId: string) {
  const client = await getPool().connect();

  try {
    await ensureApplicantExists(client, applicantId);
    const jobMatchesResult = await client.query<JobMatchRow>(SELECT_JOB_MATCHES_QUERY, [applicantId]);
    return jobMatchesResult.rows.map(normalizeFetchedMatch);
  } finally {
    client.release();
  }
}

export async function upsertApplicantJobMatches(applicantId: string, jobMatches: JobMatchInput[] = []) {
  return withDbTransaction(async (client) => {
    await ensureApplicantExists(client, applicantId);

    const processedMatches = [];
    for (const match of jobMatches) {
      const result = await upsertSingleJobMatch(client, applicantId, match);
      processedMatches.push(normalizeProcessedMatch(result.rows[0]));
    }

    return processedMatches;
  });
}

export async function replaceApplicantJobMatches(applicantId: string, jobMatches: JobMatchInput[] = []) {
  return withDbTransaction(async (client) => {
    await ensureApplicantExists(client, applicantId);
    await client.query('DELETE FROM "JobMatch" WHERE "applicant_id" = $1', [applicantId]);

    const insertedMatches = [];
    for (const match of jobMatches) {
      const result = await insertSingleJobMatch(client, applicantId, match);
      insertedMatches.push(normalizeProcessedMatch(result.rows[0]));
    }

    return insertedMatches;
  });
}

export async function deleteApplicantJobMatches(applicantId: string) {
  return withDbTransaction(async (client) => {
    await ensureApplicantExists(client, applicantId);
    const deleteResult = await client.query('DELETE FROM "JobMatch" WHERE "applicant_id" = $1 RETURNING id', [applicantId]);
    return deleteResult.rowCount || 0;
  });
}
