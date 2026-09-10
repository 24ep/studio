import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchAiApiKeys,
  fetchAiAvailableModels,
  reorderAiApiKeys,
  saveAiApiKeys,
  saveAiProviderSelection,
} from './ai-api-keys-api';

function response(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return {
    ok,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('ai-api-keys API helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads API keys and selected provider', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
      apiKeys: [{ key: 'key-1', priority: 1 }],
      selectedProvider: 'openai',
      totalKeys: 1,
    })));

    await expect(fetchAiApiKeys('gemini')).resolves.toMatchObject({
      apiKeys: [{ key: 'key-1', priority: 1 }],
      selectedProvider: 'openai',
      stats: { totalKeys: 1 },
    });
  });

  it('loads DeepSeek as a selected provider', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
      apiKeys: [{ key: 'key-1', priority: 1, provider: 'deepseek' }],
      selectedProvider: 'deepseek',
      provider: 'deepseek',
      totalKeys: 1,
    })));

    await expect(fetchAiApiKeys('deepseek')).resolves.toMatchObject({
      apiKeys: [{ key: 'key-1', priority: 1, provider: 'deepseek' }],
      selectedProvider: 'deepseek',
      stats: { provider: 'deepseek', selectedProvider: 'deepseek' },
    });
  });

  it('rejects invalid API key list responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ apiKeys: null })));

    await expect(fetchAiApiKeys('gemini')).rejects.toThrow('Invalid response format from server');
  });

  it('loads available models and returns API errors as data', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ success: true, models: [{ name: 'm', displayName: 'Model' }] }))
      .mockResolvedValueOnce(response({ error: 'Bad key' }, false, 400, 'Bad Request'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAiAvailableModels('gemini')).resolves.toEqual({
      models: [{ name: 'm', displayName: 'Model' }],
    });
    await expect(fetchAiAvailableModels('gemini')).resolves.toEqual({
      models: [],
      error: 'Bad key',
    });
  });

  it('saves provider selection and API key payloads', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({}))
      .mockResolvedValueOnce(response({ message: 'Saved' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(saveAiProviderSelection('openai')).resolves.toBeUndefined();
    await expect(saveAiApiKeys({
      provider: 'openai',
      apiKeys: [{ key: 'key-1', priority: 1, selectedModel: 'gpt-4o-mini' }],
    })).resolves.toEqual({ message: 'Saved' });

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/settings/system-settings', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify([{ key: 'aiProviderSelection', value: 'openai' }]),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/settings/ai-api-keys', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        apiKeys: [{ key: 'key-1', priority: 1, selectedModel: 'gpt-4o-mini' }],
        provider: 'openai',
      }),
    }));
  });

  it('maps reorder failure statuses to user-facing messages', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response({}, false, 403, 'Forbidden'))
      .mockResolvedValueOnce(response({ error: 'Bad order' }, false, 400, 'Bad Request'))
      .mockResolvedValueOnce(response({}, false, 500, 'Server Error')));

    const payload = {
      provider: 'gemini' as const,
      apiKeys: [{ key: 'key-1', priority: 1, selectedModel: 'gemini-1.5-flash' }],
    };

    await expect(reorderAiApiKeys(payload)).rejects.toThrow('No permission');
    await expect(reorderAiApiKeys(payload)).rejects.toThrow('Bad order');
    await expect(reorderAiApiKeys(payload)).rejects.toThrow('Server error occurred. Please try again.');
  });
});
