import type {
  ProcessQueueAnalyticsData,
  ProcessQueueItem,
} from "./process-queue-analytics-types";

export function buildProcessQueueScatterPoint(
  item: ProcessQueueItem,
  duration: number
): ProcessQueueAnalyticsData["scatterData"][number] {
  return {
    x: new Date(item.process_date || "").toISOString(),
    y: duration,
    status: item.status,
    fileName: item.file_name,
    fileSize: item.file_size,
    uploadDate: item.upload_date,
    processDate: item.process_date,
    completedDate: item.completed_date,
    error: item.error,
    errorDetails: item.error_details,
    positionTitle: item.position_title,
    source: item.source_name || item.source,
    source_logo: item.source_logo,
    id: item.id,
  };
}
