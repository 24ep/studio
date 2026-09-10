import type {
  ProcessQueueAnalyticsData,
  ProcessQueueItem,
} from "./process-queue-analytics-types";

export type DurationCounter = { totalDuration: number; count: number };

export function getProcessingDurationMinutes(item: ProcessQueueItem) {
  if (!item.process_date || !item.completed_date) return null;

  const processDate = new Date(item.process_date);
  const completedDate = new Date(item.completed_date);

  if (Number.isNaN(processDate.getTime()) || Number.isNaN(completedDate.getTime())) {
    return null;
  }

  return (completedDate.getTime() - processDate.getTime()) / (1000 * 60);
}

export function getFileSizeRange(fileSize: number) {
  const sizeInMB = fileSize / (1024 * 1024);
  if (sizeInMB < 1) return "< 1MB";
  if (sizeInMB < 5) return "1-5MB";
  if (sizeInMB < 10) return "5-10MB";
  return "> 10MB";
}

export function addDuration(counterMap: Map<string, DurationCounter>, key: string, duration: number) {
  const current = counterMap.get(key) || { totalDuration: 0, count: 0 };
  counterMap.set(key, {
    totalDuration: current.totalDuration + duration,
    count: current.count + 1,
  });
}

export function getAverageDuration(durationData: DurationCounter) {
  return durationData.count > 0 ? durationData.totalDuration / durationData.count : 0;
}

export function getAverageScatterDuration(scatterData: ProcessQueueAnalyticsData["scatterData"]) {
  if (scatterData.length === 0) return 0;
  return scatterData.reduce((sum, item) => sum + item.y, 0) / scatterData.length;
}

export function buildDurationAverages(counterMap: Map<string, DurationCounter>) {
  return Array.from(counterMap.entries()).map(([type, data]) => ({
    type,
    avgDuration: getAverageDuration(data),
    count: data.count,
  }));
}

export function buildJobCounts(counterMap: Map<string, DurationCounter>) {
  return Array.from(counterMap.entries()).map(([type, data]) => ({
    type,
    count: data.count,
  }));
}

export function buildFileSizeRangeStats(fileSizeRanges: Map<string, DurationCounter>) {
  return Array.from(fileSizeRanges.entries()).map(([range, data]) => ({
    range,
    count: data.count,
    avgDuration: getAverageDuration(data),
  }));
}
