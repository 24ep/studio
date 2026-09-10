import { getPool } from '@/lib/db';
import { processSingleUploadQueueJob } from '@/lib/uploadQueueProcessor';
import { buildUploadQueuePatch } from './upload-queue-item-patch';
import type { DbClient } from '@/lib/db';
import type { QueryResultRow } from 'pg';

const FINAL_UPLOAD_QUEUE_STATUSES = new Set(['success', 'error', 'failed', 'cancelled']);
const CANCELLABLE_UPLOAD_QUEUE_STATUSES = new Set(['queued', 'inprocess']);
const PROCESSABLE_UPLOAD_QUEUE_STATUSES = new Set(['queued', 'error', 'failed', 'success']);
const RETRYABLE_UPLOAD_QUEUE_STATUSES = new Set(['failed', 'success']);
const MAX_RETRY_ATTEMPTS = 3;

type UploadQueueItemRow = QueryResultRow & {
  id: string;
  status: string;
  file_path?: string | null;
  file_name?: string | null;
  error?: string | null;
  error_details?: string | null;
  webhook_payload?: Record<string, unknown> | null;
};

function getRetryCount(payload: UploadQueueItemRow['webhook_payload']): number {
  const retryCount = payload?.retry_count;
  return typeof retryCount === 'number' ? retryCount : 0;
}

export async function updateUploadQueueItem(id: string, data: Record<string, unknown>) {
  const patch = buildUploadQueuePatch(data);
  if (!patch.ok) {
    return { status: 'invalid-fields' as const, invalidFields: patch.invalidFields };
  }

  if (patch.fields.length === 0) {
    return { status: 'no-fields' as const };
  }

  const values = [...patch.values, id];
  const result = await getPool().query(
    `UPDATE upload_queue SET ${patch.fields.join(', ')}, updated_at = now() WHERE id = $${values.length} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return { status: 'not-found' as const };
  }

  return { status: 'updated' as const, item: result.rows[0] };
}

export async function deleteUploadQueueItem(id: string) {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const jobResult = await client.query<UploadQueueItemRow>('SELECT status FROM upload_queue WHERE id = $1', [id]);
    if (jobResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { status: 'not-found' as const };
    }

    const job = jobResult.rows[0];
    if (!FINAL_UPLOAD_QUEUE_STATUSES.has(job.status)) {
      if (CANCELLABLE_UPLOAD_QUEUE_STATUSES.has(job.status)) {
        await client.query(
          'UPDATE upload_queue SET status = $1, updated_at = now() WHERE id = $2',
          ['cancelled', id]
        );
      } else {
        await client.query('ROLLBACK');
        return { status: 'not-deletable' as const };
      }
    }

    await client.query('DELETE FROM upload_queue WHERE id = $1 RETURNING *', [id]);
    await client.query('COMMIT');
    return { status: 'deleted' as const };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function processUploadQueueItem(id: string) {
  const client = await getPool().connect();

  try {
    const jobResult = await client.query<UploadQueueItemRow>('SELECT * FROM upload_queue WHERE id = $1', [id]);
    if (jobResult.rows.length === 0) {
      return { status: 'not-found' as const };
    }

    const job = jobResult.rows[0];
    if (!PROCESSABLE_UPLOAD_QUEUE_STATUSES.has(job.status)) {
      return { status: 'not-processable' as const };
    }

    if (RETRYABLE_UPLOAD_QUEUE_STATUSES.has(job.status)) {
      const retryResult = await resetRetryableUploadQueueItem(client, job, id);
      if (!retryResult.ok) {
        return retryResult;
      }
    }

    const result = await processSingleUploadQueueJob(job, client);
    return { status: 'processed' as const, result };
  } finally {
    client.release();
  }
}

async function resetRetryableUploadQueueItem(client: DbClient, job: UploadQueueItemRow, id: string) {
  const existingQueuedJob = await client.query(
    'SELECT id FROM upload_queue WHERE file_path = $1 AND status = $2 AND id != $3',
    [job.file_path, 'queued', id]
  );

  if (existingQueuedJob.rows.length > 0) {
    return {
      ok: false as const,
      status: 'duplicate-queued-file' as const,
    };
  }

  const currentRetryCount = getRetryCount(job.webhook_payload);
  if (currentRetryCount >= MAX_RETRY_ATTEMPTS) {
    return {
      ok: false as const,
      status: 'max-retries' as const,
    };
  }

  await client.query(
    `UPDATE upload_queue SET
     status = $1,
     error = NULL,
     error_details = NULL,
     process_date = NULL,
     completed_date = NULL,
     updated_at = now(),
     webhook_payload = jsonb_set(
       COALESCE(webhook_payload, '{}'::jsonb),
       '{retry_count}',
       '${currentRetryCount + 1}'::jsonb
     )
     WHERE id = $2`,
    ['queued', id]
  );

  const updatedResult = await client.query<UploadQueueItemRow>('SELECT * FROM upload_queue WHERE id = $1', [id]);
  if (updatedResult.rows.length > 0) {
    job.status = 'queued';
    job.error = null;
    job.error_details = null;
    job.webhook_payload = updatedResult.rows[0].webhook_payload;
  }

  return { ok: true as const };
}
