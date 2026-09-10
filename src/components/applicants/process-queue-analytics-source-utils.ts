import type { ProcessQueueItem } from "./process-queue-analytics-types";
import { getAverageDuration } from "./process-queue-analytics-duration-utils";

export type SourceCounter = {
  sourceId: string | null;
  sourceName: string;
  sourceLogo: string | null;
  totalJobs: number;
  successJobs: number;
  failedJobs: number;
  totalDuration: number;
  completedJobs: number;
};

type SourceStatusCounterKey = "successJobs" | "failedJobs";

const SOURCE_STATUS_COUNTERS: Partial<Record<ProcessQueueItem["status"], SourceStatusCounterKey>> = {
  success: "successJobs",
  failed: "failedJobs",
};

function getQueueItemSourceKey(item: ProcessQueueItem) {
  return item.source_id || item.source || "Unknown";
}

function buildSourceCounter(item: ProcessQueueItem): SourceCounter {
  return {
    sourceId: item.source_id,
    sourceName: item.source_name || item.source || "Unknown Source",
    sourceLogo: item.source_logo,
    totalJobs: 0,
    successJobs: 0,
    failedJobs: 0,
    totalDuration: 0,
    completedJobs: 0,
  };
}

function addSourceStatus(source: SourceCounter, status: ProcessQueueItem["status"]) {
  const counterKey = SOURCE_STATUS_COUNTERS[status];
  if (counterKey) {
    source[counterKey] += 1;
  }
}

function addSourceDuration(source: SourceCounter, duration: number | null) {
  if (duration === null) return;

  source.totalDuration += duration;
  source.completedJobs += 1;
}

function getSourceRate(count: number, totalJobs: number) {
  return totalJobs > 0 ? (count / totalJobs) * 100 : 0;
}

export function updateSourceCounter(
  sourceMap: Map<string, SourceCounter>,
  item: ProcessQueueItem,
  duration: number | null
) {
  const sourceKey = getQueueItemSourceKey(item);
  const currentSource = sourceMap.get(sourceKey) || buildSourceCounter(item);

  currentSource.totalJobs += 1;
  addSourceStatus(currentSource, item.status);
  addSourceDuration(currentSource, duration);
  sourceMap.set(sourceKey, currentSource);
}

export function buildSourceAnalytics(sourceMap: Map<string, SourceCounter>) {
  return Array.from(sourceMap.values()).map((source) => ({
    sourceId: source.sourceId,
    sourceName: source.sourceName,
    sourceLogo: source.sourceLogo,
    totalJobs: source.totalJobs,
    successJobs: source.successJobs,
    failedJobs: source.failedJobs,
    successRate: getSourceRate(source.successJobs, source.totalJobs),
    failedRate: getSourceRate(source.failedJobs, source.totalJobs),
    avgDuration: getAverageDuration({
      totalDuration: source.totalDuration,
      count: source.completedJobs,
    }),
    totalDuration: source.totalDuration,
  })).sort((a, b) => b.totalJobs - a.totalJobs);
}
