import type { ProcessQueueItem } from "./process-queue-analytics-types";

export function incrementCounter(counterMap: Map<string, number>, key: string) {
  counterMap.set(key, (counterMap.get(key) || 0) + 1);
}

export function getQueueItemErrorReason(item: ProcessQueueItem) {
  return item.error ? item.error_details || item.error : null;
}

export function buildErrorReasonCounts(errorMap: Map<string, number>) {
  return Array.from(errorMap.entries()).map(([reason, count]) => ({
    reason,
    count,
  }));
}
