import type { UploadQueueBulkFailedDetail } from './upload-queue-bulk-action-types';

export type UploadQueueBulkActionSummary = {
  successCount: number;
  failCount: number;
  failedDetails: UploadQueueBulkFailedDetail[];
};

export function createEmptyBulkActionSummary(): UploadQueueBulkActionSummary {
  return {
    successCount: 0,
    failCount: 0,
    failedDetails: [],
  };
}

export function recordBulkItemResult(
  summary: UploadQueueBulkActionSummary,
  itemId: string,
  result: { success: boolean; reason?: string }
) {
  if (result.success) {
    summary.successCount++;
    return;
  }

  summary.failCount++;
  summary.failedDetails.push({ itemId, reason: result.reason || 'Unknown error' });
}

export function buildBulkActionMessage(action: string, summary: UploadQueueBulkActionSummary) {
  let message = `Successfully ${action}ed ${summary.successCount} item${summary.successCount !== 1 ? 's' : ''}`;
  if (summary.failCount > 0) {
    message += `, failed ${summary.failCount} item${summary.failCount !== 1 ? 's' : ''}`;
  }
  return message;
}
