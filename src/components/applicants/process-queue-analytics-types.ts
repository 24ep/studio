export interface ProcessQueueItem {
  id: string;
  file_name: string;
  file_size: number;
  status: string;
  upload_date: string;
  process_date: string | null;
  completed_date: string | null;
  error: string | null;
  error_details: string | null;
  position_title: string | null;
  source: string | null;
  source_id: string | null;
  source_name: string | null;
  source_logo: string | null;
}

export interface ProcessQueueAnalyticsData {
  scatterData: Array<{
    x: string;
    y: number;
    status: string;
    fileName: string;
    fileSize: number;
    uploadDate: string;
    processDate: string | null;
    completedDate: string | null;
    error: string | null;
    errorDetails: string | null;
    positionTitle: string | null;
    source: string | null;
    source_logo: string | null;
    id: string;
  }>;
  stats: {
    totalJobs: number;
    avgDuration: number;
    avgDurationByType: Array<{ type: string; avgDuration: number; count: number }>;
    jobsByType: Array<{ type: string; count: number }>;
    errorsByReason: Array<{ reason: string; count: number }>;
    fileSizeRanges: Array<{ range: string; count: number; avgDuration: number }>;
    sourceAnalytics: Array<{
      sourceId: string | null;
      sourceName: string;
      sourceLogo: string | null;
      totalJobs: number;
      successJobs: number;
      failedJobs: number;
      successRate: number;
      failedRate: number;
      avgDuration: number;
      totalDuration: number;
    }>;
  };
}

export interface ProcessQueueListResponse {
  data?: ProcessQueueItem[] | null;
  total?: number | null;
}

export interface ProcessQueueErrorExportRow {
  "No."?: number | string;
  "Error Reason": string;
  "Error Category"?: string;
  "Count": number;
  "Percentage": string;
  "Severity"?: "high" | "medium" | "low";
  "Total Jobs"?: number;
  "Export Date"?: string;
}
