import { describe, expect, it } from 'vitest';
import {
  DARK_THEME_BACKGROUND,
  DEFAULT_PWA_APPLE_STATUS_BAR_STYLE,
  DEFAULT_PWA_APPLE_TITLE,
  DEFAULT_PWA_THEME_COLOR,
  getAppleMetaTags,
  getBackgroundColorFromThemeState,
  getPwaMetaSettings,
  LIGHT_THEME_BACKGROUND,
  PWA_META_TAG_NAMES,
  shouldUseDynamicThemeColor,
} from './pwa-meta-tags-utils';

describe('pwa-meta-tags-utils', () => {
  it('derives metadata settings from array or object responses', () => {
    expect(
      getPwaMetaSettings({
        settings: [
          { key: 'pwaThemeColor', value: '#123456' },
          { key: 'pwaBackgroundColor', value: '#654321' },
          { key: 'pwaAppleMobileWebAppTitle', value: 'Studio' },
          { key: 'pwaAppleMobileWebAppStatusBarStyle', value: 'black' },
        ],
      })
    ).toEqual({
      themeColor: '#123456',
      backgroundColor: '#654321',
      appleTitle: 'Studio',
      appleStatusBarStyle: 'black',
    });

    expect(getPwaMetaSettings({})).toEqual({
      themeColor: DEFAULT_PWA_THEME_COLOR,
      backgroundColor: DARK_THEME_BACKGROUND,
      appleTitle: DEFAULT_PWA_APPLE_TITLE,
      appleStatusBarStyle: DEFAULT_PWA_APPLE_STATUS_BAR_STYLE,
    });
  });

  it('resolves background color from DOM theme state and preferences', () => {
    expect(
      getBackgroundColorFromThemeState({
        isDarkClassApplied: true,
        savedTheme: 'light',
        prefersDark: false,
      })
    ).toBe(DARK_THEME_BACKGROUND);
    expect(
      getBackgroundColorFromThemeState({
        isDarkClassApplied: false,
        savedTheme: 'dark',
        prefersDark: false,
      })
    ).toBe(DARK_THEME_BACKGROUND);
    expect(
      getBackgroundColorFromThemeState({
        isDarkClassApplied: false,
        savedTheme: 'system',
        prefersDark: true,
      })
    ).toBe(DARK_THEME_BACKGROUND);
    expect(
      getBackgroundColorFromThemeState({
        isDarkClassApplied: false,
        savedTheme: 'light',
        prefersDark: true,
      })
    ).toBe(LIGHT_THEME_BACKGROUND);
  });

  it('uses dynamic theme colors only for unset/default values', () => {
    expect(shouldUseDynamicThemeColor(undefined)).toBe(true);
    expect(shouldUseDynamicThemeColor(DEFAULT_PWA_THEME_COLOR)).toBe(true);
    expect(shouldUseDynamicThemeColor('#123456')).toBe(false);
  });

  it('builds complete Apple and mobile web app meta tag definitions', () => {
    const tags = getAppleMetaTags({
      themeColor: '#123456',
      backgroundColor: '#654321',
      appleTitle: 'Studio',
      appleStatusBarStyle: 'black-translucent',
    });

    expect(tags).toContainEqual({ name: 'apple-mobile-web-app-capable', content: 'yes' });
    expect(tags).toContainEqual({ name: 'mobile-web-app-capable', content: 'yes' });
    expect(tags).toContainEqual({ name: 'apple-mobile-web-app-title', content: 'Studio' });
    expect(tags).toContainEqual({
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    });
  });

  it('includes every generated meta tag name in the removal list', () => {
    const generatedNames = getAppleMetaTags({
      themeColor: '#123456',
      backgroundColor: '#654321',
      appleTitle: 'Studio',
      appleStatusBarStyle: 'default',
    }).map(tag => tag.name);

    expect(PWA_META_TAG_NAMES).toEqual(expect.arrayContaining(['theme-color', ...generatedNames]));
  });
});
