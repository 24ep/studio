import {
  getJsonArray,
  getJsonErrorMessage,
  getJsonNumber,
  getJsonString,
  isJsonObject,
  readJsonObject,
  type JsonObject,
} from '../../lib/response-json';
import type { AiModelOption, AiProvider, ApiKey, ApiKeySavePayload, ApiKeyStats } from './ai-api-keys-utils';

const API_KEYS_INVALID_RESPONSE_MESSAGE = 'Invalid response format from server';

export interface AiApiKeysFetchResult {
  apiKeys: ApiKey[];
  stats: ApiKeyStats;
  selectedProvider?: AiProvider;
}

export interface AiAvailableModelsResult {
  models: AiModelOption[];
  error?: string;
}

export interface AiApiKeysSaveResult {
  message?: string;
  removedDuplicates?: number;
}

function normalizeAiModelOptions(models: ReturnType<typeof getJsonArray>): AiModelOption[] {
  return (models ?? []).flatMap((model) => {
    if (!isJsonObject(model)) {
      return [];
    }

    const name = getJsonString(model, 'name');
    const displayName = getJsonString(model, 'displayName');
    return name && displayName ? [{ name, displayName }] : [];
  });
}

function getJsonBoolean(data: JsonObject, key: string) {
  const value = data[key];
  return typeof value === 'boolean' ? value : undefined;
}

function getJsonProvider(data: JsonObject, key: string) {
  const provider = getJsonString(data, key);
  return provider === 'gemini' || provider === 'openai' || provider === 'deepseek'
    ? provider
    : undefined;
}

function normalizeApiKey(value: unknown): ApiKey | null {
  if (!isJsonObject(value)) {
    return null;
  }

  const key = getJsonString(value, 'key');
  if (!key) {
    return null;
  }

  return {
    key,
    priority: getJsonNumber(value, 'priority') ?? 0,
    isActive: getJsonBoolean(value, 'isActive') ?? false,
    source: getJsonString(value, 'source') ?? '',
    errorCount: getJsonNumber(value, 'errorCount') ?? 0,
    lastError: getJsonString(value, 'lastError'),
    lastUsed: getJsonString(value, 'lastUsed') as ApiKey['lastUsed'],
    selectedModel: getJsonString(value, 'selectedModel'),
    provider: getJsonProvider(value, 'provider'),
  };
}

function normalizeApiKeysFetchResult(data: Awaited<ReturnType<typeof readJsonObject>>): AiApiKeysFetchResult {
  const apiKeyValues = getJsonArray(data, 'apiKeys');
  if (!apiKeyValues) {
    throw new Error(API_KEYS_INVALID_RESPONSE_MESSAGE);
  }

  const apiKeys = apiKeyValues.map(normalizeApiKey).filter((apiKey): apiKey is ApiKey => apiKey !== null);

  return {
    apiKeys,
    stats: {
      provider: getJsonProvider(data, 'provider'),
      selectedProvider: getJsonProvider(data, 'selectedProvider'),
      apiKeys,
      totalKeys: getJsonNumber(data, 'totalKeys') ?? apiKeys.length,
      activeKeys: getJsonNumber(data, 'activeKeys') ?? apiKeys.filter(apiKey => apiKey.isActive).length,
      environmentKey: getJsonBoolean(data, 'environmentKey') ?? false,
    },
    selectedProvider: getJsonProvider(data, 'selectedProvider'),
  };
}

export async function fetchAiApiKeys(provider: AiProvider): Promise<AiApiKeysFetchResult> {
  const response = await fetch(`/api/settings/ai-api-keys?provider=${provider}`);
  if (!response.ok) {
    throw new Error('Failed to fetch API keys');
  }

  return normalizeApiKeysFetchResult(await readJsonObject(response));
}

export async function fetchAiAvailableModels(provider: AiProvider): Promise<AiAvailableModelsResult> {
  const response = await fetch(`/api/ai/available-models?provider=${provider}`);
  const data = await readJsonObject(response);

  if (!response.ok) {
    return {
      models: [],
      error: getJsonErrorMessage(data, 'Failed to fetch available models. Please check your API key configuration.'),
    };
  }

  const models = normalizeAiModelOptions(getJsonArray(data, 'models'));
  if (data.success && models.length > 0) {
    return { models };
  }

  return {
    models: [],
    error: getJsonString(data, 'error'),
  };
}

export async function saveAiProviderSelection(provider: AiProvider) {
  await fetch('/api/settings/system-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      { key: 'aiProviderSelection', value: provider },
    ]),
  });
}

export async function saveAiApiKeys({
  apiKeys,
  provider,
  fallbackMessage = 'Failed to save API keys',
}: {
  apiKeys: ApiKeySavePayload[];
  provider: AiProvider;
  fallbackMessage?: string;
}): Promise<AiApiKeysSaveResult> {
  const response = await fetch('/api/settings/ai-api-keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKeys, provider }),
  });

  const data = await readJsonObject(response);
  if (!response.ok) {
    throw new Error(getJsonErrorMessage(data, fallbackMessage));
  }

  return {
    message: getJsonString(data, 'message'),
    removedDuplicates: getJsonNumber(data, 'removedDuplicates'),
  };
}

export async function reorderAiApiKeys({
  apiKeys,
  provider,
}: {
  apiKeys: ApiKeySavePayload[];
  provider: AiProvider;
}) {
  const response = await fetch('/api/settings/ai-api-keys/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKeys, provider }),
  });

  const errorData = await readJsonObject(response);
  if (!response.ok) {
    let errorMessage = 'Failed to update API key order';
    if (response.status === 403) {
      errorMessage = 'No permission';
    } else if (response.status === 400) {
      errorMessage = getJsonErrorMessage(errorData, 'Invalid request data');
    } else if (response.status === 500) {
      errorMessage = 'Server error occurred. Please try again.';
    }

    throw new Error(errorMessage);
  }
}
