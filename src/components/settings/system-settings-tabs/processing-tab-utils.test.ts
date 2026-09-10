import { describe, expect, it } from 'vitest';

import { buildWebhookTestPayload, getWebhookTestToastMessage } from './processing-tab-utils';

describe('processing tab utilities', () => {
  it('builds the webhook test payload', () => {
    expect(buildWebhookTestPayload('https://example.com/hook', 'token')).toEqual({
      webhookUrl: 'https://example.com/hook',
      webhookToken: 'token'
    });
  });

  it('formats webhook test toast messages', () => {
    expect(getWebhookTestToastMessage({ success: true, responseTime: '42ms' })).toEqual({
      type: 'success',
      message: 'Webhook test successful! Response time: 42ms'
    });
    expect(getWebhookTestToastMessage({ success: false, error: 'timeout' })).toEqual({
      type: 'error',
      message: 'Webhook test failed: timeout'
    });
  });
});
