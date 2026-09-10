import type {
  QueueStatus,
  QueueStatusIconType,
  QueueStatusLike,
  UploadQueueStatusIconModel,
} from './applicant-import-queue-util-types';

type UploadQueueBadgeVariant = 'success' | 'secondary' | 'outline' | 'destructive';

const RETRYABLE_UPLOAD_QUEUE_STATUSES = new Set<QueueStatus>(['failed', 'success']);
const CANCELLABLE_UPLOAD_QUEUE_STATUSES = new Set<QueueStatus>(['queued', 'inprocess']);
const DELETABLE_UPLOAD_QUEUE_STATUSES = new Set<QueueStatus>(['success', 'failed', 'cancelled']);

const UPLOAD_QUEUE_STATUS_COLORS: Partial<Record<QueueStatus, string>> = {
  queued: 'bg-blue-100 text-blue-800 border-blue-200',
  inprocess: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  success: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  fail: 'bg-red-100 text-red-800 border-red-200',
  error: 'bg-red-100 text-red-800 border-red-200',
};

const UPLOAD_QUEUE_STATUS_DISPLAY_TEXT: Partial<Record<QueueStatus, string>> = {
  queued: 'In Queue',
  inprocess: 'Processing',
  success: 'Success',
  failed: 'Failed',
  fail: 'Failed',
  error: 'Failed',
};

const UPLOAD_QUEUE_STATUS_ICON_TYPES: Partial<Record<QueueStatus, QueueStatusIconType>> = {
  queued: 'queued',
  inprocess: 'processing',
  success: 'success',
  failed: 'failed',
  fail: 'failed',
  error: 'failed',
};

const UPLOAD_QUEUE_STATUS_BADGE_VARIANTS: Partial<Record<QueueStatus, UploadQueueBadgeVariant>> = {
  queued: 'secondary',
  inprocess: 'outline',
  success: 'success',
  failed: 'destructive',
  fail: 'destructive',
  error: 'destructive',
};

const UPLOAD_QUEUE_STATUS_ICON_CLASS_NAMES: Record<QueueStatusIconType, string> = {
  queued: 'h-5 w-5 text-blue-500 dark:text-blue-400',
  processing: 'h-5 w-5 text-yellow-500 dark:text-yellow-400 animate-spin',
  success: 'h-5 w-5 text-green-500 dark:text-green-400',
  failed: 'h-5 w-5 text-red-500 dark:text-red-400',
  unknown: 'h-5 w-5 text-gray-500 dark:text-gray-400',
};

export function getUploadQueueStatusColor(status: QueueStatus) {
  return UPLOAD_QUEUE_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

export function canRetryUploadQueueItem(item: QueueStatusLike) {
  return RETRYABLE_UPLOAD_QUEUE_STATUSES.has(item.status);
}

export function canCancelUploadQueueItem(item: QueueStatusLike) {
  return CANCELLABLE_UPLOAD_QUEUE_STATUSES.has(item.status);
}

export function canDeleteUploadQueueItem(item: QueueStatusLike) {
  return DELETABLE_UPLOAD_QUEUE_STATUSES.has(item.status);
}

export function canProcessUploadQueueItem(item: QueueStatusLike) {
  return item.status === 'queued';
}

export function getUploadQueueStatusDisplayText(status: QueueStatus) {
  return UPLOAD_QUEUE_STATUS_DISPLAY_TEXT[status] || status;
}

export function getUploadQueueStatusIconType(status: QueueStatus) {
  return UPLOAD_QUEUE_STATUS_ICON_TYPES[status] || 'unknown';
}

export function getUploadQueueStatusIconModel(status: QueueStatus): UploadQueueStatusIconModel {
  const type = getUploadQueueStatusIconType(status);

  return {
    type,
    className: UPLOAD_QUEUE_STATUS_ICON_CLASS_NAMES[type],
  };
}

export function getUploadQueueStatusBadgeVariant(status: QueueStatus): UploadQueueBadgeVariant {
  return UPLOAD_QUEUE_STATUS_BADGE_VARIANTS[status] || 'secondary';
}
