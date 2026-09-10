import { readJsonOrFallback } from '../../../lib/response-json';
import {
  normalizeSystemSettingsResponse,
  type SystemSettingsRecord,
} from '../../../lib/system-settings-response';

type SystemPreferencesFetcher = typeof fetch;

export async function fetchSystemPreferences({
  signal,
  fetcher = fetch,
}: {
  signal?: AbortSignal;
  fetcher?: SystemPreferencesFetcher;
} = {}): Promise<SystemSettingsRecord> {
  const response = await fetcher('/api/settings/system-settings', { signal });

  if (!response.ok) {
    throw new Error('Failed to load system preferences');
  }

  return normalizeSystemSettingsResponse(await readJsonOrFallback<unknown>(response, {}));
}

export async function saveSystemPreferences(
  formData: FormData,
  fetcher: SystemPreferencesFetcher = fetch,
): Promise<SystemSettingsRecord> {
  const response = await fetcher('/api/settings/system-settings', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to save preferences');
  }

  return normalizeSystemSettingsResponse(await readJsonOrFallback<unknown>(response, {}));
}
