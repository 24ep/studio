import { getPool, type DbClient } from '@/lib/db';
import type { UpdateApplicantSourceInput } from './applicant-source-v1-schema';
import type { ApplicantSourceRow } from './applicant-source-v1-response';

export type { DbClient };

const SELECT_APPLICANT_SOURCE_QUERY = `
  SELECT c.id, c.name, c."sourceId", c."subSource",
         cs.name as "sourceName", cs.description as "sourceDescription", cs.email as "sourceEmail", cs.logo as "sourceLogo"
  FROM "Applicant" c
  LEFT JOIN "ApplicantSource" cs ON c."sourceId" = cs.id
  WHERE c.id = $1;
`;

const SELECT_EXISTING_APPLICANT_QUERY = 'SELECT id, name, "sourceId", "subSource" FROM "Applicant" WHERE id = $1';

const SELECT_UPDATED_APPLICANT_SOURCE_QUERY = `
  SELECT c.id, c.name, c."sourceId", c."subSource",
         cs.name as "sourceName", cs.description as "sourceDescription", cs.logo as "sourceLogo"
  FROM "Applicant" c
  LEFT JOIN "ApplicantSource" cs ON c."sourceId" = cs.id
  WHERE c.id = $1
`;

export async function connectApplicantSourceClient() {
  return getPool().connect();
}

export async function beginApplicantSourceTransaction(client: DbClient) {
  await client.query('BEGIN');
}

export async function commitApplicantSourceTransaction(client: DbClient) {
  await client.query('COMMIT');
}

export async function rollbackApplicantSourceTransaction(client: DbClient | null) {
  if (!client) {
    return;
  }

  try {
    await client.query('ROLLBACK');
  } catch (rollbackError) {
    console.error('Error rolling back applicant source transaction:', rollbackError);
  }
}

export function releaseApplicantSourceClient(client: DbClient | null) {
  if (client) {
    client.release();
  }
}

export async function fetchApplicantSource(client: DbClient, applicantId: string) {
  const applicantResult = await client.query<ApplicantSourceRow>(SELECT_APPLICANT_SOURCE_QUERY, [applicantId]);
  return applicantResult.rows[0] ?? null;
}

export async function fetchExistingApplicantSource(client: DbClient, applicantId: string) {
  const existingResult = await client.query<ApplicantSourceRow>(SELECT_EXISTING_APPLICANT_QUERY, [applicantId]);
  return existingResult.rows[0] ?? null;
}

export async function updateApplicantSourceFields(
  client: DbClient,
  applicantId: string,
  input: UpdateApplicantSourceInput,
) {
  const updateFields = [];
  const updateValues = [];
  let paramIndex = 1;

  if (input.sourceId !== undefined) {
    updateFields.push(`"sourceId" = $${paramIndex++}`);
    updateValues.push(input.sourceId);
  }

  if (input.subSource !== undefined) {
    updateFields.push(`"subSource" = $${paramIndex++}`);
    updateValues.push(input.subSource);
  }

  updateFields.push('"updatedAt" = NOW()');

  const updateQuery = `
    UPDATE "Applicant" 
    SET ${updateFields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING id, name, "sourceId", "subSource";
  `;
  updateValues.push(applicantId);

  const updateResult = await client.query<ApplicantSourceRow>(updateQuery, updateValues);
  return updateResult.rows[0];
}

export async function fetchUpdatedApplicantSource(client: DbClient, applicantId: string) {
  const updatedApplicantWithSource = await client.query<ApplicantSourceRow>(SELECT_UPDATED_APPLICANT_SOURCE_QUERY, [applicantId]);
  return updatedApplicantWithSource.rows[0];
}
