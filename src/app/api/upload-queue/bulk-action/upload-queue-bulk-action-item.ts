import type { Pool } from 'pg';
import type { UploadQueueBulkAction, UploadQueueBulkItemResult } from './upload-queue-bulk-action-types';
import { runUploadQueueBulkItemAction } from './upload-queue-bulk-action-item-actions';

export async function processUploadQueueBulkItem(
  itemId: string,
  action: UploadQueueBulkAction,
  pool: Pool
): Promise<UploadQueueBulkItemResult> {
  const client = await pool.connect();

  try {
    await client.query('SET statement_timeout = 600000');
    await client.query('BEGIN');
    return await runUploadQueueBulkItemAction(client, itemId, action);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error(`Failed to rollback transaction for item ${itemId}:`, rollbackError);
    }

    console.error(`Failed to process item ${itemId}:`, error);
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    try {
      await client.query('RESET statement_timeout');
    } catch (resetError) {
      console.error(`Failed to reset statement timeout for item ${itemId}:`, resetError);
    }
    client.release();
  }
}
