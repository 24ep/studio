import { describe, expect, it } from 'vitest';
import {
  buildApiKeyAddPlan,
  deduplicateApiKeysForSave,
  formatApiKey,
  getProviderDefaultModel,
  getProviderLabel,
  getNextPriority,
  removeApiKeyByPriority,
  reassignApiKeyPriorities,
  reorderApiKeysByDrag,
  toApiKeySavePayload,
  updateApiKeyModel,
  type ApiKey,
} from './ai-api-keys-utils';

const makeKey = (key: string, priority: number, selectedModel?: string): ApiKey => ({
  key,
  priority,
  selectedModel,
  isActive: true,
  source: `Priority ${priority}`,
  errorCount: 0,
});

describe('ai-api-keys-utils', () => {
  it('labels DeepSeek and gives it a default model', () => {
    expect(getProviderLabel('deepseek')).toBe('DeepSeek');
    expect(getProviderDefaultModel('deepseek')).toBe('deepseek-chat');
  });

  it('calculates the next priority from valid positive priorities', () => {
    expect(getNextPriority([makeKey('a', 2), makeKey('b', 5), makeKey('c', 0)])).toBe(6);
    expect(getNextPriority([])).toBe(1);
  });

  it('reassigns priorities sequentially after list changes', () => {
    expect(reassignApiKeyPriorities([makeKey('a', 9), makeKey('b', 3)])).toEqual([
      expect.objectContaining({ key: 'a', priority: 1, source: 'Priority 1' }),
      expect.objectContaining({ key: 'b', priority: 2, source: 'Priority 2' }),
    ]);
  });

  it('moves keys by drag index and refreshes priorities', () => {
    const reordered = reorderApiKeysByDrag(
      [makeKey('first', 1), makeKey('second', 2), makeKey('third', 3)],
      0,
      2
    );

    expect(reordered?.map(apiKey => apiKey.key)).toEqual(['second', 'third', 'first']);
    expect(reordered?.map(apiKey => apiKey.priority)).toEqual([1, 2, 3]);
  });

  it('returns null for invalid drag indices', () => {
    expect(reorderApiKeysByDrag([makeKey('a', 1)], -1, 0)).toBeNull();
    expect(reorderApiKeysByDrag([makeKey('a', 1)], 0, 3)).toBeNull();
  });

  it('builds save payloads with fallback models', () => {
    expect(toApiKeySavePayload([makeKey('a', 1, 'custom'), makeKey('b', 2)], 'fallback')).toEqual([
      { key: 'a', priority: 1, selectedModel: 'custom' },
      { key: 'b', priority: 2, selectedModel: 'fallback' },
    ]);
  });

  it('deduplicates keys and keeps the lowest-priority copy', () => {
    expect(deduplicateApiKeysForSave(
      [makeKey('dup', 4), makeKey('other', 2), makeKey('dup', 1, 'fast')],
      'fallback'
    )).toEqual([
      { key: 'dup', priority: 1, selectedModel: 'fast' },
      { key: 'other', priority: 2, selectedModel: 'fallback' },
    ]);
  });

  it('formats long keys without hiding short keys', () => {
    expect(formatApiKey('short-key')).toBe('short-key');
    expect(formatApiKey('1234567890abcdef')).toBe('12345678...cdef');
  });

  it('builds add plans with duplicate and priority validation', () => {
    expect(buildApiKeyAddPlan({
      apiKeys: [],
      key: '   ',
      priority: 1,
      provider: 'gemini',
      providerDefaultModel: 'gemini-pro',
    })).toEqual({ ok: false, message: 'Please enter an API key' });

    expect(buildApiKeyAddPlan({
      apiKeys: [makeKey('dup', 1)],
      key: 'dup',
      priority: 2,
      provider: 'gemini',
      providerDefaultModel: 'gemini-pro',
    })).toEqual({ ok: false, message: 'This API key already exists with priority 1' });

    const adjusted = buildApiKeyAddPlan({
      apiKeys: [makeKey('a', 1), makeKey('b', 2)],
      key: ' c ',
      priority: 2,
      provider: 'openai',
      providerDefaultModel: 'gpt-4o-mini',
    });

    expect(adjusted).toMatchObject({
      ok: true,
      adjustedPriority: true,
      finalPriority: 3,
      trimmedKey: 'c',
    });
    expect(adjusted.ok ? adjusted.updatedKeys.map(apiKey => apiKey.priority) : []).toEqual([1, 2, 3]);
  });

  it('removes keys by priority and updates selected models immutably', () => {
    const keys = [makeKey('a', 1), makeKey('b', 2)];
    expect(removeApiKeyByPriority(keys, 2).updatedKeys).toEqual([
      expect.objectContaining({ key: 'a', priority: 1 }),
    ]);
    expect(removeApiKeyByPriority(keys, 99).updatedKeys).toBe(keys);
    expect(updateApiKeyModel(keys, 2, 'fast')).toEqual([
      expect.objectContaining({ key: 'a', selectedModel: undefined }),
      expect.objectContaining({ key: 'b', selectedModel: 'fast' }),
    ]);
  });
});
