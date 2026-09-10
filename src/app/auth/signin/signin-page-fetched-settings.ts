import type { CSSProperties } from 'react';

import { normalizeAppName } from '../../../lib/branding';
import type { LoginPageLayoutType } from '../../../lib/types';
import { DEFAULT_PRIMARY_GRADIENT_END_SIGNIN, DEFAULT_PRIMARY_GRADIENT_START_SIGNIN } from './signin-page-utils';
import {
  DEFAULT_LOGIN_LAYOUT_TYPE,
  DEFAULT_LOGIN_PAGE_LOGO_SIZE,
  LOGIN_PAGE_LOGO_SIZE_KEY,
  buildLoginPageStyle,
} from './signin-page-settings-style';
import {
  getDesktopBackgroundSettings,
  getMobileBackgroundSettings,
  getStringSetting,
} from './signin-page-settings-resolvers';

export const DEFAULT_APP_NAME = 'hrive';
export const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
export const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName';

export type MobileHeaderBackgroundType = 'gradient' | 'transparent' | 'solid';

export interface FetchedSignInPageSettings {
  appLogoUrl: string | null;
  contextualLogos: {
    loginPageLogoLightMode?: string | null;
    loginPageLogoDarkMode?: string | null;
  };
  currentAppName: string;
  loginLayoutType: LoginPageLayoutType;
  loginPageLogoSize: number;
  loginPageStyle: CSSProperties;
  mobileHeaderBackgroundType: MobileHeaderBackgroundType;
  mobileHeaderFontColor: string;
  mobileHeaderGradient1: string;
  mobileHeaderGradient2: string;
  mobileHeaderGradient3: string;
  mobileHeaderGradient4: string;
  mobileLoginLogoDataUrl: string | null;
  organizationName: string;
  primaryGradient: string | null;
  primaryGradientEnd: string;
  primaryGradientStart: string;
  showLogoOnly: boolean;
  themePreference: 'system' | 'light' | 'dark';
}

export function buildFetchedSignInPageSettings({
  isMobile,
  isThemeDark,
  settings,
}: {
  isMobile: boolean;
  isThemeDark: boolean;
  settings: Record<string, unknown>;
}): FetchedSignInPageSettings {
  const desktopBackground = getDesktopBackgroundSettings(settings);
  const mobileBackground = getMobileBackgroundSettings(settings);
  const activeBackground = isMobile && mobileBackground.loginBgType
    ? mobileBackground
    : desktopBackground;

  return {
    appLogoUrl: getStringSetting(settings, APP_LOGO_DATA_URL_KEY),
    contextualLogos: {
      loginPageLogoLightMode: getStringSetting(settings, 'loginPageLogoLightMode'),
      loginPageLogoDarkMode: getStringSetting(settings, 'loginPageLogoDarkMode'),
    },
    currentAppName: normalizeAppName(getStringSetting(settings, 'appName'), DEFAULT_APP_NAME),
    loginLayoutType: (settings.loginPageLayoutType as LoginPageLayoutType) || DEFAULT_LOGIN_LAYOUT_TYPE,
    loginPageLogoSize: Number(settings[LOGIN_PAGE_LOGO_SIZE_KEY] || DEFAULT_LOGIN_PAGE_LOGO_SIZE),
    loginPageStyle: buildLoginPageStyle({
      isThemeDark,
      loginBgType: activeBackground.loginBgType || 'gradient',
      loginBgImageUrl: activeBackground.loginBgImageUrl,
      loginBgColor1: activeBackground.loginBgColor1,
      loginBgColor2: activeBackground.loginBgColor2,
      activeLoginGradient: activeBackground.activeLoginGradient,
      activeLoginSolidColor: activeBackground.activeLoginSolidColor,
    }),
    mobileHeaderBackgroundType: (settings.mobileHeaderBackgroundType as MobileHeaderBackgroundType) || 'gradient',
    mobileHeaderFontColor: getStringSetting(settings, 'mobileHeaderFontColor') || '#FFFFFF',
    mobileHeaderGradient1: getStringSetting(settings, 'mobileHeaderGradient1') || '#3B82F6',
    mobileHeaderGradient2: getStringSetting(settings, 'mobileHeaderGradient2') || '#2563EB',
    mobileHeaderGradient3: getStringSetting(settings, 'mobileHeaderGradient3') || '#1D4ED8',
    mobileHeaderGradient4: getStringSetting(settings, 'mobileHeaderGradient4') || '#1E40AF',
    mobileLoginLogoDataUrl: getStringSetting(settings, 'mobileLoginLogoDataUrl'),
    organizationName: getStringSetting(settings, 'organizationName') || '',
    primaryGradient: getStringSetting(settings, 'primaryGradient'),
    primaryGradientEnd: getStringSetting(settings, 'primaryGradientEnd') || DEFAULT_PRIMARY_GRADIENT_END_SIGNIN,
    primaryGradientStart: getStringSetting(settings, 'primaryGradientStart') || DEFAULT_PRIMARY_GRADIENT_START_SIGNIN,
    showLogoOnly: settings.showLogoOnly === 'true' || settings.showLogoOnly === true,
    themePreference: (settings.appThemePreference as 'system' | 'light' | 'dark') || 'system',
  };
}
