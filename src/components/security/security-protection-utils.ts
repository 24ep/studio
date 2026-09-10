import { readJsonOrFallback } from '../../lib/response-json';
import { normalizeSystemSettingsResponse } from '../../lib/system-settings-response';

export const SYSTEM_SETTINGS_URL = '/api/settings/system-settings';

export function getBooleanSystemSetting(data: unknown, key: string, fallback = false) {
  const settings = normalizeSystemSettingsResponse(data);
  const value = settings[key];

  if (value === undefined || value === null) {
    return fallback;
  }

  return value === true || value === 'true';
}

export async function fetchSystemProtectionEnabled(
  key: string,
  fetcher: typeof fetch = fetch
) {
  const params = new URLSearchParams({ keys: key });
  const response = await fetcher(`${SYSTEM_SETTINGS_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch settings: ${response.statusText || response.status}`);
  }

  return getBooleanSystemSetting(await readJsonOrFallback<unknown>(response, {}), key);
}

export function isWindowsSnippingShortcut(event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'metaKey' | 'getModifierState'>) {
  return (
    event.key.toLowerCase() === 's' &&
    event.shiftKey &&
    (event.metaKey || event.getModifierState('OS') || event.getModifierState('Win'))
  );
}

export function isMacScreenshotShortcut(event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'metaKey'>) {
  return event.metaKey && event.shiftKey && ['3', '4', '5'].includes(event.key);
}

export function isOverlayScreenshotShortcut(event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'metaKey' | 'getModifierState'>) {
  return event.key === 'PrintScreen' || isWindowsSnippingShortcut(event);
}

export function isScreenshotAttemptShortcut(event: Pick<KeyboardEvent, 'key' | 'shiftKey' | 'metaKey' | 'getModifierState'>) {
  return isOverlayScreenshotShortcut(event) || isMacScreenshotShortcut(event);
}

export function applyProtectedContentVisibility(rootElement: HTMLElement | null, hidden: boolean) {
  if (!rootElement) return;

  rootElement.style.filter = hidden ? 'blur(20px)' : '';
  rootElement.style.pointerEvents = hidden ? 'none' : '';
  rootElement.style.userSelect = hidden ? 'none' : '';
}
