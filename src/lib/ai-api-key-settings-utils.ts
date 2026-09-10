import type { AiProvider } from '@/lib/aiProvider';

import type { ApiKeyConfig, ApiKeyInput } from './ai-api-key-manager-types';

export function buildApiKeysFromSettings(
  rows: Array<{ key: string; value: string }>,
  options: {
    defaultModel: string;
    prefix: string;
    provider: AiProvider;
  }
): ApiKeyConfig[] {
  const modelSelections = getModelSelections(rows, options.defaultModel);
  const numberedKeyPattern = new RegExp(`^${options.prefix}_\\d+$`);

  return rows
    .flatMap((row) => getApiKeyConfigFromSetting(row, {
      modelSelections,
      numberedKeyPattern,
      ...options,
    }))
    .sort((a, b) => a.priority - b.priority);
}

export function normalizeApiKeyInputs(apiKeys: ApiKeyInput[]) {
  const seenKeys = new Map<string, ApiKeyInput>();

  for (const apiKey of apiKeys) {
    const trimmedKey = apiKey.key.trim();
    if (!trimmedKey) continue;

    const existing = seenKeys.get(trimmedKey);
    if (!existing || apiKey.priority < existing.priority) {
      seenKeys.set(trimmedKey, { ...apiKey, key: trimmedKey });
    }
  }

  return Array.from(seenKeys.values())
    .sort((a, b) => a.priority - b.priority)
    .map((apiKey, index) => ({
      ...apiKey,
      priority: index + 1,
    }));
}

function getModelSelections(rows: Array<{ key: string; value: string }>, defaultModel: string) {
  const modelSelections: Record<string, string> = {};

  for (const row of rows) {
    if (String(row.key).endsWith('_model')) {
      modelSelections[String(row.key).replace(/_model$/, '')] = row.value || defaultModel;
    }
  }

  return modelSelections;
}

function getApiKeyConfigFromSetting(
  row: { key: string; value: string },
  options: {
    defaultModel: string;
    modelSelections: Record<string, string>;
    numberedKeyPattern: RegExp;
    prefix: string;
    provider: AiProvider;
  }
): ApiKeyConfig[] {
  if (row.key === options.prefix) {
    return [createApiKeyConfig({
      key: row.value,
      priority: 1,
      selectedModel: options.modelSelections[options.prefix] || options.defaultModel,
      provider: options.provider,
    })];
  }

  if (!options.numberedKeyPattern.test(row.key)) return [];

  const priority = parseInt(String(row.key).split('_').pop() || '', 10);
  if (Number.isNaN(priority)) return [];

  return [createApiKeyConfig({
    key: row.value,
    priority,
    selectedModel: options.modelSelections[row.key] || options.defaultModel,
    provider: options.provider,
  })];
}

function createApiKeyConfig({
  key,
  priority,
  provider,
  selectedModel,
}: {
  key: string;
  priority: number;
  provider: AiProvider;
  selectedModel: string;
}): ApiKeyConfig {
  return {
    key,
    priority,
    isActive: true,
    errorCount: 0,
    selectedModel,
    provider,
  };
}
