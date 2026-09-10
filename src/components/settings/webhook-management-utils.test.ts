import { describe, expect, it } from 'vitest';

import {
  createWebhookExportFilename,
  getBulkActionPastTense,
  getFirstActiveWebhook,
} from './webhook-management-controller-utils';
import {
  addCustomHeaderRow,
  addWebhookCategoryEvents,
  buildWebhookLogsQuery,
  buildWebhookSubmitPayload,
  countSelectedWebhookCategoryEvents,
  createDefaultWebhookFormData,
  createWebhookFormDataFromWebhook,
  customHeaderRowsToRecord,
  areAllWebhooksSelected,
  filterWebhooks,
  findWebhookEventById,
  createWebhookTestPayload,
  formatWebhookDate,
  getAllWebhookEventIds,
  getSelectedWebhookCount,
  getWebhookOverviewStats,
  headerRecordToRows,
  isWebhookSelected,
  removeCustomHeaderRow,
  removeWebhookCategoryEvents,
  sanitizeWebhookList,
  toggleWebhookEvent,
  updateCustomHeaderRow,
} from './webhook-management-utils';

describe('webhook management utilities', () => {
  it('creates default and editable webhook form data', () => {
    expect(createDefaultWebhookFormData()).toEqual({
      name: '',
      url: '',
      events: [],
      method: 'POST',
      is_active: true,
      auth_type: 'none',
      headers: {},
      retry_count: 3,
      timeout: 30,
    });

    const webhook = sanitizeWebhookList([{
      id: 'webhook-1',
      name: 'Applicant updates',
      url: 'https://example.test/webhook',
      events: ['Applicant.created'],
      method: 'PATCH',
      is_active: false,
      auth_type: 'bearer',
      auth_token: 'secret',
      headers: { Existing: 'yes' },
      retry_count: 5,
      timeout: 45,
    }])[0];

    expect(createWebhookFormDataFromWebhook(webhook)).toEqual({
      name: 'Applicant updates',
      url: 'https://example.test/webhook',
      events: ['Applicant.created'],
      method: 'PATCH',
      is_active: false,
      auth_type: 'bearer',
      auth_username: undefined,
      auth_password: undefined,
      auth_token: 'secret',
      auth_header_name: undefined,
      auth_header_value: undefined,
      headers: { Existing: 'yes' },
      retry_count: 5,
      timeout: 45,
    });
  });

  it('sanitizes webhook API data with defaults', () => {
    expect(sanitizeWebhookList([{
      id: 'webhook-1',
      name: 'Applicant updates',
      url: 'https://example.test/webhook',
      events: 'bad',
      is_active: 1,
    }])).toMatchObject([{
      id: 'webhook-1',
      name: 'Applicant updates',
      url: 'https://example.test/webhook',
      events: [],
      method: 'POST',
      is_active: true,
      auth_type: 'none',
      retry_count: 3,
      timeout: 30,
      headers: {},
      body_configs: [],
    }]);

    expect(sanitizeWebhookList({})).toEqual([]);
  });

  it('drops malformed nested webhook fields while preserving usable values', () => {
    expect(sanitizeWebhookList([{
      id: 'webhook-1',
      name: 'Applicant updates',
      url: 'https://example.test/webhook',
      events: ['Applicant.created', 123, null],
      method: 'DELETE',
      auth_type: 'custom',
      headers: { Good: 'yes', Bad: 123 },
      field_mappings: [
        { source_field: 'name', target_field: 'applicant.name', transform: 'trim' },
        { source_field: '', target_field: 'ignored' },
      ],
      body_configs: [
        {
          id: 'config-1',
          event_type: 'Applicant.created',
          body_template: '{"name":"{{name}}"}',
          field_mappings: [
            { source_field: 'email', target_field: 'applicant.email', transform: 'uppercase' },
            { source_field: 'bad', target_field: 'bad', transform: 'unknown' },
          ],
          is_active: true,
        },
        'bad',
      ],
    }])).toMatchObject([{
      events: ['Applicant.created'],
      method: 'POST',
      auth_type: 'none',
      headers: { Good: 'yes' },
      field_mappings: [
        { source_field: 'name', target_field: 'applicant.name', transform: 'trim' },
      ],
      body_configs: [{
        id: 'config-1',
        event_type: 'Applicant.created',
        body_template: '{"name":"{{name}}"}',
        field_mappings: [
          { source_field: 'email', target_field: 'applicant.email', transform: 'uppercase' },
          { source_field: 'bad', target_field: 'bad' },
        ],
        is_active: true,
      }],
    }]);

    expect(sanitizeWebhookList([{
      field_mappings: [{ source_field: '', target_field: '' }],
      body_configs: [{
        event_type: 'Applicant.updated',
        body_template: '{}',
        field_mappings: 'bad',
      }],
    }])).toMatchObject([{
      field_mappings: null,
      body_configs: [{
        event_type: 'Applicant.updated',
        body_template: '{}',
        field_mappings: [],
      }],
    }]);
  });

  it('converts custom header rows and records', () => {
    expect(customHeaderRowsToRecord({ Existing: 'yes' }, [
      { key: 'X-Test', value: '1' },
      { key: '', value: 'ignored' },
      { key: 'Empty', value: '' },
    ])).toEqual({
      Existing: 'yes',
      'X-Test': '1',
    });

    expect(headerRecordToRows({ A: '1', B: '2' })).toEqual([
      { key: 'A', value: '1' },
      { key: 'B', value: '2' },
    ]);

    expect(addCustomHeaderRow([{ key: 'A', value: '1' }])).toEqual([
      { key: 'A', value: '1' },
      { key: '', value: '' },
    ]);
    expect(removeCustomHeaderRow([{ key: 'A', value: '1' }, { key: 'B', value: '2' }], 0)).toEqual([
      { key: 'B', value: '2' },
    ]);
    expect(updateCustomHeaderRow([{ key: 'A', value: '1' }], 0, 'value', '2')).toEqual([
      { key: 'A', value: '2' },
    ]);
  });

  it('updates selected webhook events', () => {
    expect(toggleWebhookEvent(['a'], 'a')).toEqual([]);
    expect(toggleWebhookEvent(['a'], 'b')).toEqual(['a', 'b']);

    const categories = [
      { events: [{ id: 'a' }, { id: 'b' }] },
      { events: [{ id: 'c' }] },
    ];

    expect(getAllWebhookEventIds(categories)).toEqual(['a', 'b', 'c']);
    expect(findWebhookEventById(categories, 'b')).toEqual({ id: 'b' });
    expect(findWebhookEventById(categories, 'missing')).toBeUndefined();
    expect(addWebhookCategoryEvents(['a'], [{ id: 'a' }, { id: 'b' }])).toEqual(['a', 'b']);
    expect(removeWebhookCategoryEvents(['a', 'b', 'c'], [{ id: 'a' }, { id: 'b' }])).toEqual(['c']);
    expect(countSelectedWebhookCategoryEvents(['a', 'c'], [{ id: 'a' }, { id: 'b' }])).toBe(1);
  });

  it('builds a webhook submit payload with merged headers', () => {
    expect(buildWebhookSubmitPayload({
      name: 'Hook',
      url: 'https://example.test',
      events: ['a'],
      method: 'POST',
      is_active: true,
      auth_type: 'none',
      headers: { Existing: 'yes' },
      retry_count: 3,
      timeout: 30,
    }, [{ key: 'X-Test', value: '1' }])).toMatchObject({
      name: 'Hook',
      headers: {
        Existing: 'yes',
        'X-Test': '1',
      },
    });
  });

  it('builds webhook log query strings for list and export views', () => {
    expect(buildWebhookLogsQuery({
      page: 2,
      filter: 'failed',
      search: 'timeout',
    }).toString()).toBe('page=2&filter=failed&search=timeout');

    expect(buildWebhookLogsQuery({
      page: 1,
      limit: 20,
      filter: 'all',
      search: '',
    }).toString()).toBe('page=1&limit=20&filter=all&search=');

    expect(buildWebhookLogsQuery({
      filter: 'success',
      search: 'applicant created',
    }).toString()).toBe('filter=success&search=applicant+created');
  });

  it('creates webhook test payloads and formats dates', () => {
    expect(createWebhookTestPayload(new Date('2026-01-02T03:04:05.000Z'))).toBe('{\n  "test": true,\n  "timestamp": "2026-01-02T03:04:05.000Z"\n}');
    expect(formatWebhookDate('not-a-date')).toBe('Invalid date');
  });

  it('summarizes webhook overview stats', () => {
    const webhooks = sanitizeWebhookList([
      { id: 'a', name: 'A', url: 'https://a.test', events: ['created'], is_active: true },
      { id: 'b', name: 'B', url: 'https://b.test', events: ['created', 'updated'], is_active: false },
    ]);

    expect(getWebhookOverviewStats(webhooks, 93.456, false)).toEqual({
      totalWebhooks: 2,
      activeWebhooks: 1,
      totalEvents: 3,
      successRateLabel: '93.5%',
    });
    expect(getWebhookOverviewStats(webhooks, undefined, true).successRateLabel).toBe('...');
    expect(getWebhookOverviewStats(null, undefined, false).successRateLabel).toBe('N/A');
  });

  it('filters webhooks by status and search text', () => {
    const webhooks = sanitizeWebhookList([
      { id: 'a', name: 'Applicant updates', url: 'https://example.test/applicants', is_active: true },
      { id: 'b', name: 'Audit logs', url: 'https://example.test/audit', is_active: false },
    ]);

    expect(filterWebhooks(webhooks, 'active', '').map(webhook => webhook.id)).toEqual(['a']);
    expect(filterWebhooks(webhooks, 'inactive', '').map(webhook => webhook.id)).toEqual(['b']);
    expect(filterWebhooks(webhooks, 'all', 'AUDIT').map(webhook => webhook.id)).toEqual(['b']);
    expect(filterWebhooks(webhooks, 'all', 'applicants').map(webhook => webhook.id)).toEqual(['a']);
    expect(filterWebhooks(null, 'all', '')).toEqual([]);
  });

  it('summarizes webhook selection state', () => {
    const webhooks = sanitizeWebhookList([
      { id: 'a', name: 'A', url: 'https://a.test' },
      { id: 'b', name: 'B', url: 'https://b.test' },
    ]);
    const selected = new Set(['a', 'b']);

    expect(getSelectedWebhookCount(selected)).toBe(2);
    expect(isWebhookSelected(selected, 'a')).toBe(true);
    expect(isWebhookSelected(selected, 'c')).toBe(false);
    expect(areAllWebhooksSelected(selected, webhooks)).toBe(true);
    expect(areAllWebhooksSelected(new Set(['a']), webhooks)).toBe(false);
    expect(areAllWebhooksSelected(selected, [])).toBe(false);
  });

  it('normalizes controller labels and active webhook lookup', () => {
    expect(getBulkActionPastTense('enable')).toBe('enabled');
    expect(getBulkActionPastTense('disable')).toBe('disabled');
    expect(getBulkActionPastTense('test')).toBe('tested');
    expect(getBulkActionPastTense('archive')).toBe('processed');
    expect(createWebhookExportFilename(new Date('2026-06-09T08:15:00.000Z'))).toBe('webhooks-2026-06-09.csv');

    const webhooks = sanitizeWebhookList([
      { id: 'inactive', name: 'Inactive', url: 'https://inactive.test', is_active: false },
      { id: 'active', name: 'Active', url: 'https://active.test', is_active: true },
    ]);
    expect(getFirstActiveWebhook(webhooks)?.id).toBe('active');
    expect(getFirstActiveWebhook([])).toBeNull();
  });
});
