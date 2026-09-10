import { NextResponse } from 'next/server';
import { getPool, type DbClient } from '@/lib/db';
import {
  addAzureAdConfigurationStatus,
  applyRuntimeEnvironmentFallbacks,
  GET_ENV_MAPPINGS,
  getMissingEnvironmentSettings,
  type SystemSettingRow,
  type SystemSettingsMap,
} from './system-settings-route-env';
import { maskSystemSettingSecrets } from '@/lib/system-setting-secrets';

type SystemSettingQueryRow = SystemSettingRow & {
  id?: string;
};

type SystemSettingsPool = ReturnType<typeof getPool>;
const LARGE_SETTINGS_KEYS = ['appkitLocalizationConfig'];

export async function handleGetSystemSettings(searchParams?: URLSearchParams) {
  try {
    const pool = getPool();
    const requestedKeys = parseRequestedKeys(searchParams);
    const queryKeys = getSystemSettingsQueryKeys(requestedKeys);
    let settings = await fetchSystemSettingsRows(pool, queryKeys);
    const settingsToInsert = getMissingEnvironmentSettings(
      Array.isArray(settings) ? settings : [],
      GET_ENV_MAPPINGS
    );

    if (settingsToInsert.length > 0) {
      await insertEnvironmentSettings(pool, settingsToInsert);
      settings = await fetchSystemSettingsRows(pool, queryKeys);
    }

    const settingsObj: SystemSettingsMap = Object.fromEntries(
      settings.map((setting) => [setting.key, setting.value])
    );

    applyRuntimeEnvironmentFallbacks(settingsObj, GET_ENV_MAPPINGS);
    addAzureAdConfigurationStatus(settingsObj);

    return NextResponse.json(
      filterSystemSettingsByKeys(maskSystemSettingSecrets(settingsObj), requestedKeys)
    );
  } catch (error) {
    console.error('[SYSTEM SETTINGS] Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

function parseRequestedKeys(searchParams?: URLSearchParams): string[] {
  const keysParam = searchParams?.get('keys');
  if (!keysParam) {
    return [];
  }

  return [...new Set(keysParam
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean))];
}

function getSystemSettingsQueryKeys(requestedKeys: string[]): string[] | undefined {
  if (requestedKeys.length === 0) {
    return undefined;
  }

  // These keys are also needed to calculate environment fallbacks and the
  // derived Azure AD status without loading unrelated large settings.
  return [...new Set([
    ...requestedKeys,
    ...GET_ENV_MAPPINGS.map(({ key }) => key),
  ])];
}

function filterSystemSettingsByKeys(
  settings: SystemSettingsMap,
  requestedKeys: string[]
): SystemSettingsMap {
  if (requestedKeys.length === 0) {
    return settings;
  }

  return Object.fromEntries(
    requestedKeys
      .filter((key) => Object.prototype.hasOwnProperty.call(settings, key))
      .map((key) => [key, settings[key]])
  );
}

async function fetchSystemSettingsRows(
  pool: SystemSettingsPool,
  keys?: string[]
): Promise<SystemSettingRow[]> {
  const result = keys
    ? await pool.query<SystemSettingQueryRow>(
      'SELECT key, value FROM "SystemSetting" WHERE key = ANY($1::text[]) ORDER BY key',
      [keys]
    )
    : await pool.query<SystemSettingQueryRow>(
      'SELECT key, value FROM "SystemSetting" WHERE NOT (key = ANY($1::text[])) ORDER BY key',
      [LARGE_SETTINGS_KEYS]
    );
  return result.rows;
}

async function insertEnvironmentSettings(
  pool: SystemSettingsPool,
  settingsToInsert: Array<{ key: string; value: string }>
) {
  const client: DbClient = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const setting of settingsToInsert) {
      await client.query(
        'INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (key) DO NOTHING',
        [setting.key, setting.value]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[SYSTEM SETTINGS] Failed to auto-sync environment variables:', error);
  } finally {
    client.release();
  }
}
