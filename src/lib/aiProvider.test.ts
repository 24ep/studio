import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./systemSettings', () => ({
  getSystemSetting: vi.fn(),
}));

import { generateTextWithProvider, getAvailableModels } from './aiProvider';

function response(body: unknown, ok = true, status = 200, statusText = 'OK') {
  return {
    ok,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe('aiProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses empty error details when Gemini returns malformed JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: vi.fn().mockRejectedValue(new Error('not json')),
    } as unknown as Response));

    await expect(generateTextWithProvider(
      'gemini',
      'api-key',
      'gemini-1.5-flash',
      'Hello'
    )).rejects.toThrow('Gemini API error: 500 Server Error - {}');
  });

  it('retries OpenAI chat completions with the alternate token field when needed', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({
        error: {
          code: 'unsupported_parameter',
          param: 'max_completion_tokens',
          message: 'Unsupported parameter',
        },
      }, false, 400, 'Bad Request'))
      .mockResolvedValueOnce(response({
        choices: [{ message: { content: 'Done' } }],
      }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(generateTextWithProvider(
      'openai',
      'api-key',
      'gpt-4o-mini',
      'Hello',
      { maxOutputTokens: 20 }
    )).resolves.toBe('Done');

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      max_completion_tokens: 20,
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
      max_tokens: 20,
    });
  });

  it('extracts OpenAI text from content part arrays', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({
      choices: [{
        message: {
          content: [
            { text: { value: 'First' } },
            { text: 'Second' },
          ],
        },
      }],
    })));

    await expect(generateTextWithProvider(
      'openai',
      'api-key',
      'gpt-4o-mini',
      'Hello'
    )).resolves.toBe('First\nSecond');
  });

  it('generates DeepSeek text through the OpenAI-compatible API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      choices: [{ message: { content: 'DeepSeek done' } }],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(generateTextWithProvider(
      'deepseek',
      'api-key',
      'deepseek-chat',
      'Hello',
      { maxOutputTokens: 20 }
    )).resolves.toBe('DeepSeek done');

    expect(fetchMock).toHaveBeenCalledWith('https://api.deepseek.com/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer api-key',
      }),
    }));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      model: 'deepseek-chat',
      max_tokens: 20,
    });
  });

  it('filters and normalizes provider model lists', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response({
        models: [
          {
            name: 'models/gemini-1.5-pro',
            displayName: 'Gemini Pro',
            description: 'Pro model',
            supportedGenerationMethods: ['generateContent'],
          },
          {
            name: 'models/embedding-001',
            supportedGenerationMethods: ['embedContent'],
          },
        ],
      }))
      .mockResolvedValueOnce(response({
        data: [
          { id: 'gpt-4o-mini' },
          { id: 'gpt-4o-audio' },
          { id: 'o3' },
        ],
      }))
      .mockResolvedValueOnce(response({
        data: [
          { id: 'deepseek-chat' },
          { id: 'gpt-4o-mini' },
        ],
      })));

    await expect(getAvailableModels('gemini', 'gemini-key-for-list')).resolves.toEqual([
      {
        name: 'gemini-1.5-pro',
        displayName: 'Gemini Pro',
        description: 'Pro model',
        supportedGenerationMethods: ['generateContent'],
      },
    ]);

    await expect(getAvailableModels('openai', 'openai-key-for-list')).resolves.toEqual([
      {
        name: 'gpt-4o-mini',
        displayName: 'gpt-4o-mini',
        description: 'OpenAI text generation model',
        supportedGenerationMethods: ['chat.completions'],
      },
      {
        name: 'o3',
        displayName: 'o3',
        description: 'OpenAI text generation model',
        supportedGenerationMethods: ['chat.completions'],
      },
    ]);

    await expect(getAvailableModels('deepseek', 'deepseek-key-for-list')).resolves.toEqual([
      {
        name: 'deepseek-chat',
        displayName: 'deepseek-chat',
        description: 'DeepSeek text generation model',
        supportedGenerationMethods: ['chat.completions'],
      },
    ]);
  });
});
