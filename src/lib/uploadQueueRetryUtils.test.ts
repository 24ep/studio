import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RETRY_CONFIG,
  DEFAULT_UPLOAD_QUEUE_RETRY_CONFIG,
  buildRetryWebhookPayload,
  calculateRetryDelay,
  calculateUploadQueueRetryDelayValue,
  canRetryUploadQueueJob,
  getNextUploadQueueRetryCount,
  getRetryErrorMessage,
  isRetryableUploadQueueError,
  normalizeRetryConfig,
  normalizeUploadQueueRetryConfig,
} from './uploadQueueRetryUtils';

describe('upload queue retry utilities', () => {
  it('normalizes retry configs and caps exponential delays', () => {
    expect(normalizeRetryConfig({ maxRetries: 5 })).toEqual({
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 5,
    });
    expect(calculateRetryDelay(3, {
      maxRetries: 3,
      baseDelay: 100,
      maxDelay: 500,
      backoffMultiplier: 3,
    })).toBe(500);

    expect(normalizeUploadQueueRetryConfig({ retryDelayMs: 1000 })).toEqual({
      ...DEFAULT_UPLOAD_QUEUE_RETRY_CONFIG,
      retryDelayMs: 1000,
    });
    expect(calculateUploadQueueRetryDelayValue(4, {
      maxRetries: 3,
      retryDelayMs: 1000,
      backoffMultiplier: 3,
      maxDelayMs: 5000,
    })).toBe(5000);
  });

  it('classifies retryable upload queue errors', () => {
    expect(isRetryableUploadQueueError(new Error('fetch failed'))).toBe(true);
    expect(isRetryableUploadQueueError({ code: 'ECONNREFUSED', message: 'refused' })).toBe(true);
    expect(isRetryableUploadQueueError({ status: 503, message: 'unavailable' })).toBe(true);
    expect(isRetryableUploadQueueError(new Error('deadlock detected'))).toBe(true);
    expect(isRetryableUploadQueueError({ status: 400, message: 'bad request' })).toBe(false);
    expect(isRetryableUploadQueueError(null)).toBe(false);

    expect(getRetryErrorMessage(new Error('boom'))).toBe('boom');
    expect(getRetryErrorMessage('string failure')).toBe('string failure');
  });

  it('derives upload queue retry counts and webhook payloads', () => {
    const job = {
      id: 'job-1',
      status: 'failed',
      error: 'Previous failure',
      webhook_payload: {
        retry_count: 1,
        retry_history: [{ attempt: 1 }],
      },
    };

    expect(canRetryUploadQueueJob(job, 3)).toBe(true);
    expect(canRetryUploadQueueJob(job, 1)).toBe(false);
    expect(getNextUploadQueueRetryCount(job)).toBe(2);

    expect(buildRetryWebhookPayload(job, new Date('2026-06-01T01:02:03.000Z'))).toEqual({
      retry_count: 2,
      last_retry_attempt: '2026-06-01T01:02:03.000Z',
      retry_history: [
        { attempt: 1 },
        {
          attempt: 2,
          timestamp: '2026-06-01T01:02:03.000Z',
          previous_status: 'failed',
          previous_error: 'Previous failure',
        },
      ],
    });
  });
});
