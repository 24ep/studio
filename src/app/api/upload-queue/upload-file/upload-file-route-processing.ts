import type { NextRequest } from 'next/server';

import { getPool, type DbClient } from '@/lib/db';
import { broadcastUploadQueueUpdate } from '../sse/broadcastUploadQueueUpdate';
import { getProcessorApiKey } from '@/lib/processor-auth';
import { getSystemSetting } from '@/lib/systemSettings';
import { getResumeProcessingWebhookSettings } from '@/lib/upload-queue/resume-processing-webhook-settings';
import { processSingleUploadQueueJob } from '@/lib/uploadQueueProcessor';
import type { UploadResult } from './upload-file-route-types';
import { processFileUpload } from './upload-file-route-storage';
import type { ParsedUploadRequest } from './upload-file-route-request';

type ClaimedUploadedQueueJob = Record<string, unknown> & {
  id: string;
  file_name?: string | null;
  file_path?: string | null;
  webhook_payload?: unknown;
};

export async function processUploadsInTransaction(
  parsed: ParsedUploadRequest,
  actingUserId: string,
): Promise<UploadResult[]> {
  const client = await getPool().connect();
  const transactionPromise = Promise.all(
    parsed.files.map((file) =>
      processFileUpload(file, client, {
        position_id: parsed.position_id,
        batch_id: parsed.batch_id,
        source: parsed.source,
        source_id: parsed.source_id,
        sub_source: parsed.sub_source,
        webhook_payload: parsed.webhook_payload,
        created_by: actingUserId,
      }),
    ),
  );
  const timeoutMs = 60000;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error('[UPLOAD] Database operation timeout - forcing rollback'));
    }, timeoutMs);
  });

  try {
    await client.query('BEGIN');
    const results = await Promise.race([transactionPromise, timeoutPromise]);
    await client.query('COMMIT');
    return results;
  } catch (error) {
    if (error instanceof Error && error.message.includes('forcing rollback')) {
      console.error('[UPLOAD] Database operation timeout - forcing rollback');
    }
    await client.query('ROLLBACK');
    throw error;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
    client.release();
  }
}

export async function broadcastUploadQueueChange(): Promise<void> {
  try {
    await broadcastUploadQueueUpdate();
  } catch (sseError) {
    console.error('[UPLOAD] Failed to broadcast upload queue update via SSE:', sseError);
  }
}

export async function triggerUploadQueueProcessing(request: NextRequest): Promise<void> {
  const processUrl = `${request.nextUrl.origin}/api/upload-queue/process-all`;
  const processorApiKey = getProcessorApiKey();

  await fetch(processUrl, {
    method: 'POST',
    headers: {
      'x-api-key': processorApiKey || '',
    },
  });
}

async function claimUploadedQueueJob(client: DbClient, queueId: string) {
  const result = await client.query<ClaimedUploadedQueueJob>(
    `UPDATE upload_queue
     SET status = 'inprocess', process_date = now(), updated_at = now()
     WHERE id = $1 AND status = 'queued'
     RETURNING *`,
    [queueId],
  );

  return result.rows[0] ?? null;
}

export async function processBuiltInUploadedQueueJobs(results: UploadResult[]): Promise<boolean> {
  const settings = await getResumeProcessingWebhookSettings();
  if (settings.mode !== 'built-in') {
    return false;
  }

  const queueEnabled = await getSystemSetting('processQueueEnabled');
  if (queueEnabled === 'false') {
    return true;
  }

  const queueIds = results
    .filter((result) => result.status === 'success' && result.queue_id)
    .map((result) => result.queue_id as string);

  if (queueIds.length === 0) {
    return true;
  }

  for (const queueId of queueIds) {
    const client = await getPool().connect();

    try {
      const job = await claimUploadedQueueJob(client, queueId);
      if (!job) {
        continue;
      }

      await processSingleUploadQueueJob(job, client);
    } catch (error) {
      console.error(`[UPLOAD] Built-in processing failed for queue job ${queueId}:`, error);
    } finally {
      client.release();
    }
  }

  await broadcastUploadQueueChange();
  return true;
}
