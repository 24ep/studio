import type { UploadQueueBulkActionClient, UploadQueueBulkJob, UploadQueueIdRow } from './upload-queue-bulk-action-types';

const RETRYABLE_UPLOAD_QUEUE_STATUSES = new Set(['failed', 'success']);

export async function retryUploadQueueBulkActionJob(client: UploadQueueBulkActionClient, job: UploadQueueBulkJob, itemId: string) {
  if (!RETRYABLE_UPLOAD_QUEUE_STATUSES.has(job.status)) {
    await client.query('ROLLBACK');
    return { success: false, reason: 'Job is not in a retryable state' };
  }

  const currentRetryCount = job.webhook_payload?.retry_count || 0;
  if (currentRetryCount >= 3) {
    await client.query('ROLLBACK');
    return { success: false, reason: 'Cannot retry: maximum retry attempts (3) exceeded' };
  }

  const existingQueuedJob = await client.query<UploadQueueIdRow>(
    'SELECT id FROM upload_queue WHERE file_path = $1 AND status = $2 AND id != $3',
    [job.file_path, 'queued', itemId]
  );
  if (existingQueuedJob.rows.length > 0) {
    await client.query('ROLLBACK');
    return { success: false, reason: 'Cannot retry: there is already a queued job with the same file path' };
  }

  await client.query(
    `UPDATE upload_queue SET 
     status = $1, 
     error = NULL, 
     error_details = NULL, 
     completed_date = NULL,
     updated_at = now(),
     webhook_payload = jsonb_set(
       jsonb_set(
         COALESCE(webhook_payload, '{}'::jsonb), 
         '{retry_count}', 
         '${currentRetryCount + 1}'::jsonb
       ),
       '{processed_by_external_webhook}', 'false'::jsonb
     )
     WHERE id = $2`,
    ['queued', itemId]
  );

  await client.query('COMMIT');
  return { success: true };
}
