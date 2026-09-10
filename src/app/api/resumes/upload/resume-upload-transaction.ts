import { randomUUID } from 'crypto';
import type { QueryResultRow } from 'pg';
import { canUploadResumes, type SessionLikeUser } from '@/lib/permissions';
import type { DbClient } from '@/lib/db';

type ApplicantResumeUploadRow = QueryResultRow & {
  id: string;
  name: string | null;
  positionId: string | null;
  recruiterId: string | null;
};

export interface ResumeUploadTransactionInput {
  actingUserId: string;
  applicantId: string;
  bufferLength: number;
  client: DbClient;
  fileName: string;
  hasGlobalResumePermission: boolean;
  objectName: string;
  positionId: string;
  sessionUser: SessionLikeUser;
  sourceId: string | null;
  webhookPayload: unknown;
}

export interface ResumeUploadTransactionSuccess {
  applicant: ApplicantResumeUploadRow;
}

export type ResumeUploadTransactionResult =
  | { ok: true; value: ResumeUploadTransactionSuccess }
  | { ok: false; status: number; body: { message: string } };

async function fetchApplicantForResumeUpload(client: DbClient, applicantId: string) {
  const result = await client.query<ApplicantResumeUploadRow>(
    'SELECT id, name, "positionId", "recruiterId" FROM "Applicant" WHERE id = $1',
    [applicantId]
  );
  return result.rows[0] ?? null;
}

export async function commitResumeUploadTransaction({
  actingUserId,
  applicantId,
  bufferLength,
  client,
  fileName,
  hasGlobalResumePermission,
  objectName,
  positionId,
  sessionUser,
  sourceId,
  webhookPayload,
}: ResumeUploadTransactionInput): Promise<ResumeUploadTransactionResult> {
  await client.query('BEGIN');

  try {
    const applicant = await fetchApplicantForResumeUpload(client, applicantId);
    if (!applicant) {
      await client.query('ROLLBACK');
      return { ok: false, status: 404, body: { message: 'Applicant not found' } };
    }

    if (!hasGlobalResumePermission) {
      const resumePermission = canUploadResumes(sessionUser, applicant.recruiterId, actingUserId);
      if (!resumePermission.canUpload) {
        await client.query('ROLLBACK');
        return { ok: false, status: 403, body: { message: `Forbidden: ${resumePermission.reason}` } };
      }
    }

    await client.query(
      'UPDATE "Applicant" SET "resumePath" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *;',
      [objectName, applicantId]
    );

    await client.query(
      `INSERT INTO "Attachment" (id, "applicantId", "uploadedById", "filePath", "fileName", label, "isPrimary", "uploadedAt", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'Resume', true, NOW(), NOW(), NOW());`,
      [randomUUID(), applicantId, actingUserId, objectName, fileName]
    );

    await client.query(
      `INSERT INTO upload_queue (id, file_name, file_size, status, source, upload_id, created_by, file_path, webhook_payload, position_id, source_id, sub_source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        randomUUID(),
        fileName,
        bufferLength,
        'queued',
        'single',
        null,
        actingUserId,
        objectName,
        JSON.stringify(webhookPayload),
        positionId,
        sourceId,
        null,
      ]
    );

    await client.query('COMMIT');
    return { ok: true, value: { applicant } };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
