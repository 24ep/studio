export interface WebhookAnalyticsActivity {
  id: string;
  event_type: string;
  success: boolean;
  response_status: number | null;
  createdAt: string;
  webhook: {
    name: string;
  };
}

export interface WebhookFailingSummary {
  webhook_id: string;
  name: string;
  failure_count: number;
}

export interface WebhookAnalytics {
  totalWebhooks: number;
  activeWebhooks: number;
  successRate: number;
  avgResponseTime: number;
  totalDeliveries: number;
  recentActivity: WebhookAnalyticsActivity[];
  topFailingWebhooks: WebhookFailingSummary[];
}

export interface WebhookTestResult {
  message?: string;
  error?: string;
  status?: number;
  webhook_id?: string;
  response?: unknown;
}

export type WebhookAnalyticsMetricIcon = 'avgResponse' | 'successRate' | 'totalDeliveries' | 'totalWebhooks';

export interface WebhookAnalyticsMetric {
  detail: string;
  icon: WebhookAnalyticsMetricIcon;
  key: string;
  label: string;
  value: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getNullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function sanitizeWebhookAnalyticsActivity(value: unknown): WebhookAnalyticsActivity | null {
  if (!isRecord(value)) {
    return null;
  }

  const webhook = getRecord(value.webhook);

  return {
    id: getString(value.id),
    event_type: getString(value.event_type),
    success: Boolean(value.success),
    response_status: getNullableNumber(value.response_status),
    createdAt: getString(value.createdAt, new Date().toISOString()),
    webhook: {
      name: getString(webhook.name, 'Unknown'),
    },
  };
}

function sanitizeWebhookFailingSummary(value: unknown): WebhookFailingSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    webhook_id: getString(value.webhook_id),
    name: getString(value.name, 'Unknown'),
    failure_count: getNumber(value.failure_count),
  };
}

export function sanitizeWebhookAnalytics(value: unknown): WebhookAnalytics {
  const record = getRecord(value);

  return {
    totalWebhooks: getNumber(record.totalWebhooks),
    activeWebhooks: getNumber(record.activeWebhooks),
    successRate: getNumber(record.successRate),
    avgResponseTime: getNumber(record.avgResponseTime),
    totalDeliveries: getNumber(record.totalDeliveries),
    recentActivity: Array.isArray(record.recentActivity)
      ? record.recentActivity
        .map(sanitizeWebhookAnalyticsActivity)
        .filter((activity): activity is WebhookAnalyticsActivity => activity !== null)
      : [],
    topFailingWebhooks: Array.isArray(record.topFailingWebhooks)
      ? record.topFailingWebhooks
        .map(sanitizeWebhookFailingSummary)
        .filter((webhook): webhook is WebhookFailingSummary => webhook !== null)
      : [],
  };
}

export function sanitizeWebhookTestResult(value: unknown): WebhookTestResult {
  const record = getRecord(value);

  return {
    ...(typeof record.message === 'string' && { message: record.message }),
    ...(typeof record.error === 'string' && { error: record.error }),
    ...(typeof record.status === 'number' && Number.isFinite(record.status) && { status: record.status }),
    ...(typeof record.webhook_id === 'string' && { webhook_id: record.webhook_id }),
    ...(record.response !== undefined && { response: record.response }),
  };
}

export function getWebhookTestErrorMessage(value: unknown, fallback = 'Webhook test failed') {
  const record = getRecord(value);
  return getString(record.message, fallback);
}

export function formatWebhookSuccessRate(value: number) {
  return value.toFixed(1);
}

export function buildWebhookAnalyticsMetrics(analytics: WebhookAnalytics): WebhookAnalyticsMetric[] {
  return [
    {
      key: 'total-webhooks',
      icon: 'totalWebhooks',
      label: 'Total Webhooks',
      value: String(analytics.totalWebhooks),
      detail: `${analytics.activeWebhooks} active`,
    },
    {
      key: 'total-deliveries',
      icon: 'totalDeliveries',
      label: 'Total Deliveries',
      value: String(analytics.totalDeliveries),
      detail: 'Last 24 hours',
    },
    {
      key: 'success-rate',
      icon: 'successRate',
      label: 'Success Rate',
      value: `${formatWebhookSuccessRate(analytics.successRate)}%`,
      detail: 'Success percentage',
    },
    {
      key: 'avg-response',
      icon: 'avgResponse',
      label: 'Avg Response',
      value: `${Math.round(analytics.avgResponseTime || 0)}ms`,
      detail: 'Average duration',
    },
  ];
}
