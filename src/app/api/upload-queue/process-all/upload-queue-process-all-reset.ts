import type { DbClient } from '@/lib/db';
import { RECENT_PROCESSING_TIMEOUT_MINUTES, STUCK_JOB_TIMEOUT_HOURS } from '../process/upload-queue-process-settings';

export async function resetInterruptedUploadQueueJobs(client: DbClient, messages?: string[]) {
  const resetRes = await client.query(
    `UPDATE upload_queue 
     SET status = 'queued', process_date = NULL, updated_at = now(), error = 'Reset due to timeout'
     WHERE status = 'inprocess' 
     AND process_date < NOW() - INTERVAL '${STUCK_JOB_TIMEOUT_HOURS} hours'`
  );

  const resetCount = resetRes.rowCount ?? 0;
  if (messages && resetCount > 0) {
    messages.push(`Reset ${resetCount} stuck jobs`);
  }

  const longProcessingRes = await client.query(
    `UPDATE upload_queue 
     SET status = 'queued', process_date = NULL, updated_at = now(), error = 'Reset due to long processing time'
     WHERE status = 'inprocess' 
     AND process_date < NOW() - INTERVAL '30 minutes'
     AND process_date > NOW() - INTERVAL '${STUCK_JOB_TIMEOUT_HOURS} hours'`
  );

  const longProcessingCount = longProcessingRes.rowCount ?? 0;
  if (messages && longProcessingCount > 0) {
    messages.push(`Reset ${longProcessingCount} long-processing jobs`);
  }

  const recentProcessingRes = await client.query(
    `UPDATE upload_queue 
     SET status = 'queued', process_date = NULL, updated_at = now(), error = 'Reset due to recent processing'
     WHERE status = 'inprocess' 
     AND completed_date IS NOT NULL
     AND completed_date > NOW() - INTERVAL '${RECENT_PROCESSING_TIMEOUT_MINUTES} minutes'`
  );

  const recentProcessingCount = recentProcessingRes.rowCount ?? 0;
  if (messages && recentProcessingCount > 0) {
    messages.push(`Reset ${recentProcessingCount} recently completed jobs`);
  }
}

export async function resetInterruptedJobsWithTransaction(client: DbClient, messages: string[]) {
  await client.query('BEGIN');

  try {
    await resetInterruptedUploadQueueJobs(client, messages);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
