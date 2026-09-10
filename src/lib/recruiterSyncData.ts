import type { DbClient } from './db';
import type {
  RecruiterAssignmentTransitionInput,
  RecruiterSyncApplicantRow,
  RecruiterSyncPositionRow,
} from './recruiterSyncTypes';

export async function fetchRecruiterSyncPosition(
  client: DbClient,
  positionId: string
): Promise<RecruiterSyncPositionRow | null> {
  const positionResult = await client.query<RecruiterSyncPositionRow>(`
    SELECT p.id, p.title, p."recruiterId", u.name as "recruiterName"
    FROM "Position" p
    LEFT JOIN "User" u ON p."recruiterId" = u.id
    WHERE p.id = $1::uuid
  `, [positionId]);

  return positionResult.rows[0] || null;
}

export async function fetchApplicantsForRecruiterSync(
  client: DbClient,
  positionId: string
): Promise<RecruiterSyncApplicantRow[]> {
  const applicantsResult = await client.query<RecruiterSyncApplicantRow>(`
    SELECT c.id, c.name, c."recruiterId", u.name as "recruiterName"
    FROM "Applicant" c
    LEFT JOIN "User" u ON c."recruiterId" = u.id
    WHERE c."positionId" = $1::uuid
  `, [positionId]);

  return applicantsResult.rows;
}

export async function fetchPositionsWithApplicants(
  client: DbClient
): Promise<Array<Pick<RecruiterSyncPositionRow, 'id' | 'title'>>> {
  const positionsResult = await client.query<Pick<RecruiterSyncPositionRow, 'id' | 'title'>>(`
    SELECT DISTINCT p.id, p.title
    FROM "Position" p
    INNER JOIN "Applicant" c ON p.id = c."positionId"
  `);

  return positionsResult.rows;
}

export async function fetchApplicantPositionId(
  client: DbClient,
  applicantId: string
): Promise<string | null> {
  const applicantResult = await client.query<{ positionId: string | null }>(
    'SELECT "positionId" FROM "Applicant" WHERE id = $1::uuid',
    [applicantId]
  );

  if (applicantResult.rows.length === 0) {
    throw new Error('Applicant not found');
  }

  return applicantResult.rows[0].positionId;
}

export async function fetchApplicantRecruiter(
  client: DbClient,
  applicantId: string
): Promise<Pick<RecruiterSyncApplicantRow, 'recruiterId' | 'recruiterName'> | null> {
  const applicantResult = await client.query<Pick<RecruiterSyncApplicantRow, 'recruiterId' | 'recruiterName'>>(`
    SELECT c."recruiterId", u.name as "recruiterName"
    FROM "Applicant" c
    LEFT JOIN "User" u ON c."recruiterId" = u.id
    WHERE c.id = $1::uuid
  `, [applicantId]);

  return applicantResult.rows[0] || null;
}

export function updateApplicantRecruiter(
  client: DbClient,
  applicantId: string,
  recruiterId: string
) {
  return client.query(`
    UPDATE "Applicant"
    SET "recruiterId" = $1, "updatedAt" = NOW()
    WHERE id = $2::uuid
  `, [recruiterId, applicantId]);
}

export function insertRecruiterAssignmentTransition(
  client: DbClient,
  transitionId: string,
  input: RecruiterAssignmentTransitionInput
) {
  return client.query(`
    INSERT INTO "TransitionRecord" (id, "applicant_id", "positionId", stage, notes, "actingUserId", date, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW());
  `, [
    transitionId,
    input.applicantId,
    input.positionId,
    'Applied',
    `Recruiter auto-assigned from position: ${input.recruiterLabel}`,
    input.actingUserId,
  ]);
}
