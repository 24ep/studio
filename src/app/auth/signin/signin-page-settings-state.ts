import type { CSSProperties, Dispatch, SetStateAction } from "react";

import { normalizeAppName } from "../../../lib/branding";
import type { LoginPageLayoutType, SystemSetting } from "../../../lib/types";
import {
  DEFAULT_LOGIN_LAYOUT_TYPE,
  DEFAULT_LOGIN_PAGE_LOGO_SIZE,
  LOGIN_PAGE_LOGO_SIZE_KEY,
} from "./signin-page-settings-style";
import {
  APP_LOGO_DATA_URL_KEY,
  DEFAULT_APP_NAME,
  type FetchedSignInPageSettings,
  type MobileHeaderBackgroundType,
} from "./signin-page-fetched-settings";

export interface InitialSignInPageSettingsState {
  appLogoUrl: string | null;
  currentAppName: string;
  loginLayoutType: LoginPageLayoutType;
  loginPageLogoSize: number;
  showLogoOnly: boolean;
}

export function buildInitialSignInPageSettingsState(
  initialSettings: SystemSetting[] | undefined,
): InitialSignInPageSettingsState {
  const logoSizeSetting = initialSettings?.find(
    (setting) => setting.key === LOGIN_PAGE_LOGO_SIZE_KEY,
  );

  return {
    appLogoUrl:
      initialSettings?.find((setting) => setting.key === APP_LOGO_DATA_URL_KEY)
        ?.value || null,
    currentAppName: normalizeAppName(
      initialSettings?.find((setting) => setting.key === "appName")?.value,
      DEFAULT_APP_NAME,
    ),
    loginLayoutType:
      (initialSettings?.find((setting) => setting.key === "loginPageLayoutType")
        ?.value as LoginPageLayoutType) || DEFAULT_LOGIN_LAYOUT_TYPE,
    loginPageLogoSize: logoSizeSetting?.value
      ? parseInt(logoSizeSetting.value) || DEFAULT_LOGIN_PAGE_LOGO_SIZE
      : DEFAULT_LOGIN_PAGE_LOGO_SIZE,
    showLogoOnly:
      initialSettings?.find((setting) => setting.key === "showLogoOnly")
        ?.value === "true",
  };
}

interface ApplyFetchedSignInSettingsOptions {
  pageSettings: FetchedSignInPageSettings;
  setAppLogoUrl: Dispatch<SetStateAction<string | null>>;
  setContextualLogos: Dispatch<
    SetStateAction<{
      loginPageLogoLightMode?: string | null;
      loginPageLogoDarkMode?: string | null;
    }>
  >;
  setCurrentAppName: Dispatch<SetStateAction<string>>;
  setLoginLayoutType: Dispatch<SetStateAction<LoginPageLayoutType>>;
  setLoginPageLogoSize: Dispatch<SetStateAction<number>>;
  setLoginPageStyle: Dispatch<SetStateAction<CSSProperties>>;
  setMobileHeaderBackgroundType: Dispatch<
    SetStateAction<MobileHeaderBackgroundType>
  >;
  setMobileHeaderFontColor: Dispatch<SetStateAction<string>>;
  setMobileHeaderGradient1: Dispatch<SetStateAction<string>>;
  setMobileHeaderGradient2: Dispatch<SetStateAction<string>>;
  setMobileHeaderGradient3: Dispatch<SetStateAction<string>>;
  setMobileHeaderGradient4: Dispatch<SetStateAction<string>>;
  setMobileLoginLogoDataUrl: Dispatch<SetStateAction<string | null>>;
  setOrganizationName: Dispatch<SetStateAction<string>>;
  setShowLogoOnly: Dispatch<SetStateAction<boolean>>;
}

export function applyFetchedSignInSettings({
  pageSettings,
  setAppLogoUrl,
  setContextualLogos,
  setCurrentAppName,
  setLoginLayoutType,
  setLoginPageLogoSize,
  setLoginPageStyle,
  setMobileHeaderBackgroundType,
  setMobileHeaderFontColor,
  setMobileHeaderGradient1,
  setMobileHeaderGradient2,
  setMobileHeaderGradient3,
  setMobileHeaderGradient4,
  setMobileLoginLogoDataUrl,
  setOrganizationName,
  setShowLogoOnly,
}: ApplyFetchedSignInSettingsOptions) {
  setCurrentAppName(pageSettings.currentAppName);
  setAppLogoUrl(pageSettings.appLogoUrl);
  setContextualLogos(pageSettings.contextualLogos);
  setOrganizationName(pageSettings.organizationName);
  setShowLogoOnly(pageSettings.showLogoOnly);
  setLoginLayoutType(pageSettings.loginLayoutType);
  setLoginPageLogoSize(pageSettings.loginPageLogoSize);
  setLoginPageStyle(pageSettings.loginPageStyle);
  setMobileHeaderGradient1(pageSettings.mobileHeaderGradient1);
  setMobileHeaderGradient2(pageSettings.mobileHeaderGradient2);
  setMobileHeaderGradient3(pageSettings.mobileHeaderGradient3);
  setMobileHeaderGradient4(pageSettings.mobileHeaderGradient4);
  setMobileHeaderFontColor(pageSettings.mobileHeaderFontColor);
  setMobileHeaderBackgroundType(pageSettings.mobileHeaderBackgroundType);
  setMobileLoginLogoDataUrl(pageSettings.mobileLoginLogoDataUrl);
}
