import {
  normalizeSystemSettingsResponse as normalizeSharedSystemSettingsResponse,
  type SystemSettingsRecord,
} from '../../../lib/system-settings-response';

export type { SystemSettingsRecord };

const APP_NAME_KEYS = ['appName', 'organizationName'];
const APP_LOGO_KEYS = ['appLogoDataUrl', 'organizationLogoDataUrl'];
const APP_FAVICON_KEYS = ['appFaviconDataUrl'];

export function normalizeSystemSettingsResponse(responseData: unknown): SystemSettingsRecord {
  return normalizeSharedSystemSettingsResponse(responseData);
}

export function getSystemSettingsSaveErrorMessage(errorData: unknown, fallback = 'Failed to save settings') {
  const message = errorData && typeof errorData === 'object'
    ? (errorData as { message?: unknown }).message
    : undefined;

  return typeof message === 'string' && message
    ? message
    : fallback;
}

export function getAppConfigChangeDetail(settingsToSave: Array<{ key: string; value: string }>) {
  const appName = settingsToSave.find(setting => APP_NAME_KEYS.includes(setting.key))?.value || null;
  const logoUrl = settingsToSave.find(setting => APP_LOGO_KEYS.includes(setting.key))?.value || null;
  const faviconDataUrl = settingsToSave.find(setting => APP_FAVICON_KEYS.includes(setting.key))?.value || null;

  return {
    changed: Boolean(appName || logoUrl || faviconDataUrl),
    appName,
    faviconDataUrl,
    logoUrl,
  };
}
