import { describe, expect, it } from 'vitest';

import {
  buildAppConfigChangedUpdates,
  buildAppLayoutConfigUpdates,
  buildAppLayoutThemeConfig,
  parseAppLayoutSettingsResponse,
  resolveAppLayoutThemePreference,
} from './app-layout-settings';

describe('app-layout-settings', () => {
  it('normalizes system settings responses into a preference record', () => {
    expect(parseAppLayoutSettingsResponse({
      settings: [
        { key: 'appName', value: 'Acme Hiring' },
        { key: 'showLogoOnly', value: 'true' },
        { key: '', value: 'ignored' },
        { value: 'missing key' },
      ],
    })).toEqual({
      appName: 'Acme Hiring',
      showLogoOnly: 'true',
    });
  });

  it('builds app config updates from typed preference values only', () => {
    expect(buildAppLayoutConfigUpdates({
      appName: 'Acme Hiring',
      appLogoDataUrl: 42,
      showLogoOnly: 'true',
      sidebarLogoSize: '72px',
      collapsedSidebarLogoSize: false,
      sidebarLogoCollapsedLightMode: 'collapsed-light.png',
      sidebarLogoExpandedLightMode: '',
      sidebarLogoCollapsedDarkMode: ['bad'],
      sidebarLogoExpandedDarkMode: 'expanded-dark.png',
    })).toEqual({
      appLogoUrl: null,
      currentAppName: 'Acme Hiring',
      showLogoOnly: true,
      sidebarLogoSize: 72,
      collapsedSidebarLogoSize: 40,
      contextualLogos: {
        sidebarLogoCollapsedLightMode: 'collapsed-light.png',
        sidebarLogoExpandedLightMode: null,
        sidebarLogoCollapsedDarkMode: null,
        sidebarLogoExpandedDarkMode: 'expanded-dark.png',
      },
    });
  });

  it('uses defaults when app config preferences are absent or blank', () => {
    expect(buildAppLayoutConfigUpdates({
      appName: '   ',
      showLogoOnly: false,
      sidebarLogoSize: {},
    })).toMatchObject({
      appLogoUrl: null,
      currentAppName: 'hrive',
      showLogoOnly: false,
      sidebarLogoSize: 48,
      collapsedSidebarLogoSize: 40,
    });
  });

  it('extracts theme config while ignoring wrong-typed color values', () => {
    expect(buildAppLayoutThemeConfig({
      appThemePreference: 'dark',
      primaryGradient: 'linear-gradient(red, blue)',
      sidebarBgStartL: '#ffffff',
      sidebarBgEndL: 123,
      primaryButtonShadowL: '0 1px 2px rgb(0 0 0 / 0.1)',
      primaryButtonShadowHoverL: '',
      primaryButtonShadowD: null,
    })).toEqual({
      themePreference: 'dark',
      primaryGradient: 'linear-gradient(red, blue)',
      sidebarColors: {
        sidebarBgStartL: '#ffffff',
      },
      primaryButtonShadows: {
        primaryButtonShadowL: '0 1px 2px rgb(0 0 0 / 0.1)',
        primaryButtonShadowHoverL: null,
        primaryButtonShadowD: null,
        primaryButtonShadowHoverD: null,
      },
    });
  });

  it('preserves the already resolved user theme when app palette settings are reapplied', () => {
    expect(resolveAppLayoutThemePreference('system', 'dark')).toBe('dark');
    expect(resolveAppLayoutThemePreference('dark', 'light')).toBe('light');
    expect(resolveAppLayoutThemePreference('system', null)).toBe('system');
  });

  it('never lets local app config events override the Outborn Account logo', () => {
    expect(buildAppConfigChangedUpdates({
      appName: 'Acme Hiring',
      logoUrl: 'local-logo-that-must-be-ignored.png',
      sidebarLogoSize: 64,
    })).toEqual({
      currentAppName: 'Acme Hiring',
      sidebarLogoSize: 64,
    });
  });
});
