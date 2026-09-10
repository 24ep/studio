import type { AppLayoutSettingsRecord } from './app-layout-settings-types';

export function asNumberPreference(value: unknown, fallback: number) {
  const parsedValue = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? parseInt(value, 10)
      : Number.NaN;
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

export function asBooleanPreference(value: unknown) {
  return value === true || value === 'true';
}

export function getStringPreference(prefs: AppLayoutSettingsRecord, key: string) {
  const value = prefs[key];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export function getNullableStringPreference(prefs: AppLayoutSettingsRecord, key: string) {
  return getStringPreference(prefs, key) ?? null;
}

export function getThemePreference(prefs: AppLayoutSettingsRecord): 'system' | 'light' | 'dark' {
  const value = getStringPreference(prefs, 'appThemePreference');
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}
