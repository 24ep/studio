import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  applyThemeClass,
  scheduleSidebarColorReapply,
} from './use-theme-dom';
import { useThemeUserIdRef } from './use-theme-session';
import {
  getBrowserThemeState,
  isThemePreference,
  resolveThemeFromPreference,
  type ThemeMode,
  type ThemePreference,
  type ThemePreloadedWindow,
} from './use-theme-utils';

export type { ThemePreference } from './use-theme-utils';

const THEME_STATE_EVENT = 'hrive-theme-state-changed';

type ThemeStateEventDetail = {
  preference: ThemePreference;
  theme: ThemeMode;
};

function publishThemeState(preference: ThemePreference, theme: ThemeMode) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ThemeStateEventDetail>(THEME_STATE_EVENT, {
    detail: { preference, theme },
  }));
}

export function useTheme() {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('light');
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const hasInitializedRef = useRef<boolean>(false);
  const userIdRef = useThemeUserIdRef();
  const isUpdatingRef = useRef<boolean>(false);
  const isSidebarUpdatingRef = useRef<boolean>(false);
  const lastUpdateTimeRef = useRef(0);

  // The user action already has its own debounce below. Applying the resolved
  // class must be deterministic; an extra DOM throttle could save a preference
  // without actually changing the visible theme when clicked after startup.
  const applyTheme = useCallback((theme: ThemeMode) => {
    applyThemeClass(theme);
    scheduleSidebarColorReapply(isSidebarUpdatingRef);
  }, []);

  const setTheme = useCallback(async (preference: ThemePreference) => {
    const now = Date.now();
    if (isUpdatingRef.current || now - lastUpdateTimeRef.current < 500) {
      return;
    }

    isUpdatingRef.current = true;
    lastUpdateTimeRef.current = now;

    setThemePreference(preference);
    localStorage.setItem('theme', preference);

    const newTheme = resolveThemeFromPreference(
      preference,
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    setCurrentTheme(newTheme);
    applyTheme(newTheme);
    publishThemeState(preference, newTheme);

    if (userIdRef.current) {
      try {
        await fetch('/api/user-preferences?modelType=appearance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            updates: {
              themePreference: preference,
            },
          }),
        });
      } catch (error) {
        console.warn('Failed to save theme preference:', error);
      }
    }

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 300);
  }, [applyTheme, userIdRef]);

  const toggleTheme = useCallback(() => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    void setTheme(newTheme);
  }, [currentTheme, setTheme]);

  const initDependencies = useMemo(() => ({
    hasInitialized: hasInitializedRef.current,
    applyTheme
  }), [applyTheme]);

  useEffect(() => {
    if (initDependencies.hasInitialized) return;
    hasInitializedRef.current = true;

    const browserThemeState = getBrowserThemeState({
      localStorage,
      matchMedia: window.matchMedia.bind(window),
      themeWindow: window as ThemePreloadedWindow,
    });

    if (!browserThemeState.wasPreloaded) {
      initDependencies.applyTheme(browserThemeState.theme);
    }

    setThemePreference(browserThemeState.preference);
    setCurrentTheme(browserThemeState.theme);
    setMounted(true);
  }, [initDependencies]);

  // Keep every useTheme consumer synchronized. Header, layout and settings can
  // each mount their own hook instance, but they should all expose the same
  // resolved mode and preference immediately after one instance changes it.
  useEffect(() => {
    const handleThemeStateChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeStateEventDetail>).detail;
      if (!detail || !isThemePreference(detail.preference)) return;
      if (detail.theme !== 'light' && detail.theme !== 'dark') return;

      setThemePreference(detail.preference);
      setCurrentTheme(detail.theme);
    };

    window.addEventListener(THEME_STATE_EVENT, handleThemeStateChange);
    return () => window.removeEventListener(THEME_STATE_EVENT, handleThemeStateChange);
  }, []);

  const mediaQueryDependencies = useMemo(() => ({
    mounted,
    themePreference,
    applyTheme
  }), [mounted, themePreference, applyTheme]);

  useEffect(() => {
    if (!mediaQueryDependencies.mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mediaQueryDependencies.themePreference === 'system') {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        setCurrentTheme(newTheme);
        mediaQueryDependencies.applyTheme(newTheme);
        publishThemeState('system', newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mediaQueryDependencies]);

  const memoizedValue = useMemo(() => ({
    mounted,
    currentTheme,
    themePreference,
    setTheme,
    toggleTheme,
  }), [
    mounted,
    currentTheme,
    themePreference,
    setTheme,
    toggleTheme,
  ]);

  return memoizedValue;
}
