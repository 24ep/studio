import {
  getSystemSettingsSaveErrorMessage,
  normalizeSystemSettingsResponse,
  type SystemSettingsRecord,
} from './system-settings-utils';
import { readJsonOrFallback } from '../../../lib/response-json';

type SystemSettingsFetcher = typeof fetch;

export async function fetchSystemSettings(fetcher: SystemSettingsFetcher = fetch): Promise<SystemSettingsRecord> {
  const response = await fetcher('/api/settings/system-settings');

  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string }>(response, {
      message: 'Failed to load system settings',
    });
    throw new Error(errorData.message || 'Failed to load system settings');
  }

  return normalizeSystemSettingsResponse(await readJsonOrFallback<unknown>(response, {}));
}

export async function saveSystemSettings(
  settingsToSave: Array<{ key: string; value: string }>,
  {
    fetcher = fetch,
    timeoutMs = 5000,
  }: {
    fetcher?: SystemSettingsFetcher;
    timeoutMs?: number;
  } = {}
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher('/api/settings/system-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsToSave),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await readJsonOrFallback<Record<string, unknown>>(response, {
        message: 'Failed to save settings',
      });
      if (errorData.errors) {
        console.error('Validation errors:', errorData.errors);
      }
      if (errorData.data) {
        console.error('Data that failed validation:', errorData.data);
      }
      throw new Error(getSystemSettingsSaveErrorMessage(errorData));
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
