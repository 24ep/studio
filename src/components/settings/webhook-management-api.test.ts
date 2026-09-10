import { describe, expect, it, vi } from 'vitest';

import {
  deleteWebhookConfiguration,
  deleteWebhookConfigurationsBulk,
  fetchWebhookConfigurations,
  fetchWebhookExportBlob,
  runWebhookBulkAction,
  updateWebhookBodyConfiguration,
} from './webhook-management-api';

function response(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
    blob: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('webhook management API helpers', () => {
  it('fetches and sanitizes webhook configurations', async () => {
    const fetcher = vi.fn().mockResolvedValue(response([
      { id: 'webhook-1', name: 'Hook', url: 'https://example.test', events: 'bad' },
    ]));

    await expect(fetchWebhookConfigurations(fetcher)).resolves.toMatchObject({
      ok: true,
      webhooks: [{
        id: 'webhook-1',
        name: 'Hook',
        events: [],
        method: 'POST',
      }],
      errorMessage: null,
    });
    expect(fetcher).toHaveBeenCalledWith('/api/settings/webhooks');
  });

  it('returns fetch errors with fallback messages', async () => {
    await expect(fetchWebhookConfigurations(
      vi.fn().mockResolvedValue(response({ message: 'No access' }, false))
    )).resolves.toEqual({
      ok: false,
      webhooks: [],
      errorMessage: 'No access',
    });

    await expect(fetchWebhookConfigurations(
      vi.fn().mockResolvedValue(response({}, false))
    )).resolves.toEqual({
      ok: false,
      webhooks: [],
      errorMessage: 'Failed to fetch webhooks',
    });
  });

  it('deletes one webhook or a bulk set', async () => {
    const deleteFetcher = vi.fn().mockResolvedValue(response({}, true));
    await expect(deleteWebhookConfiguration('webhook-1', deleteFetcher)).resolves.toBe(true);
    expect(deleteFetcher).toHaveBeenCalledWith('/api/settings/webhooks/webhook-1', {
      method: 'DELETE',
    });

    const bulkFetcher = vi.fn()
      .mockResolvedValueOnce(response({}, true))
      .mockResolvedValueOnce(response({}, false));
    await expect(deleteWebhookConfigurationsBulk(['a', 'b'], bulkFetcher)).resolves.toBe(1);
  });

  it('updates body configuration with API error details', async () => {
    const fetcher = vi.fn().mockResolvedValue(response({ ok: true }));
    await expect(updateWebhookBodyConfiguration({
      webhookId: 'webhook-1',
      config: { include_metadata: true },
      fetcher,
    })).resolves.toEqual({ ok: true, errorMessage: null });
    expect(fetcher).toHaveBeenCalledWith('/api/settings/webhooks/webhook-1/body-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ include_metadata: true }),
    });

    await expect(updateWebhookBodyConfiguration({
      webhookId: 'webhook-1',
      config: {},
      fetcher: vi.fn().mockResolvedValue(response({ message: 'Invalid config' }, false)),
    })).resolves.toEqual({
      ok: false,
      errorMessage: 'Invalid config',
    });
  });

  it('runs generic bulk actions and exports blobs', async () => {
    const bulkFetcher = vi.fn().mockResolvedValue(response({ ok: true }));
    await expect(runWebhookBulkAction({
      action: 'enable',
      webhookIds: ['a'],
      fetcher: bulkFetcher,
    })).resolves.toBe(true);
    expect(bulkFetcher).toHaveBeenCalledWith('/api/settings/webhooks/bulk-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enable', webhookIds: ['a'] }),
    });

    const blob = new Blob(['csv']);
    await expect(fetchWebhookExportBlob(vi.fn().mockResolvedValue(response(blob)))).resolves.toBe(blob);
    await expect(fetchWebhookExportBlob(vi.fn().mockResolvedValue(response({}, false)))).resolves.toBeNull();
  });
});
