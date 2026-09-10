import { CANCELLABLE_UPLOAD_QUEUE_STATUSES } from './upload-queue-bulk-action-status';
import type { UploadQueueBulkActionClient, UploadQueueBulkJob } from './upload-queue-bulk-action-types';

const FINAL_UPLOAD_QUEUE_STATUSES = new Set(['success', 'error', 'failed', 'cancelled']);

export async function deleteUploadQueueBulkActionJob(client: UploadQueueBulkActionClient, job: UploadQueueBulkJob, itemId: string) {
  if (!FINAL_UPLOAD_QUEUE_STATUSES.has(job.status)) {
    if (CANCELLABLE_UPLOAD_QUEUE_STATUSES.has(job.status)) {
      await client.query(
        'UPDATE upload_queue SET status = $1, updated_at = now() WHERE id = $2',
        ['cancelled', itemId]
      );
    } else {
      await client.query('ROLLBACK');
      return { success: false, reason: 'Job is not in a deletable state' };
    }
  }

  await client.query('DELETE FROM upload_queue WHERE id = $1', [itemId]);
  await client.query('COMMIT');
  return { success: true };
}
