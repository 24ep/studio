import { logAudit } from '@/lib/auditLog';
import {
  type AiProvider,
  getAvailableModels,
  getDefaultModelName,
  getProviderLabel,
  getSelectedAiProvider,
  normalizeModelName,
} from '@/lib/aiProvider';

import type { ApiKeyResult } from './ai-api-key-manager-types';
import {
  getApiKeys,
  markApiKeyError,
  markApiKeySuccess,
} from './ai-api-key-settings';

export async function executeWithApiKeyFallback<T>(
  operation: (apiKey: string, model: string, provider: AiProvider) => Promise<T>,
  context: string = 'AI Operation',
  provider?: AiProvider
): Promise<ApiKeyResult & { data?: T }> {
  const resolvedProvider = provider || await getSelectedAiProvider();
  const activeKeys = await getActiveApiKeys(resolvedProvider);

  if (!activeKeys.length) {
    return createNoKeysResult(resolvedProvider);
  }

  const availableModels = await getAvailableModelsSafely(resolvedProvider, activeKeys[0].key);
  const attemptResult = await tryApiKeys({
    activeKeys,
    availableModels,
    context,
    operation,
    provider: resolvedProvider,
  });

  if (attemptResult.success) {
    return attemptResult;
  }

  await logAllKeysFailed({
    context,
    lastError: attemptResult.error,
    provider: resolvedProvider,
    totalAttempts: activeKeys.length,
  });

  return {
    success: false,
    error: `All ${activeKeys.length} ${getProviderLabel(resolvedProvider)} API keys failed. Last error: ${attemptResult.error}`,
    attempts: activeKeys.length,
    provider: resolvedProvider,
  };
}

async function getActiveApiKeys(provider: AiProvider) {
  const apiKeys = await getApiKeys(provider);
  return apiKeys.filter((key) => key.isActive).sort((a, b) => a.priority - b.priority);
}

function createNoKeysResult(provider: AiProvider): ApiKeyResult {
  return {
    success: false,
    error: `No ${getProviderLabel(provider)} API keys configured`,
    attempts: 0,
    provider,
  };
}

async function getAvailableModelsSafely(provider: AiProvider, apiKey: string) {
  try {
    return await getAvailableModels(provider, apiKey);
  } catch {
    console.warn(`[AI] Failed to fetch ${provider} models, continuing with configured values`);
    return [];
  }
}

async function tryApiKeys<T>({
  activeKeys,
  availableModels,
  context,
  operation,
  provider,
}: {
  activeKeys: Array<{
    key: string;
    selectedModel?: string;
  }>;
  availableModels: Array<{ name: string }>;
  context: string;
  operation: (apiKey: string, model: string, provider: AiProvider) => Promise<T>;
  provider: AiProvider;
}): Promise<ApiKeyResult & { data?: T }> {
  let lastError: string | undefined;

  for (let index = 0; index < activeKeys.length; index += 1) {
    const keyInfo = activeKeys[index];

    try {
      const selectedModel = keyInfo.selectedModel
        ? normalizeModelName(provider, keyInfo.selectedModel, availableModels)
        : await getDefaultModelName(provider, keyInfo.key);
      const data = await operation(keyInfo.key, selectedModel, provider);
      await markApiKeySuccess(keyInfo.key, provider);

      return {
        success: true,
        apiKey: keyInfo.key,
        keyIndex: index,
        attempts: index + 1,
        provider,
        data,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      await markFailedAttempt({
        activeKeysCount: activeKeys.length,
        apiKey: keyInfo.key,
        attempt: index + 1,
        context,
        error: lastError,
        provider,
      });
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: activeKeys.length,
    provider,
  };
}

async function markFailedAttempt({
  activeKeysCount,
  apiKey,
  attempt,
  context,
  error,
  provider,
}: {
  activeKeysCount: number;
  apiKey: string;
  attempt: number;
  context: string;
  error: string;
  provider: AiProvider;
}) {
  await markApiKeyError(apiKey, error, provider);
  await logAudit('WARN', `${getProviderLabel(provider)} API key attempt ${attempt} failed for ${context}`, 'AI:ApiKeyAttempt', null, {
    provider,
    context,
    attempt,
    totalKeys: activeKeysCount,
    error,
  });
}

async function logAllKeysFailed({
  context,
  lastError,
  provider,
  totalAttempts,
}: {
  context: string;
  lastError?: string;
  provider: AiProvider;
  totalAttempts: number;
}) {
  await logAudit('ERROR', `All ${getProviderLabel(provider)} API keys failed for ${context}`, 'AI:ApiKeyAllFailed', null, {
    provider,
    context,
    totalAttempts,
    lastError,
  });
}
