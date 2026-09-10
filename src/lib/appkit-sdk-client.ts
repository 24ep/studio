import { AppKit, type CMSCollectionItem } from '@outborn/appkit-sdk';

import { getSystemSetting } from '@/lib/systemSettings';

export type AppKitEnvironment = 'development' | 'production';

export type AppKitSeedRecord<T extends object> = T & {
  __appkitId?: string | null;
  __appkitAppId?: string | null;
};

export class AppKitSeedCollectionError extends Error {
  constructor(
    message: string,
    readonly code: 'not_configured' | 'request_failed',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'AppKitSeedCollectionError';
  }
}

const DEFAULT_APPKIT_PRODUCTION_APP_ID = '8cc7805c-c6e3-4802-b225-d73596631b24';
const APPKIT_COLLECTION_PAGE_SIZE = 500;

type AppKitSdkConfig = {
  apiBaseUrl: string | null;
  apiKey: string | null;
  appId: string;
  clientId: string | null;
  clientSecretId: string | null;
};

export type AppKitLocalizationConfig = Record<string, unknown> & {
  enabled?: boolean;
  defaultLanguage?: string;
  fallbackLanguage?: string;
  localeCookieKey?: string;
  supportedLanguages?: Array<{
    code: string;
    name?: string;
    nativeName?: string;
    direction?: 'ltr' | 'rtl';
  }>;
  languages?: Array<{
    code: string;
    name?: string;
    nativeName?: string;
    direction?: 'ltr' | 'rtl';
  }>;
  terminology?: Array<{
    key?: string;
    label?: string;
    translation?: string;
    translations?: Record<string, unknown>;
    value?: string;
  }>;
  translations?: Record<string, Record<string, string>>;
  activePackageId?: string;
  packages?: Array<{
    id?: string;
    keywords?: Array<{
      key?: string;
      label?: string;
      translation?: string;
      translations?: Record<string, unknown>;
      value?: string;
    }>;
    translations?: Record<string, Record<string, string>>;
  }>;
};

export async function fetchAppKitLocalizationConfig(
  environment: AppKitEnvironment = 'production',
): Promise<AppKitLocalizationConfig> {
  const config = await getAppKitSdkConfig(environment);
  if (!config.apiBaseUrl || (!config.clientId && !config.apiKey)) {
    throw new AppKitSeedCollectionError(
      'AppKit is not configured. Add the AppKit API base URL and either a client ID or API key before loading localization.',
      'not_configured',
    );
  }

  try {
    const appkit = createAppKitClient(config);
    return materializeAppKitLocalizationConfig(
      (await appkit.localization.getConfig() || {}) as AppKitLocalizationConfig,
    );
  } catch (error) {
    throw new AppKitSeedCollectionError(
      'Unable to load localization configuration from AppKit.',
      'request_failed',
      { cause: error },
    );
  }
}

/**
 * AppKit keeps some translations on active-package keywords rather than in the
 * top-level translations map. Flatten both representations so every published
 * keyword is available through the application's `t()` function.
 */
export function materializeAppKitLocalizationConfig(
  config: AppKitLocalizationConfig,
): AppKitLocalizationConfig {
  const translations: Record<string, Record<string, string>> = {};
  for (const [language, values] of Object.entries(config.translations || {})) {
    translations[language] = { ...values };
  }

  const activePackage = config.packages?.find(item => item.id === config.activePackageId)
    || config.packages?.[0];
  // AppKit can publish shared terms at the top level and screen-specific terms
  // in the active package. They are additive; choosing one collection caused
  // otherwise valid menu and page translations to disappear.
  const keywords = [
    ...(config.terminology || []),
    ...(activePackage?.keywords || []),
  ];

  for (const [language, values] of Object.entries(activePackage?.translations || {})) {
    translations[language] = { ...(translations[language] || {}), ...values };
  }

  for (const keyword of keywords) {
    const key = keyword.key?.trim();
    if (!key) continue;

    for (const [language, rawValue] of Object.entries(keyword.translations || {})) {
      if (typeof rawValue !== 'string' || !rawValue.trim()) continue;
      const languageTranslations = translations[language] || (translations[language] = {});
      languageTranslations[key] = rawValue;
    }

    const defaultLanguage = config.defaultLanguage || 'en';
    const defaultValue = keyword.translation || keyword.value || keyword.label;
    if (defaultValue && !translations[defaultLanguage]?.[key]) {
      const defaultTranslations = translations[defaultLanguage] || (translations[defaultLanguage] = {});
      defaultTranslations[key] = defaultValue;
    }
  }

  return {
    ...config,
    supportedLanguages: config.supportedLanguages?.length
      ? config.supportedLanguages
      : config.languages,
    translations,
  };
}

export async function fetchAppKitSeedCollection<T extends object>(
  environment: AppKitEnvironment,
  slug: string,
): Promise<Array<AppKitSeedRecord<T>>> {
  try {
    return await fetchAppKitSeedCollectionOrThrow<T>(environment, slug);
  } catch (error) {
    console.warn(`[APPKIT SDK] ${slug} load failed:`, error);
    return [];
  }
}

export async function fetchAppKitSeedCollectionOrThrow<T extends object>(
  environment: AppKitEnvironment,
  slug: string,
): Promise<Array<AppKitSeedRecord<T>>> {
  const config = await getAppKitSdkConfig(environment);
  if (!config.apiBaseUrl || (!config.clientId && !config.apiKey)) {
    throw new AppKitSeedCollectionError(
      'AppKit is not configured. Add the AppKit API base URL and either a client ID or API key before importing templates.',
      'not_configured',
    );
  }

  try {
    const appkit = createAppKitClient(config);
    return fetchAllCollectionItems<T>(appkit, slug);
  } catch (error) {
    throw new AppKitSeedCollectionError(
      `Unable to load the ${slug} collection from AppKit.`,
      'request_failed',
      { cause: error },
    );
  }
}

function createAppKitClient(config: AppKitSdkConfig) {
  return new AppKit({
    clientId: config.clientId || config.appId,
    ...(config.clientSecretId ? { clientSecret: config.clientSecretId } : {}),
    ...(config.apiKey ? { apiKey: config.apiKey } : {}),
    appId: config.appId,
    domain: config.apiBaseUrl!,
  });
}

export async function getAppKitSeedRecords<T extends object>(
  environment: AppKitEnvironment,
  slug: string,
  fallbackRecords: T[],
): Promise<T[]> {
  const records = await fetchAppKitSeedCollection<T>(environment, slug);
  return records.length > 0 ? records : fallbackRecords;
}

async function getAppKitSdkConfig(environment: AppKitEnvironment): Promise<AppKitSdkConfig> {
  const [
    configuredApiBaseUrl,
    configuredApiKey,
    configuredClientId,
    configuredClientSecretId,
    configuredDevelopmentAppId,
    configuredProductionAppId,
  ] = await Promise.all([
    getAppKitSetting('appkitApiBaseUrl', ['appkitApiBaseUrl', 'APPKIT_API_BASE_URL']),
    getAppKitSetting('appkitApiKey', ['appkitApiKey', 'APPKIT_API_KEY']),
    getAppKitSetting('appkitClientId', ['appkitClientId', 'APPKIT_CLIENT_ID']),
    getAppKitSetting('appkitClientSecretId', ['appkitClientSecretId', 'APPKIT_CLIENT_SECRET_ID']),
    getAppKitSetting('appkitDevelopmentAppId', ['appkitDevelopmentAppId', 'APPKIT_DEVELOPMENT_APP_ID']),
    getAppKitSetting('appkitProductionAppId', ['appkitProductionAppId', 'APPKIT_PRODUCTION_APP_ID']),
  ]);

  const productionAppId = configuredProductionAppId || DEFAULT_APPKIT_PRODUCTION_APP_ID;

  return {
    apiBaseUrl: normalizeBaseUrl(configuredApiBaseUrl),
    apiKey: normalizeSetting(configuredApiKey),
    appId: environment === 'development'
      ? configuredDevelopmentAppId || productionAppId
      : productionAppId,
    clientId: normalizeSetting(configuredClientId),
    clientSecretId: normalizeSetting(configuredClientSecretId),
  };
}

async function getAppKitSetting(settingKey: string, environmentNames: string[]) {
  const databaseValue = await getSystemSetting(settingKey);
  if (databaseValue?.trim()) return databaseValue;
  return environmentNames.map(name => process.env[name]?.trim()).find(Boolean) || null;
}

async function fetchAllCollectionItems<T extends object>(
  appkit: AppKit,
  slug: string,
): Promise<Array<AppKitSeedRecord<T>>> {
  const records: Array<AppKitSeedRecord<T>> = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (records.length < total) {
    const result = await appkit.cms.getCollectionItems(slug, {
      page,
      limit: APPKIT_COLLECTION_PAGE_SIZE,
    });
    total = result.total;
    records.push(...result.items.map((item) => normalizeAppKitItem<T>(item)));

    if (result.items.length === 0 || result.items.length < result.limit) break;
    page += 1;
  }

  return records;
}

function normalizeAppKitItem<T extends object>(item: CMSCollectionItem): AppKitSeedRecord<T> {
  return {
    ...(item.attributes as T),
    __appkitId: item.id || null,
    __appkitAppId: item.applicationId || null,
  };
}

function normalizeBaseUrl(value: string | null) {
  const normalized = normalizeSetting(value);
  return normalized ? normalized.replace(/\/+$/, '') : null;
}

function normalizeSetting(value: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}
