import type { AiProvider } from '@/lib/aiProvider';

export type ApiKeyUpdate = {
  key: string;
  priority: number;
  selectedModel?: string;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseApiKeyUpdate(value: unknown): ApiKeyUpdate | null {
  if (!isRecord(value) || typeof value.key !== 'string' || !value.key.trim()) {
    return null;
  }

  const priority = typeof value.priority === 'number'
    ? value.priority
    : typeof value.priority === 'string'
      ? Number.parseInt(value.priority, 10)
      : NaN;

  if (!Number.isFinite(priority) || priority <= 0) {
    return null;
  }

  return {
    key: value.key.trim(),
    priority,
    selectedModel: typeof value.selectedModel === 'string' ? value.selectedModel : undefined,
  };
}

export function parseApiKeyUpdates(apiKeys: unknown[]): ApiKeyUpdate[] {
  return apiKeys
    .map(parseApiKeyUpdate)
    .filter((key): key is ApiKeyUpdate => Boolean(key))
    .sort((a, b) => a.priority - b.priority);
}

export function hasDuplicateApiKeyPriorities(apiKeys: ApiKeyUpdate[]) {
  const priorities = apiKeys.map(key => key.priority);
  return priorities.length !== new Set(priorities).size;
}

export function deduplicateApiKeyUpdates(apiKeys: ApiKeyUpdate[]): ApiKeyUpdate[] {
  const seenKeys = new Map<string, ApiKeyUpdate>();
  for (const apiKey of apiKeys) {
    const existing = seenKeys.get(apiKey.key);
    if (!existing || apiKey.priority < existing.priority) {
      seenKeys.set(apiKey.key, apiKey);
    }
  }

  return Array.from(seenKeys.values()).map((apiKey, index) => ({
    ...apiKey,
    priority: index + 1,
  }));
}

export function hasDuplicateApiKeyValues(apiKeys: ApiKeyUpdate[]) {
  const keyValues = apiKeys.map(key => key.key);
  return keyValues.length !== new Set(keyValues).size;
}

export function resolveAiApiKeysProvider(value: unknown): AiProvider {
  if (value === 'openai' || value === 'deepseek') {
    return value;
  }

  return 'gemini';
}

export function resolveAiApiKeysGetProvider(
  requestedProvider: string | null,
  selectedProvider: AiProvider,
): AiProvider {
  if (requestedProvider === 'openai' || requestedProvider === 'deepseek' || requestedProvider === 'gemini') {
    return requestedProvider;
  }

  return selectedProvider;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
