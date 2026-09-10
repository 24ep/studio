import { getNetworkErrorCode, getNetworkErrorStatus, getNetworkErrorText } from './networkErrorUtils';
import type { RetryConfig, UploadQueueRetryConfig } from './uploadQueueRetryTypes';

type RetryWebhookPayload = Record<string, unknown> & {
  retry_count?: unknown;
  retry_history?: unknown;
};

interface UploadQueueRetryJob {
  webhook_payload?: RetryWebhookPayload | null;
  status?: unknown;
  error?: unknown;
}

function getRetryWebhookPayload(job: UploadQueueRetryJob): RetryWebhookPayload {
  const payload = job.webhook_payload;
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload;
  }
  return {};
}

function getRetryHistory(payload: RetryWebhookPayload): unknown[] {
  return Array.isArray(payload.retry_history) ? payload.retry_history : [];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export const DEFAULT_UPLOAD_QUEUE_RETRY_CONFIG: UploadQueueRetryConfig = {
  maxRetries: 3,
  retryDelayMs: 5000,
  backoffMultiplier: 2,
  maxDelayMs: 60000,
};

export function normalizeRetryConfig(config: Partial<RetryConfig> = {}): RetryConfig {
  return { ...DEFAULT_RETRY_CONFIG, ...config };
}

export function normalizeUploadQueueRetryConfig(
  config: Partial<UploadQueueRetryConfig> = {}
): UploadQueueRetryConfig {
  return { ...DEFAULT_UPLOAD_QUEUE_RETRY_CONFIG, ...config };
}

export function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelay);
}

export function calculateUploadQueueRetryDelayValue(attempt: number, config: UploadQueueRetryConfig): number {
  const delay = config.retryDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

export function getRetryErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error || 'Unknown retry error');
}

export function isRetryableUploadQueueError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = getNetworkErrorText(error);
  const errorCode = getNetworkErrorCode(error);

  if (
    errorMessage.includes('fetch failed') ||
    errorMessage.includes('network') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('ETIMEDOUT')
  ) {
    return true;
  }

  if (
    errorCode === 'ECONNREFUSED' ||
    errorCode === 'ENOTFOUND' ||
    errorCode === 'ETIMEDOUT' ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout')
  ) {
    return true;
  }

  const status = getNetworkErrorStatus(error);
  if (status !== undefined && status >= 500 && status < 600) {
    return true;
  }

  return (
    errorMessage.includes('deadlock') ||
    errorMessage.includes('lock timeout') ||
    errorMessage.includes('connection pool')
  );
}

export function getJobRetryCount(job: UploadQueueRetryJob): number {
  const retryCount = getRetryWebhookPayload(job).retry_count;
  if (typeof retryCount === 'number') return retryCount;
  if (typeof retryCount === 'string' && retryCount.trim() !== '' && !Number.isNaN(Number(retryCount))) {
    return Number(retryCount);
  }
  return 0;
}

export function canRetryUploadQueueJob(job: UploadQueueRetryJob, maxRetries: number = 3): boolean {
  return getJobRetryCount(job) < maxRetries;
}

export function getNextUploadQueueRetryCount(job: UploadQueueRetryJob): number {
  return getJobRetryCount(job) + 1;
}

export function buildRetryWebhookPayload(job: UploadQueueRetryJob, now = new Date()): RetryWebhookPayload {
  const currentRetryCount = getNextUploadQueueRetryCount(job);
  const timestamp = now.toISOString();
  const payload = getRetryWebhookPayload(job);

  return {
    ...payload,
    retry_count: currentRetryCount,
    last_retry_attempt: timestamp,
    retry_history: [
      ...getRetryHistory(payload),
      {
        attempt: currentRetryCount,
        timestamp,
        previous_status: job.status,
        previous_error: job.error,
      },
    ],
  };
}
