export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  retries: number;
  totalTime: number;
}

export interface UploadQueueRetryConfig {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export type RetryWebhookPayload = Record<string, unknown> & {
  retry_count?: unknown;
  retry_history?: unknown;
};

export type UploadQueueRetryJob = Record<string, unknown> & {
  id?: unknown;
  status?: unknown;
  error?: unknown;
  webhook_payload?: RetryWebhookPayload | null;
};

export type RetryableUploadQueueJob = UploadQueueRetryJob & {
  id: string;
};
