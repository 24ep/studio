import { describe, expect, it } from 'vitest';
import {
  getBrowserThemeState,
  getPreloadedThemeState,
  getStoredThemePreference,
  isThemePreference,
  resolveThemeFromPreference,
  type ThemePreloadedWindow,
} from './use-theme-utils';

function makeStorage(value: string | null): Pick<Storage, 'getItem'> {
  return {
    getItem: () => value,
  };
}

describe('use-theme-utils', () => {
  it('validates and resolves theme preferences', () => {
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('blue')).toBe(false);
    expect(resolveThemeFromPreference('dark', false)).toBe('dark');
    expect(resolveThemeFromPreference('light', true)).toBe('light');
    expect(resolveThemeFromPreference('system', true)).toBe('dark');
    expect(resolveThemeFromPreference('system', false)).toBe('light');
  });

  it('reads stored and preloaded theme state safely', () => {
    expect(getStoredThemePreference(makeStorage('dark'))).toBe('dark');
    expect(getStoredThemePreference(makeStorage('unknown'))).toBe('system');
    expect(getPreloadedThemeState({
      __THEME_INITIALIZED__: true,
      __THEME_PREFERENCE__: 'system',
      __THEME_IS_DARK__: true,
    } as ThemePreloadedWindow)).toEqual({
      preference: 'system',
      theme: 'dark',
    });
  });

  it('falls back to storage and media query when preload state is missing', () => {
    expect(getBrowserThemeState({
      localStorage: makeStorage('system'),
      matchMedia: () => ({ matches: true }),
      themeWindow: {} as ThemePreloadedWindow,
    })).toEqual({
      preference: 'system',
      theme: 'dark',
      wasPreloaded: false,
    });
  });
});
