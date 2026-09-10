import { describe, expect, it } from 'vitest';

import {
  buildWebhookAnalyticsMetrics,
  formatWebhookSuccessRate,
  getWebhookTestErrorMessage,
  sanitizeWebhookAnalytics,
  sanitizeWebhookTestResult,
} from './webhook-analytics-utils';

describe('webhook analytics utilities', () => {
  it('sanitizes analytics payloads with defaults for malformed values', () => {
    expect(sanitizeWebhookAnalytics({
      totalWebhooks: 2,
      activeWebhooks: 1,
      successRate: 95.55,
      avgResponseTime: 123.4,
      totalDeliveries: 7,
      recentActivity: [
        {
          id: 'log-1',
          event_type: 'Applicant.created',
          success: true,
          response_status: 200,
          createdAt: '2026-01-01T00:00:00.000Z',
          webhook: { name: 'ATS sync' },
        },
        'bad',
      ],
      topFailingWebhooks: [
        { webhook_id: 'webhook-1', name: 'CRM', failure_count: 3 },
        null,
      ],
    })).toMatchObject({
      totalWebhooks: 2,
      activeWebhooks: 1,
      successRate: 95.55,
      avgResponseTime: 123.4,
      totalDeliveries: 7,
      recentActivity: [{
        id: 'log-1',
        webhook: { name: 'ATS sync' },
      }],
      topFailingWebhooks: [{
        webhook_id: 'webhook-1',
        name: 'CRM',
        failure_count: 3,
      }],
    });

    expect(sanitizeWebhookAnalytics(null)).toMatchObject({
      totalWebhooks: 0,
      recentActivity: [],
      topFailingWebhooks: [],
    });
  });

  it('sanitizes webhook test results and error messages', () => {
    expect(sanitizeWebhookTestResult({
      message: 'Sent',
      status: 200,
      webhook_id: 'webhook-1',
      response: { ok: true },
    })).toEqual({
      message: 'Sent',
      status: 200,
      webhook_id: 'webhook-1',
      response: { ok: true },
    });

    expect(sanitizeWebhookTestResult({ status: 'bad' })).toEqual({});
    expect(getWebhookTestErrorMessage({ message: 'Denied' })).toBe('Denied');
    expect(getWebhookTestErrorMessage(null)).toBe('Webhook test failed');
  });

  it('formats success rates consistently', () => {
    expect(formatWebhookSuccessRate(93.456)).toBe('93.5');
  });

  it('builds analytics metric cards from sanitized data', () => {
    const metrics = buildWebhookAnalyticsMetrics(sanitizeWebhookAnalytics({
      totalWebhooks: 3,
      activeWebhooks: 2,
      successRate: 91.25,
      avgResponseTime: 128.6,
      totalDeliveries: 12,
    }));

    expect(metrics.map((metric) => [metric.label, metric.value, metric.detail])).toEqual([
      ['Total Webhooks', '3', '2 active'],
      ['Total Deliveries', '12', 'Last 24 hours'],
      ['Success Rate', '91.3%', 'Success percentage'],
      ['Avg Response', '129ms', 'Average duration'],
    ]);
  });
});
