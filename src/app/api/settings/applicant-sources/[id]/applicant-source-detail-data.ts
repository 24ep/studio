import { getPool } from '@/lib/db';
import type { ApplicantSourceRow, UpdateApplicantSourceInput } from './applicant-source-detail-schema';
import { buildApplicantSourceUpdateQuery } from './applicant-source-detail-update';

const APPLICANT_SOURCE_SELECT = `
  SELECT
    id, name, description, email, logo, allow_sub_source as "allowSubSource",
    sort_order as "sortOrder", is_active as "isActive",
    "createdAt", "updatedAt"
  FROM "ApplicantSource"
`;

export async function fetchApplicantSourceById(id: string) {
  const result = await getPool().query(`${APPLICANT_SOURCE_SELECT} WHERE id = $1`, [id]);
  return result.rows[0] as ApplicantSourceRow | undefined;
}

export async function fetchApplicantSourceIdentity(id: string) {
  const result = await getPool().query('SELECT id, name FROM "ApplicantSource" WHERE id = $1', [id]);
  return result.rows[0] as Pick<ApplicantSourceRow, 'id' | 'name'> | undefined;
}

export async function applicantSourceNameExistsForOtherSource(name: string, id: string) {
  const result = await getPool().query(
    'SELECT id FROM "ApplicantSource" WHERE name = $1 AND id != $2',
    [name, id]
  );
  return result.rows.length > 0;
}

export async function updateApplicantSource(id: string, input: UpdateApplicantSourceInput) {
  const updateQuery = buildApplicantSourceUpdateQuery(input, id);
  if (!updateQuery) {
    return null;
  }

  const result = await getPool().query(updateQuery.sql, updateQuery.values);
  return result.rows[0] as ApplicantSourceRow;
}

export async function countApplicantsUsingSource(id: string) {
  const result = await getPool().query(
    'SELECT COUNT(*) as count FROM "Applicant" WHERE "sourceId" = $1',
    [id]
  );
  return Number.parseInt(result.rows[0].count, 10);
}

export function deleteApplicantSource(id: string) {
  return getPool().query('DELETE FROM "ApplicantSource" WHERE id = $1', [id]);
}
