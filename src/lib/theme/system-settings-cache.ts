export type ThemeSystemSettingsCache = Record<string, unknown>;

interface SystemSettingsWindow extends Window {
  __systemSettings?: ThemeSystemSettingsCache;
}

function getSystemSettingsWindow() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window as SystemSettingsWindow;
}

export function getThemeSystemSettingsCache() {
  return getSystemSettingsWindow()?.__systemSettings ?? null;
}

export function updateThemeSystemSettingsCache(settings: ThemeSystemSettingsCache) {
  const cache = getThemeSystemSettingsCache();

  if (!cache) {
    return false;
  }

  Object.assign(cache, settings);
  return true;
}
