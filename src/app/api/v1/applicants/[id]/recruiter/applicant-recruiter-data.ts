import { randomUUID } from 'crypto';
import { getPool } from '@/lib/db';
import type { QueryResultRow } from 'pg';

export type DbClient = {
  query: (query: string, values?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
  release: () => void;
};

export type ApplicantRecruiterRow = {
  id: string;
  name?: string;
  recruiterId: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
};

export type RecruiterRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

export function connectApplicantRecruiterClient() {
  return getPool().connect() as Promise<DbClient>;
}

export function serializeApplicantRecruiter(applicant: ApplicantRecruiterRow) {
  return {
    id: applicant.recruiterId,
    name: applicant.recruiterName,
    email: applicant.recruiterEmail,
  };
}

export async function fetchApplicantRecruiter(client: DbClient, applicantId: string) {
  const result = await client.query(
    `
      SELECT c.id, c."recruiterId", u.name as "recruiterName", u.email as "recruiterEmail"
      FROM "Applicant" c
      LEFT JOIN "User" u ON c."recruiterId" = u.id
      WHERE c.id = $1;
    `,
    [applicantId]
  );
  return result.rows[0] as ApplicantRecruiterRow | undefined;
}

export async function fetchApplicantForRecruiterUpdate(client: DbClient, applicantId: string) {
  const result = await client.query(
    'SELECT id, name, "recruiterId" FROM "Applicant" WHERE id = $1',
    [applicantId]
  );
  return result.rows[0] as ApplicantRecruiterRow | undefined;
}

export async function fetchRecruiterCandidate(client: DbClient, recruiterId: string) {
  const result = await client.query(
    'SELECT id, name, email, role FROM "User" WHERE id = $1::uuid',
    [recruiterId]
  );
  return result.rows[0] as RecruiterRow | undefined;
}

export async function updateApplicantRecruiter(client: DbClient, applicantId: string, recruiterId: string | null) {
  await client.query(
    'UPDATE "Applicant" SET "recruiterId" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *',
    [recruiterId, applicantId]
  );
}

export async function clearApplicantRecruiter(client: DbClient, applicantId: string) {
  await client.query(
    'UPDATE "Applicant" SET "recruiterId" = NULL, "updatedAt" = NOW() WHERE id = $1 RETURNING *',
    [applicantId]
  );
}

export async function fetchApplicantPositionId(client: DbClient, applicantId: string) {
  const result = await client.query(
    'SELECT "positionId", "statusId" FROM "Applicant" WHERE id = $1',
    [applicantId]
  );
  return result.rows[0]?.positionId as string | null | undefined;
}

export async function fetchRecruiterName(client: DbClient, recruiterId: string) {
  const result = await client.query('SELECT name FROM "User" WHERE id = $1', [recruiterId]);
  return result.rows[0]?.name as string | undefined;
}

export async function fetchUpdatedApplicantRecruiter(client: DbClient, applicantId: string) {
  const result = await client.query(
    `
      SELECT c.*, u.name as "recruiterName", u.email as "recruiterEmail"
      FROM "Applicant" c
      LEFT JOIN "User" u ON c."recruiterId" = u.id
      WHERE c.id = $1;
    `,
    [applicantId]
  );
  return result.rows[0] as ApplicantRecruiterRow;
}

export async function insertRecruiterTransition(
  client: DbClient,
  input: {
    applicantId: string;
    positionId: string | null | undefined;
    notes: string;
    actingUserId: string;
  }
) {
  await client.query(
    `
      INSERT INTO "TransitionRecord" (id, "applicant_id", "positionId", stage, notes, "actingUserId", date, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW());
    `,
    [randomUUID(), input.applicantId, input.positionId, 'Applied', input.notes, input.actingUserId]
  );
}
