import { NextResponse } from 'next/server';
import { getSafeDbClient, type DbClient } from '@/lib/db';
import { RECENT_PROCESSING_TIMEOUT_MINUTES } from '../process/upload-queue-process-settings';
import { resetInterruptedUploadQueueJobs } from './upload-queue-process-all-reset';

type UploadQueueJobRow = Record<string, unknown>;

type ClaimBatchArgs = {
  maxConcurrent: number;
  messages: string[];
  processed: unknown[];
};

type ClaimBatchResult =
  | { ok: true; jobs: UploadQueueJobRow[] }
  | { ok: false; response: NextResponse };

async function claimQueuedJobs(client: DbClient, jobsToClaim: number) {
  return client.query<UploadQueueJobRow>(
    `UPDATE upload_queue
     SET status = 'inprocess', process_date = now(), updated_at = now()
     WHERE id IN (
       SELECT id FROM upload_queue 
       WHERE status = 'queued' 
       AND (
         source = 'reprocess' 
         OR webhook_payload->>'source' = 'reprocess'
         OR (
           file_path NOT IN (
             SELECT file_path FROM upload_queue 
             WHERE status = 'success'
             AND file_path IS NOT NULL
             AND file_path != ''
           )
           AND file_path IS NOT NULL
           AND file_path != ''
         )
       )
       AND (
         webhook_payload->>'processed_by_external_webhook' IS NULL
         OR webhook_payload->>'processed_by_external_webhook' = 'false'
         OR source = 'reprocess'
         OR webhook_payload->>'source' = 'reprocess'
       )
       AND (
         completed_date IS NULL
         OR completed_date < NOW() - INTERVAL '${RECENT_PROCESSING_TIMEOUT_MINUTES} minutes'
       )
       ORDER BY upload_date ASC LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [jobsToClaim]
  );
}

export async function claimUploadQueueBatch(args: ClaimBatchArgs): Promise<ClaimBatchResult> {
  const { maxConcurrent, messages, processed } = args;
  const selectionClient = await getSafeDbClient();

  try {
    await selectionClient.query('BEGIN');

    const countRes = await selectionClient.query(
      `SELECT id FROM upload_queue WHERE status = 'inprocess' FOR UPDATE SKIP LOCKED`
    );
    const currentInProgress = countRes.rowCount ?? 0;

    if (currentInProgress >= maxConcurrent) {
      await selectionClient.query('ROLLBACK');
      messages.push(`Max concurrent jobs running (${currentInProgress}/${maxConcurrent})`);
      return {
        ok: false,
        response: NextResponse.json({ processed_count: 0, processed, messages }, { status: 200 }),
      };
    }

    const availableSlots = maxConcurrent - currentInProgress;
    if (availableSlots <= 0) {
      await selectionClient.query('ROLLBACK');
      messages.push('No available slots for processing');
      return {
        ok: false,
        response: NextResponse.json({ processed_count: 0, processed, messages }, { status: 200 }),
      };
    }

    await resetInterruptedUploadQueueJobs(selectionClient);
    const claimRes = await claimQueuedJobs(selectionClient, availableSlots);
    await selectionClient.query('COMMIT');

    return { ok: true, jobs: claimRes.rows };
  } catch (error) {
    console.error('[Process-All] Error during job selection:', error);
    await selectionClient.query('ROLLBACK');
    messages.push(`Error selecting jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      ok: false,
      response: NextResponse.json({ processed_count: 0, processed, messages }, { status: 500 }),
    };
  } finally {
    selectionClient.release();
  }
}
