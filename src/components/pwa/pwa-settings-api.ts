import { readJsonOrFallback } from '@/lib/response-json';

import { getPwaMetaSettings, type PwaMetaSettings } from './pwa-meta-tags-utils';
import { isPwaEnabledFromSettings } from './pwa-settings-utils';

type PwaSettingsFetcher = typeof fetch;

export interface PwaSettingsState {
  enabled: boolean;
  metaSettings: PwaMetaSettings;
}

const PWA_SETTINGS_KEYS = [
  'pwaEnabled',
  'appName',
  'pwaThemeColor',
  'pwaBackgroundColor',
  'pwaAppleMobileWebAppTitle',
  'pwaAppleMobileWebAppStatusBarStyle',
];

const PWA_SETTINGS_URL = `/api/settings/system-settings?${new URLSearchParams({
  keys: PWA_SETTINGS_KEYS.join(','),
}).toString()}`;

export async function fetchPwaSettingsState(
  fetcher: PwaSettingsFetcher = fetch,
): Promise<PwaSettingsState | null> {
  const response = await fetcher(PWA_SETTINGS_URL);
  if (!response.ok) {
    return null;
  }

  const data = await readJsonOrFallback<unknown>(response, {});
  return {
    enabled: isPwaEnabledFromSettings(data),
    metaSettings: getPwaMetaSettings(data),
  };
}
