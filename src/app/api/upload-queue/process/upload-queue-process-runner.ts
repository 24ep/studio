import { NextResponse } from 'next/server';
import type { DbClient } from '@/lib/db';
import { getSystemSetting } from '@/lib/systemSettings';
import { processSingleUploadQueueJob } from '@/lib/uploadQueueProcessor';
import type { UploadQueueProcessJob } from './upload-queue-process-claim';
import { MAX_PROCESSING_TIME_MS } from './upload-queue-process-settings';
import {
  broadcastQueueProgress,
  getProcessorErrorStatus,
  getWebhookPayload,
  hasProcessorResponse,
  isReprocessJob,
  toProcessorResult,
  type CountRow,
  type ProcessorRunResult,
} from './upload-queue-process-runner-utils';

async function clearReprocessWebhookFlag(job: UploadQueueProcessJob, client: DbClient): Promise<boolean> {
  const webhookPayload = getWebhookPayload(job);
  const jobAlreadyProcessed = webhookPayload.processed_by_external_webhook === true;
  const reprocessJob = isReprocessJob(job);

  if (!reprocessJob || !jobAlreadyProcessed) {
    return jobAlreadyProcessed;
  }

  await client.query(
    `UPDATE upload_queue SET webhook_payload = jsonb_set(
      COALESCE(webhook_payload, '{}'::jsonb),
      '{processed_by_external_webhook}',
      'false'::jsonb
    ) WHERE id = $1`,
    [job.id]
  );

  job.webhook_payload = webhookPayload;
  job.webhook_payload.processed_by_external_webhook = false;
  return false;
}

async function hasAlreadyProcessedFile(job: UploadQueueProcessJob, client: DbClient): Promise<boolean> {
  if (isReprocessJob(job)) {
    return false;
  }

  const alreadyProcessedCheck = await client.query<CountRow>(
    `SELECT COUNT(*) as count FROM upload_queue
     WHERE file_path = $1
     AND status IN ('success', 'failed', 'error')
     AND id != $2`,
    [job.file_path, job.id]
  );

  return parseInt(String(alreadyProcessedCheck.rows[0].count), 10) > 0;
}

async function shouldPreventDuplicateWebhookProcessing(): Promise<boolean> {
  const duplicateProcessingSetting = await getSystemSetting('preventDuplicateWebhookProcessing');
  return duplicateProcessingSetting === null ? true : duplicateProcessingSetting === 'true';
}

async function failJobForProcessingTimeout(job: UploadQueueProcessJob, client: DbClient, processingTime: number) {
  console.error(`Job ${job.id} processing time exceeded limit: ${processingTime}ms`);
  await client.query(
    `UPDATE upload_queue SET status = 'error', error = $1, error_details = $2, completed_date = now(), updated_at = now() WHERE id = $3`,
    ['Processing time exceeded limit', `Processing time: ${processingTime}ms, max allowed: ${MAX_PROCESSING_TIME_MS}ms`, job.id]
  );
  return NextResponse.json({ error: 'Processing time exceeded limit', job }, { status: 408 });
}

async function runProcessor(job: UploadQueueProcessJob, client: DbClient): Promise<ProcessorRunResult> {
  const result = toProcessorResult(await processSingleUploadQueueJob(job, client));

  if (result?.error && !result?.webhook_response) {
    return {
      response: NextResponse.json(
        { error: result.error, job: result.job || job },
        { status: getProcessorErrorStatus(result.error) }
      ),
    };
  }

  return {
    status: result.job?.status || 'success',
    error: result.job?.error || null,
    errorDetails: result.job?.error_details || null,
    webhookResults: result.webhook_response || null,
  };
}

export async function processClaimedUploadQueueJob(job: UploadQueueProcessJob, client: DbClient, startTime: number) {
  const processingTime = Date.now() - startTime;
  if (processingTime > MAX_PROCESSING_TIME_MS) {
    return failJobForProcessingTimeout(job, client, processingTime);
  }

  await broadcastQueueProgress('progress');

  let status = 'success';
  let error: string | null = null;
  let errorDetails: string | null = null;
  let webhookResults: unknown = null;

  const jobAlreadyProcessed = await clearReprocessWebhookFlag(job, client);
  const preventDuplicateProcessing = await shouldPreventDuplicateWebhookProcessing();
  const alreadyProcessed = await hasAlreadyProcessedFile(job, client);

  if (alreadyProcessed) {
    errorDetails = 'Skipped - file already processed by another job';
  } else if (jobAlreadyProcessed && preventDuplicateProcessing) {
    errorDetails = 'Skipped - already processed by external webhook';
  } else {
    try {
      const processorResult = await runProcessor(job, client);
      if (hasProcessorResponse(processorResult)) {
        return processorResult.response;
      }

      status = processorResult.status;
      error = processorResult.error;
      errorDetails = processorResult.errorDetails;
      webhookResults = processorResult.webhookResults;
    } catch (err) {
      status = 'failed';
      error = 'Resume processing webhook error';
      errorDetails = err instanceof Error ? err.message : String(err);
      console.error(`[PROCESS] Job ${job.id} failed:`, err);
    }
  }

  await broadcastQueueProgress('final');

  if (typeof global !== 'undefined' && typeof global.gc === 'function') {
    global.gc();
  }

  return NextResponse.json({
    job: { ...job, status, error, error_details: errorDetails },
    webhookResults,
  });
}
