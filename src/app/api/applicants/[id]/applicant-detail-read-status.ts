import type { QueryResultRow } from 'pg';

interface ApplicantReadStatusQueryClient {
  query: (query: string, values?: unknown[]) => Promise<{ rows: QueryResultRow[] }>;
}

type ApplicantReadStatusRow = QueryResultRow & {
  is_read: boolean | null;
};

interface ApplicantReadStatusUpdateInput {
  client: ApplicantReadStatusQueryClient;
  applicantId: string;
  userId: string;
  isRead: boolean;
}

interface ApplicantReadStatusActivity {
  stage: 'READ_STATUS_CHANGED';
  notes: string;
}

export function buildApplicantReadStatusActivity(
  nextReadStatus: boolean,
  previousReadStatus?: boolean | null
): ApplicantReadStatusActivity | null {
  if (previousReadStatus === nextReadStatus) return null;

  return {
    stage: 'READ_STATUS_CHANGED',
    notes: nextReadStatus ? 'Marked as read' : 'Marked as unread',
  };
}

export async function getApplicantReadStatus(
  client: ApplicantReadStatusQueryClient,
  applicantId: string,
  userId: string
) {
  const readStatusResult = await client.query(
    `SELECT "is_read" FROM "applicant_read_status" WHERE "applicant_id" = $1::uuid AND "user_id" = $2::uuid`,
    [applicantId, userId]
  );

  const row = readStatusResult.rows[0] as ApplicantReadStatusRow | undefined;
  return row?.is_read ?? null;
}

export async function updateApplicantReadStatus({
  client,
  applicantId,
  userId,
  isRead,
}: ApplicantReadStatusUpdateInput) {
  const previousReadStatus = await getApplicantReadStatus(client, applicantId, userId);
  const upsertReadStatusQuery = `
    INSERT INTO "applicant_read_status" ("id", "applicant_id", "user_id", "is_read", "read_at", "created_at", "updated_at")
    VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3, ${isRead ? 'NOW()' : 'NULL'}, NOW(), NOW())
    ON CONFLICT ("applicant_id", "user_id")
    DO UPDATE SET "is_read" = $3, "read_at" = ${isRead ? 'NOW()' : 'NULL'}, "updated_at" = NOW()
    RETURNING "is_read";
  `;

  await client.query(upsertReadStatusQuery, [applicantId, userId, isRead]);

  const readStatusActivity = buildApplicantReadStatusActivity(isRead, previousReadStatus);
  if (readStatusActivity) {
    await client.query(`
      INSERT INTO "TransitionRecord" ("id", "applicant_id", "date", "stage", "notes", "actingUserId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1::uuid, NOW(), $2, $3, $4::uuid, NOW(), NOW())
    `, [applicantId, readStatusActivity.stage, readStatusActivity.notes, userId]);
  }

  return isRead;
}
