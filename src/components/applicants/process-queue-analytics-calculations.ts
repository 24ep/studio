import {
  addProcessQueueItemMetrics,
  buildProcessQueueAnalyticsAccumulator,
  buildProcessQueueAnalyticsStats,
} from "./process-queue-analytics-aggregation";
import type {
  ProcessQueueAnalyticsData,
  ProcessQueueItem,
  ProcessQueueListResponse,
} from "./process-queue-analytics-types";

export function normalizeProcessQueueListResponse(
  responseData: ProcessQueueListResponse | null | undefined
) {
  const queueData = Array.isArray(responseData?.data) ? responseData.data : [];
  const totalJobs = typeof responseData?.total === "number" ? responseData.total : queueData.length;

  return {
    queueData,
    totalJobs,
  };
}

export function buildEmptyProcessQueueAnalytics(totalJobs = 0): ProcessQueueAnalyticsData {
  return {
    scatterData: [],
    stats: {
      totalJobs,
      avgDuration: 0,
      avgDurationByType: [],
      jobsByType: [],
      errorsByReason: [],
      fileSizeRanges: [],
      sourceAnalytics: [],
    },
  };
}

export function processQueueAnalyticsData(
  queueData: ProcessQueueItem[],
  totalJobs: number
): ProcessQueueAnalyticsData {
  const accumulator = buildProcessQueueAnalyticsAccumulator();

  queueData.forEach((item) => {
    addProcessQueueItemMetrics(accumulator, item);
  });

  return {
    scatterData: accumulator.scatterData,
    stats: buildProcessQueueAnalyticsStats(accumulator, totalJobs),
  };
}
