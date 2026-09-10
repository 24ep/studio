export const UPLOAD_QUEUE_LOADING_SKELETON_COUNT = 5;
export const UPLOAD_QUEUE_ITEM_STAGGER_DELAY_MS = 20;

export function formatUploadQueueDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

export function formatUploadQueueFileSize(bytes: number | null | undefined) {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes < 0) {
    return 'Unknown size';
  }

  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const sizeIndex = Math.max(0, Math.min(i, sizes.length - 1));

  return `${parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2))} ${sizes[sizeIndex]}`;
}

export function calculateUploadQueueDuration(processDate?: string, completedDate?: string, now = new Date()) {
  if (!processDate) {
    return '-';
  }

  const start = new Date(processDate);
  const end = completedDate ? new Date(completedDate) : now;
  const diffMs = end.getTime() - start.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}m`;
  }

  if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds % 60}s`;
  }

  return `${diffSeconds}s`;
}

export function getUploadQueueTotalPages(totalItems: number | null | undefined, pageSize: number) {
  if (!totalItems || pageSize <= 0) {
    return 0;
  }

  return Math.ceil(totalItems / pageSize);
}

export function shouldShowUploadQueuePagination(totalPages: number) {
  return totalPages > 1;
}

export function getUploadQueuePaginationLabel(page: number, totalPages: number) {
  return `Page ${page} of ${totalPages}`;
}

export function isUploadQueuePreviousPageDisabled(page: number) {
  return page === 1;
}

export function isUploadQueueNextPageDisabled(page: number, totalPages: number) {
  return page === totalPages;
}

export function getUploadQueueItemsDescription(totalItems?: number | null) {
  return totalItems === null || totalItems === undefined
    ? 'Loading...'
    : `${totalItems} total items`;
}

export function getUploadQueueLastUpdatedText(lastUpdate: Date) {
  return `Last updated: ${formatUploadQueueDate(lastUpdate.toISOString())}`;
}

export function getUploadQueueRealtimeStatusText(realtimeConnected: boolean) {
  return realtimeConnected ? 'Live' : 'Offline';
}

export function getUploadQueueRefreshIconClassName(loading: boolean) {
  return loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4';
}

export function getUploadQueueItemAnimationDelay(index: number) {
  return index * UPLOAD_QUEUE_ITEM_STAGGER_DELAY_MS;
}

export function getUploadQueueSourceLine(item: { source_name?: string | null; sub_source?: string | null }) {
  if (!item.source_name && !item.sub_source) {
    return null;
  }

  return `Source: ${item.source_name || 'Unknown'}${item.sub_source ? ` - ${item.sub_source}` : ''}`;
}

export function getUploadQueueProcessedApplicantsText(item: {
  processed_applicants?: number | null;
  total_applicants?: number | null;
}) {
  if (item.processed_applicants === undefined || item.total_applicants === undefined) {
    return null;
  }

  return `Processed: ${item.processed_applicants} / ${item.total_applicants} Applicants`;
}

export function getUploadQueueApplicantProgressText(item: {
  processed_applicants?: number | null;
  total_applicants?: number | null;
}) {
  if (item.processed_applicants === undefined || item.total_applicants === undefined) {
    return null;
  }

  return `${item.processed_applicants} of ${item.total_applicants} Applicants`;
}

export function getUploadQueueProgressText(progress: number) {
  return `${progress}% complete`;
}
