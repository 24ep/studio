import type { Webhook } from './webhook-management-data';

export function getBulkActionPastTense(action: string) {
  switch (action) {
    case 'enable':
      return 'enabled';
    case 'disable':
      return 'disabled';
    case 'test':
      return 'tested';
    default:
      return 'processed';
  }
}

export function getFirstActiveWebhook(webhooks: Webhook[]) {
  return webhooks.find((webhook) => webhook.is_active) ?? null;
}

export function createWebhookExportFilename(date = new Date()) {
  return `webhooks-${date.toISOString().split('T')[0]}.csv`;
}
