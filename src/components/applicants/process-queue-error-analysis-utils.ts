import type { ProcessQueueAnalyticsData } from './process-queue-analytics-utils';

export function buildProcessQueueErrorAnalysisSummary(
  errorsByReason: ProcessQueueAnalyticsData['stats']['errorsByReason'],
  totalJobs: number,
) {
  const totalErrors = errorsByReason.reduce((sum, item) => sum + item.count, 0);

  return {
    totalErrors,
    errorTypes: errorsByReason.length,
    errorRate: totalJobs > 0 ? `${((totalErrors / totalJobs) * 100).toFixed(1)}%` : '0.0%',
  };
}

export function formatProcessQueueErrorReasonPreview(reason: string): string {
  return reason.length > 80 ? `${reason.substring(0, 80)}...` : reason;
}
