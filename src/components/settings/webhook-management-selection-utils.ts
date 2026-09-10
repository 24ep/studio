import type { Webhook } from './webhook-management-data';

export type WebhookStatusFilter = 'all' | 'active' | 'inactive';

export function getWebhookOverviewStats(
  webhooks: Webhook[] | null | undefined,
  successRate: number | null | undefined,
  isLoadingAnalytics: boolean
) {
  const safeWebhooks = Array.isArray(webhooks) ? webhooks : [];
  const totalEvents = safeWebhooks.reduce((acc, webhook) => acc + webhook.events.length, 0);

  return {
    totalWebhooks: safeWebhooks.length,
    activeWebhooks: safeWebhooks.filter(webhook => webhook.is_active).length,
    totalEvents,
    successRateLabel: successRate !== null && successRate !== undefined
      ? `${successRate.toFixed(1)}%`
      : isLoadingAnalytics
        ? '...'
        : 'N/A',
  };
}

export function filterWebhooks(
  webhooks: Webhook[] | null | undefined,
  statusFilter: WebhookStatusFilter,
  searchTerm: string
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const safeWebhooks = Array.isArray(webhooks) ? webhooks : [];

  return safeWebhooks.filter(webhook => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && webhook.is_active) ||
      (statusFilter === 'inactive' && !webhook.is_active);

    const matchesSearch =
      normalizedSearch === '' ||
      webhook.name.toLowerCase().includes(normalizedSearch) ||
      webhook.url.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });
}

export function getSelectedWebhookCount(selectedWebhooks: Set<string> | null | undefined) {
  return selectedWebhooks instanceof Set ? selectedWebhooks.size : 0;
}

export function isWebhookSelected(selectedWebhooks: Set<string> | null | undefined, webhookId: string) {
  return selectedWebhooks instanceof Set ? selectedWebhooks.has(webhookId) : false;
}

export function areAllWebhooksSelected(
  selectedWebhooks: Set<string> | null | undefined,
  webhooks: Webhook[] | null | undefined
) {
  const safeWebhooks = Array.isArray(webhooks) ? webhooks : [];
  return selectedWebhooks instanceof Set && safeWebhooks.length > 0 && selectedWebhooks.size === safeWebhooks.length;
}
