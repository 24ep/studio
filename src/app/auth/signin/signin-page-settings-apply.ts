import type { CSSProperties } from 'react';

import type { SystemSetting } from '@/lib/types';
import { buildLoginPageStyle } from './signin-page-background-style';
import {
  getDesktopBackgroundSettings,
  getMobileBackgroundSettings,
  getSettingValue,
} from './signin-page-settings-background';
import {
  applyMobileHeaderSettings,
  type MobileHeaderSettingsSetters,
} from './signin-page-mobile-header-settings';
import {
  LOGIN_PAGE_LOGO_SIZE_KEY,
} from './signin-page-settings-constants';
import { applySignInThemeSettings } from './signin-page-theme-settings';

interface ApplyInitialSettingsInput extends MobileHeaderSettingsSetters {
  initialSettings: SystemSetting[];
  isMobile: boolean;
  isThemeDark: boolean;
  setLoginPageStyle: (style: CSSProperties) => void;
  setOrganizationName: (name: string) => void;
  setLoginPageLogoSize: (size: number) => void;
}

export function applyInitialSettings({
  initialSettings,
  isMobile,
  isThemeDark,
  setLoginPageStyle,
  setOrganizationName,
  setLoginPageLogoSize,
  setMobileHeaderGradient1,
  setMobileHeaderGradient2,
  setMobileHeaderGradient3,
  setMobileHeaderGradient4,
  setMobileHeaderFontColor,
  setMobileHeaderBackgroundType,
  setMobileLoginLogoDataUrl,
}: ApplyInitialSettingsInput) {
  const desktopBackground = getDesktopBackgroundSettings(initialSettings);
  const mobileBackground = getMobileBackgroundSettings(initialSettings);
  const shouldUseMobileBg = isMobile && mobileBackground.type;
  const activeBackground = shouldUseMobileBg ? mobileBackground : desktopBackground;

  setOrganizationName(getSettingValue(initialSettings, 'organizationName') || '');
  setLoginPageStyle(buildLoginPageStyle({
    isThemeDark,
    loginBgType: activeBackground.type || 'gradient',
    loginBgImageUrl: activeBackground.imageUrl,
    loginBgColor1: activeBackground.color1,
    loginBgColor2: activeBackground.color2,
    activeLoginGradient: activeBackground.gradient,
    activeLoginSolidColor: activeBackground.solidColor,
  }));

  applySignInThemeSettings(initialSettings);

  const logoSizeVal = getSettingValue(initialSettings, LOGIN_PAGE_LOGO_SIZE_KEY);
  setLoginPageLogoSize(logoSizeVal ? parseInt(String(logoSizeVal), 10) : 250);
  applyMobileHeaderSettings({
    initialSettings,
    setMobileHeaderGradient1,
    setMobileHeaderGradient2,
    setMobileHeaderGradient3,
    setMobileHeaderGradient4,
    setMobileHeaderFontColor,
    setMobileHeaderBackgroundType,
    setMobileLoginLogoDataUrl,
  });
}
