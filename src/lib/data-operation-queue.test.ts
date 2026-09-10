import { describe, expect, it } from 'vitest';
import { resolveDataOperationQueueSettings } from './data-operation-queue';

describe('data operation queue settings', () => {
  it('uses safe defaults when settings are absent or invalid', () => {
    expect(resolveDataOperationQueueSettings({ concurrency: null, perUser: 'invalid', sizeMb: null, retention: '' })).toEqual({
      maxConcurrentJobs: 2,
      maxQueuedJobsPerUser: 10,
      maxImportFileSizeBytes: 10 * 1024 * 1024,
      retentionDays: 14,
    });
  });

  it('bounds admin values to platform safety limits', () => {
    expect(resolveDataOperationQueueSettings({ concurrency: '50', perUser: '0', sizeMb: '250', retention: '365' })).toEqual({
      maxConcurrentJobs: 20,
      maxQueuedJobsPerUser: 1,
      maxImportFileSizeBytes: 100 * 1024 * 1024,
      retentionDays: 90,
    });
  });
});
