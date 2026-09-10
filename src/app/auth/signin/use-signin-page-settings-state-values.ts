"use client";

import { useState, type CSSProperties } from "react";

import type { LoginPageLayoutType } from '@/lib/types';
import type { InitialSignInPageSettingsState } from './signin-page-settings-state';
import type { MobileHeaderBackgroundType } from './signin-page-fetched-settings';

export function useSignInPageSettingsStateValues(initialState: InitialSignInPageSettingsState) {
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(initialState.appLogoUrl);
  const [contextualLogos, setContextualLogos] = useState<{
    loginPageLogoLightMode?: string | null;
    loginPageLogoDarkMode?: string | null;
  }>({});
  const [currentAppName, setCurrentAppName] = useState<string>(initialState.currentAppName);
  const [showLogoOnly, setShowLogoOnly] = useState<boolean>(initialState.showLogoOnly);
  const [isClient, setIsClient] = useState(false);
  const [loginPageStyle, setLoginPageStyle] = useState<CSSProperties>({});
  const [isThemeDark, setIsThemeDark] = useState(false);
  const [loginLayoutType, setLoginLayoutType] = useState<LoginPageLayoutType>(initialState.loginLayoutType);
  const [loginPageLogoSize, setLoginPageLogoSize] = useState<number>(initialState.loginPageLogoSize);
  const [mobileHeaderGradient1, setMobileHeaderGradient1] = useState<string>('#3B82F6');
  const [mobileHeaderGradient2, setMobileHeaderGradient2] = useState<string>('#2563EB');
  const [mobileHeaderGradient3, setMobileHeaderGradient3] = useState<string>('#1D4ED8');
  const [mobileHeaderGradient4, setMobileHeaderGradient4] = useState<string>('#1E40AF');
  const [mobileHeaderFontColor, setMobileHeaderFontColor] = useState<string>('#FFFFFF');
  const [mobileHeaderBackgroundType, setMobileHeaderBackgroundType] = useState<MobileHeaderBackgroundType>('gradient');
  const [mobileLoginLogoDataUrl, setMobileLoginLogoDataUrl] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [isAzureAdConfigured, setIsAzureAdConfigured] = useState<boolean>(false);
  const [basicAuthEnabled, setBasicAuthEnabled] = useState<boolean>(true);

  return {
    appLogoUrl,
    basicAuthEnabled,
    contextualLogos,
    currentAppName,
    isAzureAdConfigured,
    isClient,
    isThemeDark,
    loginLayoutType,
    loginPageLogoSize,
    loginPageStyle,
    mobileHeaderBackgroundType,
    mobileHeaderFontColor,
    mobileHeaderGradient1,
    mobileHeaderGradient2,
    mobileHeaderGradient3,
    mobileHeaderGradient4,
    mobileLoginLogoDataUrl,
    organizationName,
    setAppLogoUrl,
    setBasicAuthEnabled,
    setContextualLogos,
    setCurrentAppName,
    setIsAzureAdConfigured,
    setIsClient,
    setIsThemeDark,
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
    showLogoOnly,
  };
}

export type SignInPageSettingsStateValues = ReturnType<typeof useSignInPageSettingsStateValues>;
