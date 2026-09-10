import type { QueueResponse } from './applicant-import-queue-types';
import type { UploadQueueItemLike } from './applicant-import-queue-util-types';

export function createUploadQueuePreviewFile(item: UploadQueueItemLike) {
  return {
    fileName: item.file_name || '',
    url: item.url || `/api/upload-queue/${item.id}/file`,
    label: 'Upload Queue File',
    updatedAt: item.upload_date,
    fileSize: item.file_size,
  };
}

export function getUploadQueueSummaryToastMessage(summary?: {
  queued: number;
  inprocess: number;
  success: number;
  error: number;
} | null) {
  if (!summary) {
    return null;
  }

  const { queued, inprocess, success, error } = summary;
  return `Queue updated: ${queued} queued, ${inprocess} processing, ${success} completed, ${error} errors`;
}

export function markUploadQueueItemQueued(queueData: QueueResponse | null, itemId: string): QueueResponse | null {
  if (!queueData) {
    return null;
  }

  return {
    ...queueData,
    data: queueData.data.map((item) => item.id === itemId
      ? {
          ...item,
          status: 'queued',
          error: undefined,
          error_details: undefined,
          process_date: undefined,
          completed_date: undefined,
        }
      : item
    ),
  };
}

export function removeUploadQueueItem(queueData: QueueResponse | null, itemId: string): QueueResponse | null {
  if (!queueData) {
    return null;
  }

  return {
    ...queueData,
    data: queueData.data.filter((item) => item.id !== itemId),
    total: Math.max(0, queueData.total - 1),
  };
}

export function getUploadQueueRetryErrorMessage(errorMessage?: string | null) {
  if (errorMessage?.includes('already a queued job with the same file path')) {
    return 'Cannot retry: there is already a queued job with the same file. Please wait for the existing job to complete or delete it first.';
  }

  if (errorMessage?.includes('Forbidden')) {
    return 'No permission';
  }

  return errorMessage || 'Failed to retry job';
}

export function getUploadQueueBulkRetryToastMessages(result: {
  successCount?: number;
  failedDetails?: Array<{ reason?: string }>;
} | null | undefined) {
  const failedDetails = Array.isArray(result?.failedDetails) ? result.failedDetails : [];
  const failedCount = failedDetails.length;
  const successCount = result?.successCount || 0;

  if (failedCount === 0) {
    return {
      successMessage: 'Jobs queued for retry',
      errorMessage: null,
    };
  }

  return {
    successMessage: successCount > 0 ? `${successCount} jobs queued for retry` : null,
    errorMessage: failedCount === 1
      ? `1 job failed to retry: ${failedDetails[0].reason}`
      : `${failedCount} jobs failed to retry. Check console for details.`,
  };
}
