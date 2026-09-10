import {
  addDuration,
  buildDurationAverages,
  buildFileSizeRangeStats,
  buildJobCounts,
  getAverageScatterDuration,
  getFileSizeRange,
  getProcessingDurationMinutes,
  type DurationCounter,
} from "./process-queue-analytics-duration-utils";
import {
  buildErrorReasonCounts,
  getQueueItemErrorReason,
  incrementCounter,
} from "./process-queue-analytics-error-counts";
import { buildProcessQueueScatterPoint } from "./process-queue-analytics-scatter-builders";
import {
  buildSourceAnalytics,
  updateSourceCounter,
  type SourceCounter,
} from "./process-queue-analytics-source-utils";
import type {
  ProcessQueueAnalyticsData,
  ProcessQueueItem,
} from "./process-queue-analytics-types";

export type ProcessQueueAnalyticsAccumulator = {
  scatterData: ProcessQueueAnalyticsData["scatterData"];
  typeMap: Map<string, DurationCounter>;
  errorMap: Map<string, number>;
  fileSizeRanges: Map<string, DurationCounter>;
  sourceMap: Map<string, SourceCounter>;
};

export function buildProcessQueueAnalyticsAccumulator(): ProcessQueueAnalyticsAccumulator {
  return {
    scatterData: [],
    typeMap: new Map(),
    errorMap: new Map(),
    fileSizeRanges: new Map(),
    sourceMap: new Map(),
  };
}

export function addProcessQueueItemMetrics(
  accumulator: ProcessQueueAnalyticsAccumulator,
  item: ProcessQueueItem
) {
  const duration = getProcessingDurationMinutes(item);

  if (shouldSkipQueueItem(item, duration)) {
    return;
  }

  addScatterMetrics(accumulator, item, duration);
  addDuration(accumulator.typeMap, item.status, duration || 0);
  addErrorMetrics(accumulator.errorMap, item);
  updateSourceCounter(accumulator.sourceMap, item, duration);
}

export function buildProcessQueueAnalyticsStats(
  accumulator: ProcessQueueAnalyticsAccumulator,
  totalJobs: number
): ProcessQueueAnalyticsData["stats"] {
  return {
    totalJobs,
    avgDuration: getAverageScatterDuration(accumulator.scatterData),
    avgDurationByType: buildDurationAverages(accumulator.typeMap),
    jobsByType: buildJobCounts(accumulator.typeMap),
    errorsByReason: buildErrorReasonCounts(accumulator.errorMap),
    fileSizeRanges: buildFileSizeRangeStats(accumulator.fileSizeRanges),
    sourceAnalytics: buildSourceAnalytics(accumulator.sourceMap),
  };
}

function shouldSkipQueueItem(item: ProcessQueueItem, duration: number | null) {
  return Boolean(item.process_date && item.completed_date && duration === null);
}

function addScatterMetrics(
  accumulator: ProcessQueueAnalyticsAccumulator,
  item: ProcessQueueItem,
  duration: number | null
) {
  if (duration === null || !item.process_date) return;

  accumulator.scatterData.push(buildProcessQueueScatterPoint(item, duration));
  addDuration(accumulator.fileSizeRanges, getFileSizeRange(item.file_size), duration);
}

function addErrorMetrics(errorMap: Map<string, number>, item: ProcessQueueItem) {
  const errorReason = getQueueItemErrorReason(item);
  if (errorReason) {
    incrementCounter(errorMap, errorReason);
  }
}
