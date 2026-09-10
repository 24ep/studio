import { describe, expect, it } from 'vitest';

import {
  deduplicateApiKeyUpdates,
  getErrorMessage,
  hasDuplicateApiKeyPriorities,
  hasDuplicateApiKeyValues,
  parseApiKeyUpdate,
  parseApiKeyUpdates,
  resolveAiApiKeysGetProvider,
  resolveAiApiKeysProvider,
} from './ai-api-keys-route-utils';

describe('ai api keys route utilities', () => {
  it('parses and sorts valid API key updates', () => {
    expect(parseApiKeyUpdate({ key: ' key-1 ', priority: '2', selectedModel: 'gpt' })).toEqual({
      key: 'key-1',
      priority: 2,
      selectedModel: 'gpt',
    });
    expect(parseApiKeyUpdate({ key: '', priority: 1 })).toBeNull();
    expect(parseApiKeyUpdate({ key: 'key-1', priority: 0 })).toBeNull();

    expect(parseApiKeyUpdates([
      { key: 'key-2', priority: 2 },
      { key: 'bad', priority: -1 },
      { key: 'key-1', priority: 1 },
    ])).toEqual([
      { key: 'key-1', priority: 1, selectedModel: undefined },
      { key: 'key-2', priority: 2, selectedModel: undefined },
    ]);
  });

  it('detects duplicate priorities and key values', () => {
    const updates = [
      { key: 'key-1', priority: 1 },
      { key: 'key-2', priority: 1 },
    ];

    expect(hasDuplicateApiKeyPriorities(updates)).toBe(true);
    expect(hasDuplicateApiKeyValues(updates)).toBe(false);
    expect(hasDuplicateApiKeyValues([
      { key: 'key-1', priority: 1 },
      { key: 'key-1', priority: 2 },
    ])).toBe(true);
  });

  it('deduplicates keys and reassigns priorities', () => {
    expect(deduplicateApiKeyUpdates([
      { key: 'key-1', priority: 3 },
      { key: 'key-1', priority: 1, selectedModel: 'fast' },
      { key: 'key-2', priority: 2 },
    ])).toEqual([
      { key: 'key-1', priority: 1, selectedModel: 'fast' },
      { key: 'key-2', priority: 2 },
    ]);
  });

  it('resolves providers and error messages', () => {
    expect(resolveAiApiKeysProvider('openai')).toBe('openai');
    expect(resolveAiApiKeysProvider('deepseek')).toBe('deepseek');
    expect(resolveAiApiKeysProvider('unknown')).toBe('gemini');
    expect(resolveAiApiKeysGetProvider('gemini', 'openai')).toBe('gemini');
    expect(resolveAiApiKeysGetProvider('deepseek', 'openai')).toBe('deepseek');
    expect(resolveAiApiKeysGetProvider('other', 'openai')).toBe('openai');
    expect(getErrorMessage(new Error('Boom'))).toBe('Boom');
    expect(getErrorMessage('plain')).toBe('plain');
  });
});
