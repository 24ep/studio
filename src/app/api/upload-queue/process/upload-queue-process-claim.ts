import { NextResponse } from 'next/server';
import type { DbClient } from '@/lib/db';
import { buildAutoRetryCondition, getMaxConcurrentProcessors, RECENT_PROCESSING_TIMEOUT_MINUTES, STUCK_JOB_TIMEOUT_HOURS } from './upload-queue-process-settings';

export type UploadQueueProcessJob = Record<string, unknown> & {
  id: string;
  file_path: string;
  source?: string | null;
  webhook_payload?: Record<string, unknown> | null;
};

type CountRow = {
  count: string | number;
};

export type ClaimUploadQueueJobResult =
  | { ok: true; job: UploadQueueProcessJob }
  | { ok: false; response: NextResponse };

async function resetStuckJobs(client: DbClient): Promise<void> {
  await client.query(
    `UPDATE upload_queue
     SET status = 'queued', process_date = NULL, updated_at = now(), error = 'Reset due to timeout'
     WHERE status = 'inprocess'
     AND process_date < NOW() - INTERVAL '${STUCK_JOB_TIMEOUT_HOURS} hours'`
  );

  await client.query(
    `UPDATE upload_queue
     SET status = 'queued', process_date = NULL, updated_at = now(), error = 'Reset due to long processing time'
     WHERE status = 'inprocess'
     AND process_date < NOW() - INTERVAL '30 minutes'
     AND process_date > NOW() - INTERVAL '${STUCK_JOB_TIMEOUT_HOURS} hours'`
  );

  await client.query(
    `UPDATE upload_queue
     SET status = 'queued', process_date = NULL, updated_at = now(), error = 'Reset due to recent processing'
     WHERE status = 'inprocess'
     AND completed_date IS NOT NULL
     AND completed_date > NOW() - INTERVAL '${RECENT_PROCESSING_TIMEOUT_MINUTES} minutes'`
  );
}

async function getQueuedJobsResponse(client: DbClient): Promise<NextResponse | null> {
  const queuedJobsCheck = await client.query<CountRow>(
    `SELECT COUNT(*) as count FROM upload_queue WHERE status = 'queued'`
  );
  const queuedJobsCount = parseInt(String(queuedJobsCheck.rows[0].count), 10);

  if (queuedJobsCount > 0) {
    return null;
  }

  const failedJobsCheck = await client.query<CountRow>(
    `SELECT COUNT(*) as count FROM upload_queue WHERE status = 'failed'`
  );
  const failedJobsCount = parseInt(String(failedJobsCheck.rows[0].count), 10);

  return NextResponse.json({
    message: 'No queued jobs available',
    failed_jobs_count: failedJobsCount,
    note: failedJobsCount > 0 ? 'Failed jobs can be manually retried by setting source to "reprocess"' : null,
  }, { status: 200 });
}

async function claimJob(client: DbClient) {
  const autoRetryCondition = await buildAutoRetryCondition();

  return client.query<UploadQueueProcessJob>(
    `UPDATE upload_queue
     SET status = 'inprocess', process_date = now(), updated_at = now(), retry_count = CASE WHEN status = 'failed' THEN retry_count + 1 ELSE retry_count END
     WHERE id = (
       SELECT id FROM upload_queue
       WHERE
       (
         status = 'queued'
         OR
         ${autoRetryCondition}
       )
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
         completed_date IS NULL
         OR completed_date < NOW() - INTERVAL '${RECENT_PROCESSING_TIMEOUT_MINUTES} minutes'
       )
       ORDER BY
         CASE WHEN status = 'queued' THEN 0 ELSE 1 END,
         upload_date ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`
  );
}

export async function claimNextUploadQueueJob(client: DbClient): Promise<ClaimUploadQueueJobResult> {
  await client.query('BEGIN');

  try {
    const maxConcurrent = await getMaxConcurrentProcessors();
    const countRes = await client.query(
      `SELECT id FROM upload_queue WHERE status = 'inprocess' FOR UPDATE SKIP LOCKED`
    );
    const currentInProgress = countRes.rowCount ?? 0;

    if (currentInProgress >= maxConcurrent) {
      await client.query('ROLLBACK');
      return {
        ok: false,
        response: NextResponse.json({ message: `Max concurrent jobs running (${currentInProgress}/${maxConcurrent})` }, { status: 200 }),
      };
    }

    await resetStuckJobs(client);

    const noQueuedJobsResponse = await getQueuedJobsResponse(client);
    if (noQueuedJobsResponse) {
      await client.query('COMMIT');
      return { ok: false, response: noQueuedJobsResponse };
    }

    const result = await claimJob(client);
    if (result.rows.length === 0) {
      await client.query('COMMIT');
      return {
        ok: false,
        response: NextResponse.json({ message: 'No queued jobs' }, { status: 200 }),
      };
    }

    await client.query('COMMIT');
    return { ok: true, job: result.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
