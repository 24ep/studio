export type ThemePreference = 'light' | 'dark' | 'system';
export type ThemeMode = 'light' | 'dark';

export type ThemePreloadedWindow = Window & {
  __THEME_INITIALIZED__?: boolean;
  __THEME_PREFERENCE__?: unknown;
  __THEME_IS_DARK__?: boolean;
};

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function resolveThemeFromPreference(
  preference: ThemePreference,
  prefersDark: boolean
): ThemeMode {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return prefersDark ? 'dark' : 'light';
}

export function getStoredThemePreference(storage: Pick<Storage, 'getItem'>): ThemePreference {
  const savedTheme = storage.getItem('theme');
  return isThemePreference(savedTheme) ? savedTheme : 'system';
}

export function getPreloadedThemeState(themeWindow: ThemePreloadedWindow) {
  const wasPreInitialized = themeWindow.__THEME_INITIALIZED__;
  const preference = themeWindow.__THEME_PREFERENCE__;
  const isDark = themeWindow.__THEME_IS_DARK__;

  if (!wasPreInitialized || !isThemePreference(preference) || typeof isDark !== 'boolean') {
    return null;
  }

  return {
    preference,
    theme: isDark ? 'dark' : 'light' as ThemeMode,
  };
}

export function getBrowserThemeState({
  localStorage,
  matchMedia,
  themeWindow,
}: {
  localStorage: Pick<Storage, 'getItem'>;
  matchMedia: (query: string) => Pick<MediaQueryList, 'matches'>;
  themeWindow: ThemePreloadedWindow;
}) {
  const preloadedState = getPreloadedThemeState(themeWindow);
  if (preloadedState) {
    return { ...preloadedState, wasPreloaded: true };
  }

  const preference = getStoredThemePreference(localStorage);
  const theme = resolveThemeFromPreference(
    preference,
    matchMedia('(prefers-color-scheme: dark)').matches
  );

  return { preference, theme, wasPreloaded: false };
}
