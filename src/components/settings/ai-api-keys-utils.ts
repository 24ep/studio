export type AiProvider = 'gemini' | 'openai' | 'deepseek';

export interface ApiKey {
  key: string;
  priority: number;
  isActive: boolean;
  source: string;
  errorCount: number;
  lastError?: string;
  lastUsed?: Date;
  selectedModel?: string;
  provider?: AiProvider;
}

export interface AiModelOption {
  name: string;
  displayName: string;
}

export interface ApiKeyStats {
  provider?: AiProvider;
  selectedProvider?: AiProvider;
  apiKeys: ApiKey[];
  totalKeys: number;
  activeKeys: number;
  environmentKey: boolean;
}

export interface ApiKeySavePayload {
  key: string;
  priority: number;
  selectedModel: string;
}

export function getProviderLabel(provider: AiProvider) {
  if (provider === 'openai') return 'OpenAI';
  if (provider === 'deepseek') return 'DeepSeek';
  return 'Gemini';
}

export function getProviderDefaultModel(provider: AiProvider) {
  if (provider === 'openai') return 'gpt-4o-mini';
  if (provider === 'deepseek') return 'deepseek-chat';
  return 'gemini-1.5-flash';
}

export function getNextPriority(apiKeys: ApiKey[]) {
  const priorities = apiKeys.map(key => key.priority).filter(priority => !Number.isNaN(priority) && priority > 0);

  if (priorities.length === 0) {
    return 1;
  }

  return Math.max(...priorities) + 1;
}

export function reassignApiKeyPriorities(apiKeys: ApiKey[]) {
  return apiKeys.map((apiKey, index) => ({
    ...apiKey,
    priority: index + 1,
    source: `Priority ${index + 1}`,
  }));
}

export function toApiKeySavePayload(apiKeys: ApiKey[], fallbackModel: string): ApiKeySavePayload[] {
  return apiKeys.map(apiKey => ({
    key: apiKey.key,
    priority: apiKey.priority,
    selectedModel: apiKey.selectedModel || fallbackModel,
  }));
}

export function deduplicateApiKeysForSave(apiKeys: ApiKey[], fallbackModel: string): ApiKeySavePayload[] {
  const seenKeys = new Map<string, ApiKey>();

  for (const apiKey of apiKeys) {
    const trimmedKey = apiKey.key.trim();
    const existing = seenKeys.get(trimmedKey);

    if (!existing || apiKey.priority < existing.priority) {
      seenKeys.set(trimmedKey, apiKey);
    }
  }

  return toApiKeySavePayload(
    Array.from(seenKeys.values()).sort((a, b) => a.priority - b.priority),
    fallbackModel
  );
}

export function reorderApiKeysByDrag(apiKeys: ApiKey[], sourceIndex: number, destinationIndex: number) {
  if (sourceIndex === destinationIndex) {
    return apiKeys;
  }

  if (
    sourceIndex < 0 ||
    destinationIndex < 0 ||
    sourceIndex >= apiKeys.length ||
    destinationIndex >= apiKeys.length
  ) {
    return null;
  }

  const reorderedKeys = Array.from(apiKeys);
  const [reorderedKey] = reorderedKeys.splice(sourceIndex, 1);

  if (!reorderedKey) {
    return null;
  }

  reorderedKeys.splice(destinationIndex, 0, reorderedKey);
  return reassignApiKeyPriorities(reorderedKeys);
}

export function formatApiKey(key: string) {
  if (key.length <= 12) {
    return key;
  }

  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}

export function getApiKeyStatusText(apiKey: ApiKey) {
  if (apiKey.errorCount > 0) {
    return `Error count: ${apiKey.errorCount}`;
  }

  if (apiKey.lastUsed) {
    return `Last used: ${new Date(apiKey.lastUsed).toLocaleString()}`;
  }

  return 'Never used';
}

export type ApiKeyAddPlan =
  | {
    ok: true;
    adjustedPriority: boolean;
    finalPriority: number;
    trimmedKey: string;
    updatedKeys: ApiKey[];
  }
  | {
    ok: false;
    message: string;
  };

export function buildApiKeyAddPlan({
  apiKeys,
  key,
  priority,
  provider,
  providerDefaultModel,
}: {
  apiKeys: ApiKey[];
  key: string;
  priority: number;
  provider: AiProvider;
  providerDefaultModel: string;
}): ApiKeyAddPlan {
  const trimmedKey = key.trim();

  if (!trimmedKey) {
    return { ok: false, message: 'Please enter an API key' };
  }

  const duplicateKey = apiKeys.find(apiKey => apiKey.key === trimmedKey);
  if (duplicateKey) {
    return {
      ok: false,
      message: `This API key already exists with priority ${duplicateKey.priority}`,
    };
  }

  if (priority <= 0) {
    return { ok: false, message: 'Priority must be greater than 0' };
  }

  const priorityExists = apiKeys.some(apiKey => apiKey.priority === priority);
  const finalPriority = priorityExists
    ? Math.max(...apiKeys.map(apiKey => apiKey.priority), 0) + 1
    : priority;
  const updatedKeys = [
    ...apiKeys,
    {
      key: trimmedKey,
      priority: finalPriority,
      isActive: true,
      source: `Priority ${finalPriority}`,
      errorCount: 0,
      provider,
      selectedModel: providerDefaultModel,
    },
  ].sort((a, b) => a.priority - b.priority);

  return {
    ok: true,
    adjustedPriority: priorityExists,
    finalPriority,
    trimmedKey,
    updatedKeys: reassignApiKeyPriorities(updatedKeys),
  };
}

export function removeApiKeyByPriority(apiKeys: ApiKey[], priority: number) {
  const keyToDelete = apiKeys.find(apiKey => apiKey.priority === priority);

  return {
    keyToDelete,
    updatedKeys: keyToDelete
      ? reassignApiKeyPriorities(apiKeys.filter(apiKey => apiKey.key !== keyToDelete.key))
      : apiKeys,
  };
}

export function updateApiKeyModel(apiKeys: ApiKey[], priority: number, selectedModel: string) {
  return apiKeys.map(apiKey =>
    apiKey.priority === priority
      ? { ...apiKey, selectedModel }
      : apiKey,
  );
}
