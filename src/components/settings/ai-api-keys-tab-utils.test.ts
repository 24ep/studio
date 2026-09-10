import { describe, expect, it } from 'vitest';

import { createNewApiKey, getApiKeyPreview } from './ai-api-keys-tab-utils';

describe('ai api keys tab utils', () => {
  it('previews long keys without exposing the middle', () => {
    expect(getApiKeyPreview('short-key')).toBe('short-key');
    expect(getApiKeyPreview('1234567890abcdefghijklmnop')).toBe('12345678...mnop');
  });

  it('creates active provider-scoped API key entries', () => {
    expect(createNewApiKey('key', 2, 'gemini', 'gemini-pro')).toMatchObject({
      key: 'key',
      priority: 2,
      isActive: true,
      source: 'Priority 2',
      errorCount: 0,
      selectedModel: 'gemini-pro',
      provider: 'gemini',
    });
  });
});
