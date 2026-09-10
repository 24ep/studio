import { getPool, type DbClient } from '@/lib/db';
import type { QueryResultRow } from 'pg';
import type { JobMatchDetailInput } from './job-match-detail-schema';
import type { FetchedJobMatch, JobMatchResponseBase } from './job-match-detail-response';

type FetchedJobMatchRow = QueryResultRow & FetchedJobMatch;
type JobMatchResponseRow = QueryResultRow & JobMatchResponseBase;
type DeletedJobMatchRow = QueryResultRow & Pick<JobMatchResponseBase, 'id'>;

export type { DbClient };

const SELECT_APPLICANT_QUERY = 'SELECT id FROM "Applicant" WHERE id = $1';

const SELECT_JOB_MATCH_QUERY = `
  SELECT jm.*, p.title as "positionTitle"
  FROM "JobMatch" jm
  LEFT JOIN "Position" p ON jm."jobId" = p.id
  WHERE jm.id = $1 AND jm."applicant_id" = $2;
`;

const SELECT_EXISTING_MATCH_QUERY = 'SELECT id FROM "JobMatch" WHERE id = $1 AND "applicant_id" = $2';

const UPDATE_JOB_MATCH_QUERY = `
  UPDATE "JobMatch"
  SET "fitScore" = $1, "jobId" = $2, "matchReasons" = $3, "updatedAt" = NOW()
  WHERE id = $4 AND "applicant_id" = $5
  RETURNING *
`;

const DELETE_JOB_MATCH_QUERY = 'DELETE FROM "JobMatch" WHERE id = $1 AND "applicant_id" = $2 RETURNING *';

export async function connectJobMatchDetailClient() {
  return getPool().connect();
}

export async function beginJobMatchDetailTransaction(client: DbClient) {
  await client.query('BEGIN');
}

export async function commitJobMatchDetailTransaction(client: DbClient) {
  await client.query('COMMIT');
}

export async function rollbackJobMatchDetailTransaction(client: DbClient | null) {
  if (!client) {
    return;
  }

  try {
    await client.query('ROLLBACK');
  } catch (rollbackError) {
    console.error('Error rolling back transaction:', rollbackError);
  }
}

export function releaseJobMatchDetailClient(client: DbClient | null) {
  if (!client) {
    return;
  }

  try {
    client.release();
  } catch (releaseError) {
    console.error('Error releasing database client:', releaseError);
  }
}

export async function applicantExists(client: DbClient, applicantId: string) {
  const applicantResult = await client.query(SELECT_APPLICANT_QUERY, [applicantId]);
  return applicantResult.rows.length > 0;
}

export async function jobMatchExists(client: DbClient, applicantId: string, matchId: string) {
  const existingMatchResult = await client.query(SELECT_EXISTING_MATCH_QUERY, [matchId, applicantId]);
  return existingMatchResult.rows.length > 0;
}

export async function fetchJobMatchDetail(client: DbClient, applicantId: string, matchId: string) {
  const jobMatchResult = await client.query<FetchedJobMatchRow>(SELECT_JOB_MATCH_QUERY, [matchId, applicantId]);
  return jobMatchResult.rows[0] ?? null;
}

export async function updateJobMatchDetail(
  client: DbClient,
  applicantId: string,
  matchId: string,
  input: JobMatchDetailInput,
) {
  const updateResult = await client.query<JobMatchResponseRow>(UPDATE_JOB_MATCH_QUERY, [
    input.fitScore,
    input.jobId,
    input.matchReasons,
    matchId,
    applicantId,
  ]);
  return updateResult.rows[0] ?? null;
}

export async function deleteJobMatchDetail(client: DbClient, applicantId: string, matchId: string) {
  const deleteResult = await client.query<DeletedJobMatchRow>(DELETE_JOB_MATCH_QUERY, [matchId, applicantId]);
  return deleteResult.rows[0] ?? null;
}
