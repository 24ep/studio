import { normalizeAppName } from '../../lib/branding';
import { normalizeSystemSettingsResponse } from '../../lib/system-settings-response';
import {
  asBooleanPreference,
  asNumberPreference,
  getNullableStringPreference,
  getStringPreference,
  getThemePreference,
} from './app-layout-preference-utils';
import { APP_LAYOUT_SIDEBAR_COLOR_KEYS } from './app-layout-sidebar-color-keys';
import type {
  AppConfigChangedDetail,
  AppLayoutContextualLogos,
  AppLayoutSettingsRecord,
} from './app-layout-settings-types';

const DEFAULT_APP_NAME = "hrive";

type AppThemePreference = 'system' | 'light' | 'dark';

export type { AppLayoutContextualLogos, AppLayoutSettingsRecord };

export function parseAppLayoutSettingsResponse(data: unknown): AppLayoutSettingsRecord {
  return normalizeSystemSettingsResponse(data);
}

export function buildAppLayoutConfigUpdates(prefs: AppLayoutSettingsRecord) {
  return {
    appLogoUrl: getNullableStringPreference(prefs, 'appLogoDataUrl'),
    currentAppName: normalizeAppName(getStringPreference(prefs, 'appName'), DEFAULT_APP_NAME),
    showLogoOnly: asBooleanPreference(prefs.showLogoOnly),
    sidebarLogoSize: asNumberPreference(prefs.sidebarLogoSize, 48),
    collapsedSidebarLogoSize: asNumberPreference(prefs.collapsedSidebarLogoSize, 40),
    contextualLogos: {
      sidebarLogoCollapsedLightMode: getNullableStringPreference(prefs, 'sidebarLogoCollapsedLightMode'),
      sidebarLogoExpandedLightMode: getNullableStringPreference(prefs, 'sidebarLogoExpandedLightMode'),
      sidebarLogoCollapsedDarkMode: getNullableStringPreference(prefs, 'sidebarLogoCollapsedDarkMode'),
      sidebarLogoExpandedDarkMode: getNullableStringPreference(prefs, 'sidebarLogoExpandedDarkMode'),
    } satisfies AppLayoutContextualLogos,
  };
}

export function buildAppConfigChangedUpdates(detail?: AppConfigChangedDetail | null) {
  if (!detail) return {};

  return {
    ...(detail.appName ? { currentAppName: normalizeAppName(detail.appName, DEFAULT_APP_NAME) } : {}),
    // The application logo is owned by Outborn Account. Local settings events
    // may update display preferences, but they must never replace appLogoUrl.
    ...(detail.showLogoOnly !== undefined ? { showLogoOnly: detail.showLogoOnly } : {}),
    ...(detail.sidebarLogoSize !== undefined ? { sidebarLogoSize: detail.sidebarLogoSize } : {}),
    ...(detail.collapsedSidebarLogoSize !== undefined
      ? { collapsedSidebarLogoSize: detail.collapsedSidebarLogoSize }
      : {}),
  };
}

export function buildAppLayoutThemeConfig(prefs: AppLayoutSettingsRecord) {
  const sidebarColors: Record<string, string> = {};
  APP_LAYOUT_SIDEBAR_COLOR_KEYS.forEach(key => {
    const value = getStringPreference(prefs, key);
    if (value) {
      sidebarColors[key] = value;
    }
  });

  return {
    themePreference: getThemePreference(prefs),
    primaryGradient: getNullableStringPreference(prefs, 'primaryGradient'),
    sidebarColors,
    primaryButtonShadows: {
      primaryButtonShadowL: getNullableStringPreference(prefs, 'primaryButtonShadowL'),
      primaryButtonShadowHoverL: getNullableStringPreference(prefs, 'primaryButtonShadowHoverL'),
      primaryButtonShadowD: getNullableStringPreference(prefs, 'primaryButtonShadowD'),
      primaryButtonShadowHoverD: getNullableStringPreference(prefs, 'primaryButtonShadowHoverD'),
    },
  };
}

/**
 * The user's resolved light/dark choice is authoritative. App/system settings
 * are allowed to provide palette values, but must not switch the resolved
 * mode after useTheme (and the pre-hydration initializer) have selected it.
 */
export function resolveAppLayoutThemePreference(
  configuredPreference: AppThemePreference,
  resolvedTheme?: string | null,
): AppThemePreference {
  return resolvedTheme === 'light' || resolvedTheme === 'dark'
    ? resolvedTheme
    : configuredPreference;
}

export async function initializeAppLayoutSidebarStyles() {
  try {
    const { initializeSidebarStyles } = await import('@/lib/themeUtils');
    initializeSidebarStyles();
  } catch (error) {
    console.warn('[APPLAYOUT] Error loading theme utils:', error);
  }
}

export async function applyAppLayoutThemeSettings(
  prefs: AppLayoutSettingsRecord,
  themeConfig: ReturnType<typeof buildAppLayoutThemeConfig>
) {
  try {
    const { setThemeAndColors } = await import('@/lib/themeUtils');
    const resolvedTheme = typeof document !== 'undefined'
      ? document.documentElement.dataset.resolvedTheme
      : null;
    const effectiveThemeConfig = {
      ...themeConfig,
      themePreference: resolveAppLayoutThemePreference(themeConfig.themePreference, resolvedTheme),
    };

    // setThemeAndColors receives the full sidebar palette and applies it once
    // against the already resolved user theme. Avoid a pre-pass that can flash
    // the wrong light/dark sidebar during hydration or login.
    setThemeAndColors(effectiveThemeConfig);
  } catch (error) {
    console.warn('[APPLAYOUT] Error applying theme and colors:', error);
  }

  const sidebarBackgroundType = getStringPreference(prefs, 'sidebarBackgroundType');
  const sidebarBackgroundImageUrl = getStringPreference(prefs, 'sidebarBackgroundImageUrl');

  if (sidebarBackgroundType || sidebarBackgroundImageUrl) {
    try {
      const { applySidebarBackgroundSettings } = await import('@/lib/themeUtils');
      applySidebarBackgroundSettings({
        sidebarBackgroundType,
        sidebarBackgroundImageUrl,
        sidebarBackgroundImageFit: getStringPreference(prefs, 'sidebarBackgroundImageFit'),
        sidebarBackgroundImagePosition: getStringPreference(prefs, 'sidebarBackgroundImagePosition'),
        sidebarBackgroundBlurPercent: getStringPreference(prefs, 'sidebarBackgroundBlurPercent'),
        sidebarBackgroundTranslucencyPercent: getStringPreference(prefs, 'sidebarBackgroundTranslucencyPercent'),
      });
    } catch (error) {
      console.warn('[APPLAYOUT] Error loading theme utils:', error);
    }
  }

  if (Object.keys(themeConfig.sidebarColors).length > 0) {
    try {
      const { reapplyCurrentSidebarColors } = await import('@/lib/themeUtils');
      setTimeout(() => {
        reapplyCurrentSidebarColors();
      }, 100);
    } catch (error) {
      console.warn('[APPLAYOUT] Error loading theme utils:', error);
    }
  }
}

export async function reapplyAppLayoutSidebarStylesAfterLogin() {
  try {
    const { reapplyCurrentSidebarColors, applySidebarBackgroundToCSS } = await import('@/lib/themeUtils');
    reapplyCurrentSidebarColors();
    applySidebarBackgroundToCSS();
  } catch (error) {
    console.warn('[APPLAYOUT] Error reapplying sidebar styles after login:', error);
  }
}

export async function reapplyAppLayoutSidebarColorsForThemeChange() {
  try {
    const { reapplyCurrentSidebarColors, applySidebarBackgroundToCSS } = await import('@/lib/themeUtils');
    reapplyCurrentSidebarColors();
    applySidebarBackgroundToCSS();
  } catch (error) {
    console.warn('[APPLAYOUT] Error loading theme utils:', error);
  }
}
