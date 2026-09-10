import type { AiProvider } from "@/lib/aiProvider";
import { getProviderKeyPrefix } from "@/lib/aiProvider";
import { getPool, type DbClient } from "@/lib/db";

import type { ApiKeyInput } from "./ai-api-key-manager-types";

export interface ApiKeySettingRow {
  key: string;
  value: string;
}

export interface ApiKeyStatsSettings {
  errorCount: number;
  lastError?: string;
  lastUsed?: Date;
}

export async function fetchApiKeySettingRows(prefix: string): Promise<ApiKeySettingRow[]> {
  const client = await getPool().connect();

  try {
    const result = await client.query<ApiKeySettingRow>(`
      SELECT key, value
      FROM "SystemSetting"
      WHERE key = $1
         OR key ~ $2
         OR key = $3
         OR key ~ $4
      ORDER BY key
    `, [
      prefix,
      `^${prefix}_\\d+$`,
      `${prefix}_model`,
      `^${prefix}_\\d+_model$`,
    ]);

    return result.rows;
  } finally {
    client.release();
  }
}

export async function findApiKeySettingKey(apiKey: string, provider: AiProvider) {
  const prefix = getProviderKeyPrefix(provider);
  const client = await getPool().connect();

  try {
    const result = await client.query<{ key: string }>(`
      SELECT key
      FROM "SystemSetting"
      WHERE key LIKE $1 AND value = $2
    `, [`${prefix}%`, apiKey]);

    return result.rows[0]?.key;
  } finally {
    client.release();
  }
}

export async function recordApiKeyErrorSettings(settingKey: string, error: string): Promise<void> {
  const client = await getPool().connect();

  try {
    await client.query(`
      INSERT INTO "SystemSetting" (key, value, "updatedAt")
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value = (COALESCE(CAST("SystemSetting".value AS INTEGER), 0) + 1)::TEXT,
        "updatedAt" = NOW()
    `, [`${settingKey}_errorCount`, "1"]);

    await upsertSystemSettingValue(client, `${settingKey}_lastError`, error);
  } finally {
    client.release();
  }
}

export async function recordApiKeyLastUsed(settingKey: string, lastUsed = new Date()): Promise<void> {
  const client = await getPool().connect();

  try {
    await upsertSystemSettingValue(client, `${settingKey}_lastUsed`, lastUsed.toISOString());
  } finally {
    client.release();
  }
}

export async function replaceApiKeySettings(
  client: DbClient,
  prefix: string,
  apiKeys: ApiKeyInput[],
  defaultModel: string
): Promise<void> {
  await client.query(`
    DELETE FROM "SystemSetting"
    WHERE key LIKE $1
  `, [`${prefix}%`]);

  for (const apiKey of apiKeys) {
    const settingKey = `${prefix}_${apiKey.priority}`;
    await upsertSystemSetting(client, settingKey, apiKey.key);
    await upsertSystemSetting(client, `${settingKey}_model`, apiKey.selectedModel || defaultModel);
  }
}

export async function fetchApiKeyStatsSettings(client: DbClient, settingKey: string): Promise<ApiKeyStatsSettings> {
  const [errorCountResult, lastErrorResult, lastUsedResult] = await Promise.all([
    client.query<{ value: string }>(`SELECT value FROM "SystemSetting" WHERE key = $1`, [`${settingKey}_errorCount`]),
    client.query<{ value: string }>(`SELECT value FROM "SystemSetting" WHERE key = $1`, [`${settingKey}_lastError`]),
    client.query<{ value: string }>(`SELECT value FROM "SystemSetting" WHERE key = $1`, [`${settingKey}_lastUsed`]),
  ]);

  return {
    errorCount: parseInt(errorCountResult.rows[0]?.value || "0", 10),
    lastError: lastErrorResult.rows[0]?.value,
    lastUsed: lastUsedResult.rows[0]?.value ? new Date(lastUsedResult.rows[0].value) : undefined,
  };
}

async function upsertSystemSettingValue(client: DbClient, key: string, value: string) {
  await client.query(`
    INSERT INTO "SystemSetting" (key, value, "updatedAt")
    VALUES ($1, $2, NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      "updatedAt" = NOW()
  `, [key, value]);
}

async function upsertSystemSetting(client: DbClient, key: string, value: string) {
  await client.query(`
    INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
    VALUES ($1, $2, NOW(), NOW())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      "updatedAt" = NOW()
  `, [key, value]);
}
