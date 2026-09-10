import { describe, expect, it } from 'vitest';

import {
  buildApiKeysFromSettings,
  normalizeApiKeyInputs,
} from './ai-api-key-settings-utils';

describe('ai api key settings utils', () => {
  it('builds ordered key configs with per-key model selections', () => {
    expect(buildApiKeysFromSettings([
      { key: 'gemini_api_key_2', value: 'key-b' },
      { key: 'gemini_api_key_1', value: 'key-a' },
      { key: 'gemini_api_key_2_model', value: 'gemini-pro' },
      { key: 'gemini_api_key_model', value: 'fallback-model' },
      { key: 'gemini_api_key_errorCount', value: '3' },
    ], {
      defaultModel: 'default-model',
      prefix: 'gemini_api_key',
      provider: 'gemini',
    })).toMatchObject([
      {
        key: 'key-a',
        priority: 1,
        selectedModel: 'default-model',
        provider: 'gemini',
      },
      {
        key: 'key-b',
        priority: 2,
        selectedModel: 'gemini-pro',
        provider: 'gemini',
      },
    ]);
  });

  it('deduplicates, trims, drops blanks, and reorders saved key inputs', () => {
    expect(normalizeApiKeyInputs([
      { key: ' first ', priority: 3, selectedModel: 'a' },
      { key: '', priority: 1 },
      { key: 'second', priority: 2 },
      { key: 'first', priority: 1, selectedModel: 'better' },
    ])).toEqual([
      { key: 'first', priority: 1, selectedModel: 'better' },
      { key: 'second', priority: 2 },
    ]);
  });
});
