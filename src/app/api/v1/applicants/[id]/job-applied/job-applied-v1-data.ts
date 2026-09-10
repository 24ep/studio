import type { QueryResultRow } from 'pg';
import { getPool, type DbClient } from '@/lib/db';
import { getJobAppliedResponseData, normalizeJustification, type JobAppliedApplicantRow } from './job-applied-v1-format';
import type { JobAppliedInput } from './job-applied-v1-schema';

export type JobAppliedMutableApplicantRow = JobAppliedApplicantRow & {
  id: string;
  recruiterId: string | null;
  parsedData: Record<string, unknown> | null;
};

type JobAppliedApplicantQueryRow = QueryResultRow & JobAppliedApplicantRow;
type JobAppliedMutableApplicantQueryRow = QueryResultRow & JobAppliedMutableApplicantRow;
type PositionIdRow = QueryResultRow & { id: string };

type ApplicantAccessCheck = (applicant: JobAppliedMutableApplicantRow) => Response | null;

async function getClient() {
  return await getPool().connect();
}

export async function fetchApplicantJobApplied(applicantId: string) {
  const client = await getClient();

  try {
    const result = await client.query<JobAppliedApplicantQueryRow>(
      'SELECT id, "parsedData", "assignmentJustification" FROM "Applicant" WHERE id = $1',
      [applicantId]
    );

    return result.rows[0]
      ? { status: 'ok' as const, data: getJobAppliedResponseData(result.rows[0]) }
      : { status: 'not-found' as const };
  } finally {
    client.release();
  }
}

export async function fetchMutableApplicant(client: DbClient, applicantId: string) {
  const applicantResult = await client.query<JobAppliedMutableApplicantQueryRow>(
    'SELECT id, "parsedData", "recruiterId" FROM "Applicant" WHERE id = $1',
    [applicantId]
  );

  return applicantResult.rows[0];
}

async function ensurePositionExists(client: DbClient, jobId: string) {
  const positionResult = await client.query<PositionIdRow>('SELECT id FROM "Position" WHERE id = $1', [jobId]);
  return positionResult.rows.length > 0;
}

export async function updateApplicantJobApplied(
  applicantId: string,
  input: JobAppliedInput,
  checkAccess: ApplicantAccessCheck
) {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const applicant = await fetchMutableApplicant(client, applicantId);
    if (!applicant) {
      await client.query('ROLLBACK');
      return { status: 'applicant-not-found' as const };
    }

    const accessError = checkAccess(applicant);
    if (accessError) {
      await client.query('ROLLBACK');
      return { status: 'forbidden' as const, response: accessError };
    }

    const positionExists = await ensurePositionExists(client, input.jobId);
    if (!positionExists) {
      await client.query('ROLLBACK');
      return { status: 'position-not-found' as const, applicant };
    }

    const parsedData = applicant.parsedData || {};
    parsedData.job_applied = {
      fitScore: input.fitScore,
      jobId: input.jobId,
      justification: input.justification || [],
    };

    const justificationArray = normalizeJustification(input.justification);
    const updateResult = await client.query<JobAppliedApplicantQueryRow>(`
      UPDATE "Applicant" 
      SET "parsedData" = $1, "fitScore" = $2, "positionId" = $3, "assignmentJustification" = $4
      WHERE id = $5
      RETURNING *;
    `, [parsedData, input.fitScore, input.jobId, justificationArray.join('\n'), applicantId]);

    await client.query('COMMIT');

    return {
      status: 'updated' as const,
      applicant,
      data: getJobAppliedResponseData(updateResult.rows[0]),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteApplicantJobApplied(applicantId: string, checkAccess: ApplicantAccessCheck) {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const applicant = await fetchMutableApplicant(client, applicantId);
    if (!applicant) {
      await client.query('ROLLBACK');
      return { status: 'applicant-not-found' as const };
    }

    const accessError = checkAccess(applicant);
    if (accessError) {
      await client.query('ROLLBACK');
      return { status: 'forbidden' as const, response: accessError };
    }

    const parsedData = applicant.parsedData || {};
    if (parsedData.job_applied) {
      delete parsedData.job_applied;
    }

    await client.query(`
      UPDATE "Applicant" 
      SET "parsedData" = $1
      WHERE id = $2
      RETURNING *;
    `, [parsedData, applicantId]);
    await client.query('COMMIT');

    return { status: 'deleted' as const, applicant };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
