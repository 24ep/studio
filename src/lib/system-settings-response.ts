export interface SystemSettingEntry {
  key: string;
  value: unknown;
}

export type SystemSettingsRecord = Record<string, unknown>;

function isSystemSettingEntry(setting: unknown): setting is SystemSettingEntry {
  return (
    setting !== null &&
    typeof setting === 'object' &&
    typeof (setting as { key?: unknown }).key === 'string' &&
    (setting as { key: string }).key.trim().length > 0 &&
    'value' in setting
  );
}

export function normalizeSystemSettingsResponse(data: unknown): SystemSettingsRecord {
  if (data && typeof data === 'object' && Array.isArray((data as { settings?: unknown }).settings)) {
    return Object.fromEntries(
      (data as { settings: unknown[] }).settings
        .filter(isSystemSettingEntry)
        .map(setting => [setting.key.trim(), setting.value])
    );
  }

  return data && typeof data === 'object' ? data as SystemSettingsRecord : {};
}

export function getSystemSettingString(data: unknown, key: string) {
  const value = normalizeSystemSettingsResponse(data)[key];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export function getSystemSettingEnum<T extends string>(
  data: unknown,
  key: string,
  allowedValues: readonly T[],
  fallback: T
) {
  const value = getSystemSettingString(data, key);
  return value && allowedValues.includes(value as T) ? value as T : fallback;
}

export function isSystemSettingEnabled(data: unknown, key: string, defaultEnabled = true) {
  const value = normalizeSystemSettingsResponse(data)[key];

  if (value === false || value === 'false') return false;
  if (value === true || value === 'true') return true;

  return defaultEnabled;
}

export function isPwaEnabledFromSettings(data: unknown) {
  return isSystemSettingEnabled(data, 'pwaEnabled', false);
}
