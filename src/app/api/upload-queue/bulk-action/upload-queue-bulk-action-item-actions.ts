import { processSingleUploadQueueJob } from '@/lib/uploadQueueProcessor';
import type {
  UploadQueueBulkAction,
  UploadQueueBulkActionClient,
  UploadQueueBulkItemResult,
  UploadQueueBulkJob,
} from './upload-queue-bulk-action-types';
import { cancelUploadQueueBulkActionJob } from './upload-queue-bulk-action-cancel';
import { deleteUploadQueueBulkActionJob } from './upload-queue-bulk-action-delete';
import { retryUploadQueueBulkActionJob } from './upload-queue-bulk-action-retry';

export async function runUploadQueueBulkItemAction(
  client: UploadQueueBulkActionClient,
  itemId: string,
  action: UploadQueueBulkAction
): Promise<UploadQueueBulkItemResult> {
  const res = await client.query<UploadQueueBulkJob>('SELECT * FROM upload_queue WHERE id = $1', [itemId]);
  if (res.rows.length === 0) {
    await client.query('ROLLBACK');
    return { success: false, reason: 'Item not found' };
  }

  const job = res.rows[0];

  switch (action) {
    case 'process':
      return processQueuedJob(client, job);
    case 'retry':
      return retryUploadQueueBulkActionJob(client, job, itemId);
    case 'cancel':
      return cancelUploadQueueBulkActionJob(client, job, itemId);
    case 'delete':
      return deleteUploadQueueBulkActionJob(client, job, itemId);
  }
}

async function processQueuedJob(client: UploadQueueBulkActionClient, job: UploadQueueBulkJob) {
  if (job.status !== 'queued') {
    await client.query('ROLLBACK');
    return { success: false, reason: 'Job is not in a processable state (must be queued)' };
  }

  await processSingleUploadQueueJob(job, client);
  await client.query('COMMIT');
  return { success: true };
}
