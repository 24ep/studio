import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import {
  type AiProvider,
  getDefaultModelFallback,
  getProviderKeyPrefix,
  getProviderLabel,
  getSelectedAiProvider,
} from '@/lib/aiProvider';

import type { ApiKeyConfig, ApiKeyInput } from './ai-api-key-manager-types';
import {
  buildApiKeysFromSettings,
  normalizeApiKeyInputs,
} from './ai-api-key-settings-utils';
import {
  fetchApiKeySettingRows,
  fetchApiKeyStatsSettings,
  findApiKeySettingKey,
  recordApiKeyErrorSettings,
  recordApiKeyLastUsed,
  replaceApiKeySettings,
} from './ai-api-key-settings-store';

export async function getApiKeys(provider?: AiProvider): Promise<ApiKeyConfig[]> {
  const resolvedProvider = provider || await getSelectedAiProvider();
  const prefix = getProviderKeyPrefix(resolvedProvider);
  const defaultModel = getDefaultModelFallback(resolvedProvider);
  const rows = await fetchApiKeySettingRows(prefix);

  return buildApiKeysFromSettings(rows, {
    defaultModel,
    prefix,
    provider: resolvedProvider,
  });
}

export async function getNextApiKey(provider?: AiProvider): Promise<string | null> {
  const apiKeys = await getApiKeys(provider);
  const activeKeys = apiKeys.filter((key) => key.isActive).sort((a, b) => a.priority - b.priority);
  return activeKeys[0]?.key || null;
}

export async function markApiKeyError(apiKey: string, error: string, provider?: AiProvider): Promise<void> {
  const resolvedProvider = provider || await getSelectedAiProvider();
  const settingKey = await findApiKeySettingKey(apiKey, resolvedProvider);
  if (!settingKey) return;

  await recordApiKeyErrorSettings(settingKey, error);
  await logAudit('WARN', `${getProviderLabel(resolvedProvider)} API key error: ${error}`, 'AI:ApiKeyError', null, {
    provider: resolvedProvider,
    apiKey: `${apiKey.substring(0, 10)}...`,
    settingKey,
  });
}

export async function markApiKeySuccess(apiKey: string, provider?: AiProvider): Promise<void> {
  const resolvedProvider = provider || await getSelectedAiProvider();
  const settingKey = await findApiKeySettingKey(apiKey, resolvedProvider);
  if (!settingKey) return;

  await recordApiKeyLastUsed(settingKey);
}

export async function saveApiKeys(
  apiKeys: ApiKeyInput[],
  provider?: AiProvider
): Promise<void> {
  const resolvedProvider = provider || await getSelectedAiProvider();
  const prefix = getProviderKeyPrefix(resolvedProvider);
  const defaultModel = getDefaultModelFallback(resolvedProvider);
  const reorderedKeys = normalizeApiKeyInputs(apiKeys);
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    await replaceApiKeySettings(client, prefix, reorderedKeys, defaultModel);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getApiKeyStats(provider?: AiProvider): Promise<Array<ApiKeyConfig & { source: string }>> {
  const resolvedProvider = provider || await getSelectedAiProvider();
  const prefix = getProviderKeyPrefix(resolvedProvider);
  const apiKeys = await getApiKeys(resolvedProvider);
  const client = await getPool().connect();

  try {
    const stats = await Promise.all(apiKeys.map(async (apiKey) => {
      const settingKey = `${prefix}_${apiKey.priority}`;
      const settings = await fetchApiKeyStatsSettings(client, settingKey);

      return {
        ...apiKey,
        source: `Priority ${apiKey.priority}`,
        ...settings,
      };
    }));

    return stats.sort((a, b) => a.priority - b.priority);
  } finally {
    client.release();
  }
}
