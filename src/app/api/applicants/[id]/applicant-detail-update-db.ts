import type { QueryResultRow } from 'pg';
import { getPool, type DbClient } from '@/lib/db';

export type ApplicantDetailUpdateClient = DbClient;

type ExistingApplicantUpdateRow = QueryResultRow & {
  id: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function beginApplicantUpdateTransaction() {
  const client = await getPool().connect() as ApplicantDetailUpdateClient;
  if (!client) {
    throw new Error('Failed to get database connection from pool');
  }

  try {
    await client.query('SELECT 1');
  } catch (testError) {
    throw new Error(`Database connection test failed: ${getErrorMessage(testError)}`);
  }

  try {
    await client.query('BEGIN');
  } catch (beginError) {
    throw new Error(`Failed to begin database transaction: ${getErrorMessage(beginError)}`);
  }

  return client;
}

export async function fetchExistingApplicantForUpdate(client: ApplicantDetailUpdateClient, applicantId: string) {
  const existingResult = await client.query<ExistingApplicantUpdateRow>('SELECT * FROM "Applicant" WHERE id = $1::uuid', [applicantId]);
  return existingResult.rows[0] ?? null;
}
