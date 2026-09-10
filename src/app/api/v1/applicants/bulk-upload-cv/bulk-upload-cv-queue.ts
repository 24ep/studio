import { v4 as uuidv4 } from 'uuid';
import { broadcastUploadQueueUpdate } from '@/app/api/upload-queue/sse/broadcastUploadQueueUpdate';
import { getPool } from '@/lib/db';
import type {
  AdditionalAttachmentPath,
  BulkUploadCvUser,
  ParsedBulkUploadCvRequest,
  StoredBulkUploadCvFile,
} from './bulk-upload-cv-types';

export function buildBulkUploadWebhookPayload(
  data: ParsedBulkUploadCvRequest,
  additionalAttachmentPaths: AdditionalAttachmentPath[]
) {
  return {
    targetPositionId: data.positionId,
    sourceId: data.sourceId,
    subSource: data.subSource,
    additionalAttachments: additionalAttachmentPaths.length > 0 ? additionalAttachmentPaths : null,
  };
}

export async function insertBulkUploadQueueJob(
  user: BulkUploadCvUser,
  data: ParsedBulkUploadCvRequest,
  storedFile: StoredBulkUploadCvFile,
  additionalAttachmentPaths: AdditionalAttachmentPath[]
) {
  const client = await getPool().connect();

  try {
    const webhookPayload = buildBulkUploadWebhookPayload(data, additionalAttachmentPaths);
    const result = await client.query(
      `INSERT INTO upload_queue (id, file_name, file_size, status, source, upload_id, created_by, file_path, webhook_payload, position_id, source_id, sub_source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        uuidv4(),
        data.file.name,
        storedFile.size,
        'queued',
        'bulk',
        storedFile.uploadId,
        user.id,
        storedFile.objectName,
        JSON.stringify(webhookPayload),
        webhookPayload.targetPositionId,
        data.sourceId,
        data.subSource,
      ]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
}

export async function broadcastBulkUploadQueueUpdate() {
  try {
    await broadcastUploadQueueUpdate();
  } catch (sseError) {
    console.error('Failed to broadcast upload queue update via SSE:', sseError);
  }
}
