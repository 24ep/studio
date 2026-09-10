import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createSystemApiKey,
  deleteSystemApiKey,
  fetchSystemApiKeys,
  updateSystemApiKeyActiveState,
} from './system-api-keys-api';

function response(body: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('system API key API helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads system API keys from successful responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
      success: true,
      data: { apiKeys: [{ id: 'key-1' }] },
    })));

    await expect(fetchSystemApiKeys()).resolves.toEqual([{ id: 'key-1' }]);
  });

  it('creates API keys with JSON payloads and surfaces server errors', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ apiKey: 'sk_live_new' }))
      .mockResolvedValueOnce(response({ error: 'Duplicate name' }, false));
    vi.stubGlobal('fetch', fetchMock);

    await expect(createSystemApiKey({
      name: 'n8n',
      description: null,
      expiresAt: null,
    })).resolves.toEqual({ apiKey: 'sk_live_new' });

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/settings/system-api-keys', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'n8n', description: null, expiresAt: null }),
    }));
    await expect(createSystemApiKey({ name: 'n8n', description: null, expiresAt: null })).rejects.toThrow('Duplicate name');
  });

  it('updates and deletes keys by id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({}));
    vi.stubGlobal('fetch', fetchMock);

    await expect(updateSystemApiKeyActiveState('key-1', false)).resolves.toBeUndefined();
    await expect(deleteSystemApiKey('key-1')).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/settings/system-api-keys/key-1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/settings/system-api-keys/key-1', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});
