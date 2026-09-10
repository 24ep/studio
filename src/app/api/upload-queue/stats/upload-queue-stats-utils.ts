export interface UploadQueueStatusCount {
  status: string;
  count: string;
}

export type UploadQueueHealth = {
  is_healthy: boolean;
  warnings: string[];
  errors: string[];
};

export type UploadQueueStats = {
  total_jobs: number;
  queued_jobs: number;
  inprocess_jobs: number;
  success_jobs: number;
  error_jobs: number;
  failed_jobs: number;
  stuck_jobs: number;
  avg_processing_time_seconds: number;
  jobs_per_hour: number;
  high_retry_jobs: number;
  duplicate_files: number;
  timestamp: string;
  health?: UploadQueueHealth;
};

export interface BuildUploadQueueStatsInput {
  avgProcessingTimeSeconds?: string | null;
  duplicateFiles?: string;
  highRetryJobs?: string;
  jobsPerHour?: string;
  statusCounts: UploadQueueStatusCount[];
  stuckJobs?: string;
  timestamp?: string;
}

export function parseUploadQueueCount(value: string | undefined): number {
  return parseInt(value ?? '0', 10);
}

export function getUploadQueueStatsErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function buildUploadQueueStats({
  avgProcessingTimeSeconds,
  duplicateFiles,
  highRetryJobs,
  jobsPerHour,
  statusCounts,
  stuckJobs,
  timestamp = new Date().toISOString(),
}: BuildUploadQueueStatsInput): UploadQueueStats {
  const stats: UploadQueueStats = {
    total_jobs: 0,
    queued_jobs: 0,
    inprocess_jobs: 0,
    success_jobs: 0,
    error_jobs: 0,
    failed_jobs: 0,
    stuck_jobs: parseUploadQueueCount(stuckJobs),
    avg_processing_time_seconds: parseFloat(avgProcessingTimeSeconds || '0'),
    jobs_per_hour: parseUploadQueueCount(jobsPerHour),
    high_retry_jobs: parseUploadQueueCount(highRetryJobs),
    duplicate_files: parseUploadQueueCount(duplicateFiles),
    timestamp,
  };

  for (const row of statusCounts) {
    const count = parseUploadQueueCount(row.count);
    stats.total_jobs += count;

    switch (row.status) {
      case 'queued':
        stats.queued_jobs = count;
        break;
      case 'inprocess':
        stats.inprocess_jobs = count;
        break;
      case 'success':
        stats.success_jobs = count;
        break;
      case 'error':
        stats.error_jobs = count;
        break;
      case 'failed':
        stats.failed_jobs = count;
        break;
    }
  }

  return {
    ...stats,
    health: buildUploadQueueHealth(stats),
  };
}

export function buildUploadQueueHealth(stats: UploadQueueStats): UploadQueueHealth {
  const healthIndicators: UploadQueueHealth = {
    is_healthy: true,
    warnings: [],
    errors: [],
  };

  if (stats.stuck_jobs > 5) {
    healthIndicators.warnings.push(`Too many stuck jobs: ${stats.stuck_jobs}`);
  }

  if (stats.high_retry_jobs > 3) {
    healthIndicators.warnings.push(`Too many high-retry jobs: ${stats.high_retry_jobs}`);
  }

  if (stats.duplicate_files > 0) {
    healthIndicators.warnings.push(`Duplicate files in queue: ${stats.duplicate_files}`);
  }

  if (stats.inprocess_jobs > 10) {
    healthIndicators.warnings.push(`Too many in-process jobs: ${stats.inprocess_jobs}`);
  }

  if (stats.stuck_jobs > 20) {
    healthIndicators.errors.push(`Critical: Too many stuck jobs: ${stats.stuck_jobs}`);
    healthIndicators.is_healthy = false;
  }

  if (stats.high_retry_jobs > 10) {
    healthIndicators.errors.push(`Critical: Too many high-retry jobs: ${stats.high_retry_jobs}`);
    healthIndicators.is_healthy = false;
  }

  return healthIndicators;
}
