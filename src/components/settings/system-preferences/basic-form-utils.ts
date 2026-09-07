import { toast } from 'react-hot-toast';

import { getJsonString, readJsonObject, readJsonOrFallback } from '../../../lib/response-json';
import { normalizeSystemSettingsResponse } from '../../../lib/system-settings-response';

import {
  APP_FAVICON_DATA_URL_KEY,
  APP_LOGO_DATA_URL_KEY,
  APP_NAME_KEY,
  APP_THEME_KEY,
  DEFAULT_APP_NAME,
  type ThemePreference,
} from './constants';

export const DEFAULT_BASIC_THEME: ThemePreference = 'system';
export const DEFAULT_SIDEBAR_LOGO_SIZE = 48;
export const SHOW_LOGO_ONLY_KEY = 'showLogoOnly';
export const SIDEBAR_LOGO_SIZE_KEY = 'sidebarLogoSize';
export const SYSTEM_SETTINGS_URL = '/api/settings/system-settings';
export const UPLOAD_IMAGE_URL = '/api/upload-image';

export interface BasicSystemPreferencesState {
  appFaviconUrl: string | null;
  appLogoUrl: string | null;
  appName: string;
  showLogoOnly: boolean;
  sidebarLogoSize: number;
  themePreference: ThemePreference;
}

export interface BasicSystemPreferenceEntry {
  key: string;
  value: string;
}

export function buildBasicSystemPreferencesState(rawSettings: unknown): BasicSystemPreferencesState {
  const settings = normalizeSystemSettingsResponse(rawSettings);

  return {
    appName: asString(settings[APP_NAME_KEY], DEFAULT_APP_NAME),
    // Kept for backwards-compatible settings reads only. Runtime application
    // branding no longer consumes this value; Outborn Account owns the logo.
    appLogoUrl: asNullableString(settings[APP_LOGO_DATA_URL_KEY]),
    appFaviconUrl: asNullableString(settings[APP_FAVICON_DATA_URL_KEY]),
    themePreference: (settings[APP_THEME_KEY] as ThemePreference) || DEFAULT_BASIC_THEME,
    showLogoOnly: asBooleanPreference(settings[SHOW_LOGO_ONLY_KEY]),
    sidebarLogoSize: asNumberPreference(settings[SIDEBAR_LOGO_SIZE_KEY], DEFAULT_SIDEBAR_LOGO_SIZE),
  };
}

export function buildBasicSystemPreferencesSavePayload({
  appFaviconUrl,
  appName,
  showLogoOnly,
  sidebarLogoSize,
  themePreference,
}: BasicSystemPreferencesState): BasicSystemPreferenceEntry[] {
  return [
    { key: APP_NAME_KEY, value: appName },
    { key: APP_FAVICON_DATA_URL_KEY, value: appFaviconUrl || '' },
    { key: APP_THEME_KEY, value: themePreference },
    { key: SHOW_LOGO_ONLY_KEY, value: showLogoOnly.toString() },
    { key: SIDEBAR_LOGO_SIZE_KEY, value: sidebarLogoSize.toString() },
  ];
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function uploadPreferenceImage(file: File, loadingMessage: string, successMessage: string, type?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (type) {
    formData.append('type', type);
  }

  const loadingToast = toast.loading(loadingMessage);
  const response = await fetch(UPLOAD_IMAGE_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await readJsonObject(response);
  toast.success(successMessage, { id: loadingToast });

  const url = getJsonString(data, 'url');
  if (!url) {
    throw new Error('Upload response missing URL');
  }

  return url;
}

export async function readBasicSystemPreferencesSaveError(response: Response) {
  const errorData = await readJsonOrFallback<{ message?: string }>(response, { message: 'Failed to save settings' });
  console.error('Save settings error:', errorData);
  return errorData.message || 'Failed to save settings';
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown) {
  return typeof value === 'string' && value ? value : null;
}

function asBooleanPreference(value: unknown) {
  return value === true || value === 'true';
}

function asNumberPreference(value: unknown, fallback: number) {
  const parsedValue = typeof value === 'number' ? value : parseInt(String(value), 10);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}
