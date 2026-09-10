import { describe, expect, it, vi } from 'vitest';

import {
  canRetryJob,
  calculateUploadQueueRetryDelay,
  createRetryWebhookPayload,
  getNextRetryCount,
  isRetryableError,
  retryWithBackoff,
  retryWithErrorChecking,
} from './uploadQueueRetry';

describe('upload queue retry public helpers', () => {
  it('retries retryable operations and reports attempts', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('network timeout'))
      .mockResolvedValueOnce('done');

    await expect(retryWithErrorChecking(operation, {
      maxRetries: 2,
      baseDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
    })).resolves.toMatchObject({
      success: true,
      data: 'done',
      retries: 1,
    });
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-retryable errors', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('validation failed'));

    await expect(retryWithErrorChecking(operation, {
      maxRetries: 3,
      baseDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
    })).resolves.toMatchObject({
      success: false,
      error: 'validation failed',
      retries: 0,
    });
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('keeps existing wrapper helper behavior', async () => {
    await expect(retryWithBackoff(() => Promise.resolve('ok'), {
      maxRetries: 1,
      baseDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
    })).resolves.toMatchObject({
      success: true,
      data: 'ok',
      retries: 0,
    });

    const job = {
      status: 'failed',
      error: 'old error',
      webhook_payload: { retry_count: 2 },
    };
    expect(canRetryJob(job, 3)).toBe(true);
    expect(getNextRetryCount(job)).toBe(3);
    expect(createRetryWebhookPayload(job).retry_count).toBe(3);
    expect(calculateUploadQueueRetryDelay(2, {
      maxRetries: 3,
      retryDelayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 350,
    })).toBe(350);
    expect(isRetryableError({ status: 502 })).toBe(true);
  });
});
