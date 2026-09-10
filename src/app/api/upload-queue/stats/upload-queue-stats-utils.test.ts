import { describe, expect, it } from 'vitest';

import {
  buildUploadQueueHealth,
  buildUploadQueueStats,
  getUploadQueueStatsErrorMessage,
  parseUploadQueueCount,
} from './upload-queue-stats-utils';

describe('upload-queue-stats-utils', () => {
  it('builds queue stats from status rows and aggregate counts', () => {
    expect(buildUploadQueueStats({
      avgProcessingTimeSeconds: '12.5',
      duplicateFiles: '1',
      highRetryJobs: '4',
      jobsPerHour: '9',
      statusCounts: [
        { status: 'queued', count: '3' },
        { status: 'inprocess', count: '2' },
        { status: 'success', count: '8' },
        { status: 'error', count: '1' },
        { status: 'failed', count: '2' },
        { status: 'unknown', count: '5' },
      ],
      stuckJobs: '6',
      timestamp: '2026-01-01T00:00:00.000Z',
    })).toMatchObject({
      total_jobs: 21,
      queued_jobs: 3,
      inprocess_jobs: 2,
      success_jobs: 8,
      error_jobs: 1,
      failed_jobs: 2,
      stuck_jobs: 6,
      avg_processing_time_seconds: 12.5,
      jobs_per_hour: 9,
      high_retry_jobs: 4,
      duplicate_files: 1,
      timestamp: '2026-01-01T00:00:00.000Z',
      health: {
        is_healthy: true,
        warnings: [
          'Too many stuck jobs: 6',
          'Too many high-retry jobs: 4',
          'Duplicate files in queue: 1',
        ],
        errors: [],
      },
    });
  });

  it('marks critical queue health as unhealthy', () => {
    expect(buildUploadQueueHealth({
      total_jobs: 0,
      queued_jobs: 0,
      inprocess_jobs: 11,
      success_jobs: 0,
      error_jobs: 0,
      failed_jobs: 0,
      stuck_jobs: 21,
      avg_processing_time_seconds: 0,
      jobs_per_hour: 0,
      high_retry_jobs: 11,
      duplicate_files: 0,
      timestamp: '2026-01-01T00:00:00.000Z',
    })).toEqual({
      is_healthy: false,
      warnings: [
        'Too many stuck jobs: 21',
        'Too many high-retry jobs: 11',
        'Too many in-process jobs: 11',
      ],
      errors: [
        'Critical: Too many stuck jobs: 21',
        'Critical: Too many high-retry jobs: 11',
      ],
    });
  });

  it('normalizes counts and error messages', () => {
    expect(parseUploadQueueCount(undefined)).toBe(0);
    expect(parseUploadQueueCount('7')).toBe(7);
    expect(getUploadQueueStatsErrorMessage(new Error('boom'))).toBe('boom');
    expect(getUploadQueueStatsErrorMessage('bad')).toBe('bad');
  });
});
