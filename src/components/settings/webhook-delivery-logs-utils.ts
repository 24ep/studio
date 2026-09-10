import type {
  WebhookLog,
  WebhookLogsFiltersState,
  WebhookLogsPagination,
} from './webhook-delivery-logs-types';

export const DEFAULT_WEBHOOK_LOGS_FILTERS: WebhookLogsFiltersState = {
  event_type: '',
  success: '',
  start_date: '',
  end_date: '',
};

export const DEFAULT_WEBHOOK_LOGS_PAGINATION: WebhookLogsPagination = {
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 0,
};

export const WEBHOOK_LOG_EVENT_FILTER_OPTIONS = [
  { value: 'Applicant.created', label: 'Applicant Created' },
  { value: 'Applicant.updated', label: 'Applicant Updated' },
  { value: 'Applicant.deleted', label: 'Applicant Deleted' },
  { value: 'Applicant.stage_changed', label: 'Stage Changed' },
  { value: 'position.created', label: 'Position Created' },
  { value: 'position.updated', label: 'Position Updated' },
  { value: 'position.deleted', label: 'Position Deleted' },
  { value: 'user.created', label: 'User Created' },
  { value: 'user.updated', label: 'User Updated' },
  { value: 'user.deleted', label: 'User Deleted' },
  { value: 'resume.uploaded', label: 'Resume Uploaded' },
  { value: 'resume.processed', label: 'Resume Processed' },
  { value: 'comment.created', label: 'Comment Created' },
  { value: 'comment.updated', label: 'Comment Updated' },
  { value: 'comment.deleted', label: 'Comment Deleted' },
  { value: 'webhook.test', label: 'Webhook Test' },
];

export function buildWebhookDeliveryLogsQuery(
  pagination: Pick<WebhookLogsPagination, 'page' | 'limit'>,
  filters: WebhookLogsFiltersState
) {
  return new URLSearchParams({
    page: pagination.page.toString(),
    limit: pagination.limit.toString(),
    ...(filters.event_type && { event_type: filters.event_type }),
    ...(filters.success && { success: filters.success }),
    ...(filters.start_date && { start_date: filters.start_date }),
    ...(filters.end_date && { end_date: filters.end_date }),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getNullableString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function getNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function sanitizeWebhookDeliveryLog(log: unknown): WebhookLog {
  const record = isRecord(log) ? log : {};

  return {
    id: getString(record.id),
    event_type: getString(record.event_type),
    payload: record.payload ?? {},
    response_status: getNumber(record.response_status, NaN) || null,
    response_body: getNullableString(record.response_body),
    success: Boolean(record.success),
    error_message: getNullableString(record.error_message),
    duration_ms: getNumber(record.duration_ms, 0),
    createdAt: getString(record.createdAt, new Date().toISOString()),
  };
}

export function sanitizeWebhookDeliveryLogs(data: unknown) {
  const record = isRecord(data) ? data : {};

  return Array.isArray(record.logs)
    ? record.logs.map(sanitizeWebhookDeliveryLog)
    : [];
}

export function formatWebhookLogDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatWebhookLogDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function getWebhookLogStatusColor(success: boolean, status: number | null) {
  if (success) return 'bg-green-100 text-green-800';
  if (status && status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

export function getWebhookLogStatusText(success: boolean, status: number | null) {
  if (success) return 'Success';
  if (status && status >= 400 && status < 500) return `Client Error (${status})`;
  return 'Failed';
}
