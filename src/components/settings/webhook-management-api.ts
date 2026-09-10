import { getJsonErrorMessage, readJsonObject, readJsonOrFallback } from '../../lib/response-json';
import type { Webhook } from './webhook-management-data';
import { sanitizeWebhookList } from './webhook-management-utils';

type WebhookFetcher = typeof fetch;

export type WebhookBulkAction = 'enable' | 'disable' | 'test' | string;

export async function fetchWebhookConfigurations(fetcher: WebhookFetcher = fetch) {
  const response = await fetcher('/api/settings/webhooks');
  if (!response.ok) {
    const errorData = await readJsonObject(response);
    return {
      ok: false as const,
      webhooks: [] as Webhook[],
      errorMessage: getJsonErrorMessage(errorData, 'Failed to fetch webhooks'),
    };
  }

  return {
    ok: true as const,
    webhooks: sanitizeWebhookList(await readJsonOrFallback<unknown>(response, {})),
    errorMessage: null,
  };
}

export async function deleteWebhookConfiguration(id: string, fetcher: WebhookFetcher = fetch) {
  const response = await fetcher(`/api/settings/webhooks/${id}`, {
    method: 'DELETE',
  });

  return response.ok;
}

export async function updateWebhookBodyConfiguration({
  webhookId,
  config,
  fetcher = fetch,
}: {
  webhookId: string;
  config: unknown;
  fetcher?: WebhookFetcher;
}) {
  const response = await fetcher(`/api/settings/webhooks/${webhookId}/body-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (response.ok) {
    return { ok: true as const, errorMessage: null };
  }

  const error = await readJsonObject(response);
  return {
    ok: false as const,
    errorMessage: getJsonErrorMessage(error, 'Failed to update webhook body configuration'),
  };
}

export async function deleteWebhookConfigurationsBulk(ids: string[], fetcher: WebhookFetcher = fetch) {
  const deleteResults = await Promise.allSettled(
    ids.map((id) => fetcher(`/api/settings/webhooks/${id}`, { method: 'DELETE' })),
  );

  return deleteResults.filter(
    (result) => result.status === 'fulfilled' && result.value.ok,
  ).length;
}

export async function runWebhookBulkAction({
  action,
  webhookIds,
  fetcher = fetch,
}: {
  action: WebhookBulkAction;
  webhookIds: string[];
  fetcher?: WebhookFetcher;
}) {
  const response = await fetcher('/api/settings/webhooks/bulk-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, webhookIds }),
  });

  return response.ok;
}

export async function fetchWebhookExportBlob(fetcher: WebhookFetcher = fetch) {
  const response = await fetcher('/api/settings/webhooks/export');
  if (!response.ok) {
    return null;
  }

  return response.blob();
}
