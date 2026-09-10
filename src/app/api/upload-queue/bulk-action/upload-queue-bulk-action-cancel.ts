import { CANCELLABLE_UPLOAD_QUEUE_STATUSES } from './upload-queue-bulk-action-status';
import type { UploadQueueBulkActionClient, UploadQueueBulkJob } from './upload-queue-bulk-action-types';

export async function cancelUploadQueueBulkActionJob(client: UploadQueueBulkActionClient, job: UploadQueueBulkJob, itemId: string) {
  if (!CANCELLABLE_UPLOAD_QUEUE_STATUSES.has(job.status)) {
    await client.query('ROLLBACK');
    return { success: false, reason: 'Job is not in a cancellable state' };
  }

  await client.query(
    'UPDATE upload_queue SET status = $1, updated_at = now() WHERE id = $2',
    ['cancelled', itemId]
  );
  await client.query('COMMIT');
  return { success: true };
}
