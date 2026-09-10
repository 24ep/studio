import { getPool } from '@/lib/db';
import {
  fetchAppKitLocalizationConfig,
  materializeAppKitLocalizationConfig,
  type AppKitEnvironment,
  type AppKitLocalizationConfig,
} from '@/lib/appkit-sdk-client';
import { getSystemSetting } from '@/lib/systemSettings';

export const LOCALIZATION_SETTING_KEY = 'appkitLocalizationConfig';
const DEFAULT_LANGUAGE_SETTING_KEY = 'defaultLanguage';
const DEFAULT_LOCALIZATION_REFRESH_MS = 15 * 60 * 1000;

let localizationRefresh: Promise<StoredLocalizationConfig> | null = null;

export type StoredLocalizationConfig = {
  config: AppKitLocalizationConfig;
  environment: AppKitEnvironment;
  loadedAt: string;
};

export function createRuntimeLocalizationSnapshot(
  snapshot: StoredLocalizationConfig,
): StoredLocalizationConfig {
  const { config } = snapshot;

  return {
    ...snapshot,
    config: {
      defaultLanguage: config.defaultLanguage,
      enabled: config.enabled,
      fallbackLanguage: config.fallbackLanguage,
      localeCookieKey: config.localeCookieKey,
      supportedLanguages: config.supportedLanguages,
      translations: config.translations,
    },
  };
}

export async function getStoredLocalizationConfig(): Promise<StoredLocalizationConfig | null> {
  const result = await getPool().query<{ value: string | null }>(
    'SELECT value FROM "SystemSetting" WHERE key = $1 LIMIT 1',
    [LOCALIZATION_SETTING_KEY],
  );
  const value = result.rows[0]?.value;
  if (!value) return null;
  try {
    const snapshot = JSON.parse(value) as StoredLocalizationConfig;
    return { ...snapshot, config: materializeAppKitLocalizationConfig(snapshot.config) };
  } catch {
    return null;
  }
}

async function applyDefaultLanguageOverride(
  config: AppKitLocalizationConfig,
): Promise<AppKitLocalizationConfig> {
  const configuredDefaultLanguage = (await getSystemSetting(DEFAULT_LANGUAGE_SETTING_KEY))?.trim();
  if (!configuredDefaultLanguage) return config;

  return {
    ...config,
    defaultLanguage: configuredDefaultLanguage,
  };
}

export async function loadLocalizationFromAppKit(
  environment: AppKitEnvironment = 'production',
): Promise<StoredLocalizationConfig> {
  const fetchedConfig = await fetchAppKitLocalizationConfig(environment);
  const config = await applyDefaultLanguageOverride(fetchedConfig);
  const snapshot = { config, environment, loadedAt: new Date().toISOString() };
  await getPool().query(
    `INSERT INTO "SystemSetting" (key, value, "createdAt", "updatedAt")
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()`,
    [LOCALIZATION_SETTING_KEY, JSON.stringify(snapshot)],
  );
  return snapshot;
}

function localizationRefreshInterval() {
  const configured = Number(process.env.APPKIT_LOCALIZATION_REFRESH_MS);
  return Number.isFinite(configured) && configured >= 0
    ? configured
    : DEFAULT_LOCALIZATION_REFRESH_MS;
}

function shouldRefreshLocalization(snapshot: StoredLocalizationConfig) {
  const loadedAt = new Date(snapshot.loadedAt).getTime();
  return !Number.isFinite(loadedAt) || Date.now() - loadedAt >= localizationRefreshInterval();
}

async function refreshProductionLocalization() {
  if (!localizationRefresh) {
    localizationRefresh = loadLocalizationFromAppKit('production').finally(() => {
      localizationRefresh = null;
    });
  }
  return localizationRefresh;
}

export async function initializeLocalization(): Promise<StoredLocalizationConfig> {
  const stored = await getStoredLocalizationConfig();
  if (!stored) {
    return refreshProductionLocalization();
  }

  if (shouldRefreshLocalization(stored)) {
    void refreshProductionLocalization().catch((error) => {
      console.warn('[LOCALIZATION] AppKit refresh failed; using the last stored catalog.', error);
    });
  }

  return {
    ...stored,
    config: await applyDefaultLanguageOverride(stored.config),
  };
}
