import { describe, expect, it } from 'vitest';

import {
  buildWebhookDeliveryLogsQuery,
  DEFAULT_WEBHOOK_LOGS_FILTERS,
  DEFAULT_WEBHOOK_LOGS_PAGINATION,
  formatWebhookLogDuration,
  getWebhookLogStatusText,
  sanitizeWebhookDeliveryLog,
  sanitizeWebhookDeliveryLogs,
} from './webhook-delivery-logs-utils';

describe('webhook delivery log utilities', () => {
  it('builds delivery log query strings from pagination and filters', () => {
    expect(buildWebhookDeliveryLogsQuery(
      { page: 2, limit: 25 },
      {
        ...DEFAULT_WEBHOOK_LOGS_FILTERS,
        event_type: 'Applicant.created',
        success: 'true',
      },
    ).toString()).toBe('page=2&limit=25&event_type=Applicant.created&success=true');

    expect(buildWebhookDeliveryLogsQuery(
      DEFAULT_WEBHOOK_LOGS_PAGINATION,
      DEFAULT_WEBHOOK_LOGS_FILTERS,
    ).toString()).toBe('page=1&limit=50');
  });

  it('sanitizes unknown delivery log payloads', () => {
    expect(sanitizeWebhookDeliveryLog({
      id: 'log-1',
      event_type: 'Applicant.created',
      payload: { applicantId: 'applicant-1' },
      response_status: 500,
      response_body: 'failed',
      success: false,
      error_message: 'timeout',
      duration_ms: 1200,
      createdAt: '2026-01-01T00:00:00.000Z',
    })).toEqual({
      id: 'log-1',
      event_type: 'Applicant.created',
      payload: { applicantId: 'applicant-1' },
      response_status: 500,
      response_body: 'failed',
      success: false,
      error_message: 'timeout',
      duration_ms: 1200,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    expect(sanitizeWebhookDeliveryLog('bad')).toMatchObject({
      id: '',
      event_type: '',
      payload: {},
      response_status: null,
      response_body: null,
      success: false,
      error_message: null,
      duration_ms: 0,
    });
  });

  it('sanitizes delivery log lists and formats status labels', () => {
    expect(sanitizeWebhookDeliveryLogs({
      logs: [
        { id: 'log-1', event_type: 'Applicant.created', success: true },
        'bad',
      ],
    }).map(log => log.id)).toEqual(['log-1', '']);

    expect(sanitizeWebhookDeliveryLogs({ logs: 'bad' })).toEqual([]);
    expect(formatWebhookLogDuration(999)).toBe('999ms');
    expect(formatWebhookLogDuration(1250)).toBe('1.25s');
    expect(getWebhookLogStatusText(false, 404)).toBe('Client Error (404)');
  });
});
