import type { DbClient } from './db';
import {
  buildRetryWebhookPayload,
  calculateUploadQueueRetryDelayValue,
  canRetryUploadQueueJob,
  getNextUploadQueueRetryCount,
  normalizeUploadQueueRetryConfig,
} from './uploadQueueRetryUtils';
import type {
  RetryableUploadQueueJob,
  RetryWebhookPayload,
  UploadQueueRetryConfig,
  UploadQueueRetryJob,
} from './uploadQueueRetryTypes';

export function canRetryJob(job: UploadQueueRetryJob, maxRetries: number = 3): boolean {
  return canRetryUploadQueueJob(job, maxRetries);
}

export function getNextRetryCount(job: UploadQueueRetryJob): number {
  return getNextUploadQueueRetryCount(job);
}

export function createRetryWebhookPayload(job: UploadQueueRetryJob): RetryWebhookPayload {
  return buildRetryWebhookPayload(job);
}

export function calculateUploadQueueRetryDelay(attempt: number, config: UploadQueueRetryConfig): number {
  return calculateUploadQueueRetryDelayValue(attempt, config);
}

export async function processFailedJobWithRetry(
  job: RetryableUploadQueueJob,
  processFunction: (job: RetryableUploadQueueJob, client: DbClient) => Promise<unknown>,
  client: DbClient,
  config: Partial<UploadQueueRetryConfig> = {},
): Promise<unknown> {
  const finalConfig = normalizeUploadQueueRetryConfig(config);

  if (!canRetryJob(job, finalConfig.maxRetries)) {
    throw new Error(`Job ${job.id} has exceeded maximum retry attempts (${finalConfig.maxRetries})`);
  }

  const updatedWebhookPayload = createRetryWebhookPayload(job);
  await client.query(
    `UPDATE upload_queue SET webhook_payload = $1 WHERE id = $2`,
    [JSON.stringify(updatedWebhookPayload), job.id],
  );

  job.webhook_payload = updatedWebhookPayload;

  return processFunction(job, client);
}
