import { getSafeDbClient, type DbClient } from '@/lib/db';
import { processSingleUploadQueueJob } from '@/lib/uploadQueueProcessor';
import { hasProcessingTimedOut } from './upload-queue-process-all-settings';

type UploadQueueWebhookPayload = {
  source?: string;
  processed_by_external_webhook?: boolean;
};

type ClaimedUploadQueueJob = Record<string, unknown> & {
  id: string;
  source?: string | null;
  webhook_payload?: UploadQueueWebhookPayload | null;
};

type DuplicateCheckRow = {
  status: string;
  processed_flag: string | null;
};

export type ProcessedUploadQueueJobResult = {
  id: string;
  status: string;
  error?: string | null;
};

type UploadQueueProcessorResult = {
  job?: ProcessedUploadQueueJobResult;
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeClaimedJob(row: Record<string, unknown>): ClaimedUploadQueueJob | null {
  if (!row.id) {
    return null;
  }

  const webhookPayload = isRecord(row.webhook_payload)
    ? row.webhook_payload as UploadQueueWebhookPayload
    : null;

  return {
    ...row,
    id: String(row.id),
    source: typeof row.source === 'string' ? row.source : null,
    webhook_payload: webhookPayload,
  };
}

function isReprocessJob(job: ClaimedUploadQueueJob) {
  return job.source === 'reprocess' || job.webhook_payload?.source === 'reprocess';
}

async function shouldSkipClaimedJob(
  job: ClaimedUploadQueueJob,
  client: DbClient
): Promise<ProcessedUploadQueueJobResult | null> {
  const duplicateCheck = await client.query<DuplicateCheckRow>(
    `SELECT status, webhook_payload->>'processed_by_external_webhook' as processed_flag 
     FROM upload_queue WHERE id = $1`,
    [job.id]
  );

  if (duplicateCheck.rows.length === 0) {
    return null;
  }

  const currentJob = duplicateCheck.rows[0];
  if (currentJob.status !== 'inprocess') {
    return {
      id: job.id,
      status: 'skipped',
      error: `Job status changed to ${currentJob.status} during processing`,
    };
  }

  if (currentJob.processed_flag === 'true' && !isReprocessJob(job)) {
    return {
      id: job.id,
      status: 'skipped',
      error: 'Already processed by external webhook',
    };
  }

  return null;
}

function toProcessorResult(value: unknown): UploadQueueProcessorResult {
  return value && typeof value === 'object'
    ? value as UploadQueueProcessorResult
    : {};
}

async function processClaimedJob(
  job: ClaimedUploadQueueJob,
  startTime: number
): Promise<ProcessedUploadQueueJobResult> {
  const processingClient = await getSafeDbClient();

  try {
    if (hasProcessingTimedOut(startTime)) {
      const jobProcessingTime = Date.now() - startTime;
      console.error(`Job ${job.id} processing time exceeded limit: ${jobProcessingTime}ms`);
      return {
        id: job.id,
        status: 'error',
        error: 'Processing time exceeded limit',
      };
    }

    const skippedJob = await shouldSkipClaimedJob(job, processingClient);
    if (skippedJob) {
      return skippedJob;
    }

    const result = toProcessorResult(await processSingleUploadQueueJob(job, processingClient));
    if (result.job) {
      return result.job;
    }

    const errorResult = { id: job.id, status: 'error', error: result.error || 'Unknown error' };
    console.error(`[Process-All] Job ${job.id} failed:`, errorResult.error);
    return errorResult;
  } catch (error) {
    console.error(`[Process-All] Error processing job ${job.id}:`, error);
    return {
      id: job.id,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    processingClient.release();
  }
}

export async function processClaimedUploadQueueJobs(jobs: Record<string, unknown>[], startTime: number) {
  return Promise.all(jobs.map((row) => {
    const job = normalizeClaimedJob(row);
    return job
      ? processClaimedJob(job, startTime)
      : Promise.resolve({ id: 'unknown', status: 'error', error: 'Claimed job missing id' });
  }));
}
