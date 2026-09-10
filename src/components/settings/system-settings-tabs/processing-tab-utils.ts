import type { WebhookTestResponse } from './processing-tab-types';
import { readJsonOrFallback } from '../../../lib/response-json';

export function buildWebhookTestPayload(webhookUrl: string, webhookToken: string) {
  return {
    webhookUrl,
    webhookToken
  };
}

export function getWebhookTestToastMessage(result: WebhookTestResponse):
  | { type: 'success'; message: string }
  | { type: 'error'; message: string } {
  if (result.success) {
    return {
      type: 'success',
      message: `Webhook test successful! Response time: ${result.responseTime}`
    };
  }

  return {
    type: 'error',
    message: `Webhook test failed: ${result.error}`
  };
}

export async function testProcessingWebhook(
  webhookUrl: string,
  webhookToken: string
): Promise<WebhookTestResponse> {
  const response = await fetch('/api/settings/webhook-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildWebhookTestPayload(webhookUrl, webhookToken))
  });

  return readJsonOrFallback<WebhookTestResponse>(response, {});
}
