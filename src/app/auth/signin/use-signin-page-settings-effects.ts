"use client";

import { useEffect } from "react";

import { setThemeAndColors } from '@/lib/themeUtils';
import type { SystemSetting } from '@/lib/types';
import {
  loadSignInAuthConfigState,
  loadSignInPageSettings,
  type LoadedSignInPageSettings,
} from './signin-page-settings-api';
import {
  applyFetchedSignInSettings,
} from './signin-page-settings-state';
import {
  applyInitialSettings,
} from './signin-page-settings-style';
import type { SignInPageSettingsStateValues } from './use-signin-page-settings-state-values';

interface UseSignInPageSettingsEffectsInput {
  initialSettings?: SystemSetting[];
  isMobile: boolean;
  isSignoutRedirect: boolean;
  onSignoutParamCleaned: () => void;
  state: SignInPageSettingsStateValues;
}

export function useSignInPageSettingsEffects({
  initialSettings,
  isMobile,
  isSignoutRedirect,
  onSignoutParamCleaned,
  state,
}: UseSignInPageSettingsEffectsInput) {
  useEffect(() => {
    state.setIsClient(true);

    if (isSignoutRedirect && typeof window !== 'undefined') {
      onSignoutParamCleaned();
    }

    const updateThemeStatus = () => {
      state.setIsThemeDark(document.documentElement.classList.contains('dark'));
    };
    updateThemeStatus();

    const observer = new MutationObserver(updateThemeStatus);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    if (!initialSettings) {
      const fetchAppAndLoginConfig = async () => {
        const loadedSettings: LoadedSignInPageSettings = await loadSignInPageSettings({
          isMobile,
          isThemeDark: state.isThemeDark,
          onError: (error) => {
            console.warn("Failed to fetch system settings for login page, using defaults/localStorage.", error);
          },
          storage: typeof localStorage === 'undefined' ? undefined : localStorage,
        });

        if (loadedSettings.pageSettings) {
          const { pageSettings } = loadedSettings;
          applyFetchedSignInSettings({
            pageSettings,
            setAppLogoUrl: state.setAppLogoUrl,
            setContextualLogos: state.setContextualLogos,
            setCurrentAppName: state.setCurrentAppName,
            setLoginLayoutType: state.setLoginLayoutType,
            setLoginPageLogoSize: state.setLoginPageLogoSize,
            setLoginPageStyle: state.setLoginPageStyle,
            setMobileHeaderBackgroundType: state.setMobileHeaderBackgroundType,
            setMobileHeaderFontColor: state.setMobileHeaderFontColor,
            setMobileHeaderGradient1: state.setMobileHeaderGradient1,
            setMobileHeaderGradient2: state.setMobileHeaderGradient2,
            setMobileHeaderGradient3: state.setMobileHeaderGradient3,
            setMobileHeaderGradient4: state.setMobileHeaderGradient4,
            setMobileLoginLogoDataUrl: state.setMobileLoginLogoDataUrl,
            setOrganizationName: state.setOrganizationName,
            setShowLogoOnly: state.setShowLogoOnly,
          });

          if (typeof document !== 'undefined') {
            setThemeAndColors({
              themePreference: pageSettings.themePreference,
              primaryGradient: pageSettings.primaryGradient,
              primaryGradientStart: pageSettings.primaryGradientStart,
              primaryGradientEnd: pageSettings.primaryGradientEnd,
            });
          }
        }

        if (
          loadedSettings.logoUrl !== state.appLogoUrl ||
          loadedSettings.appName !== state.currentAppName
        ) {
          state.setCurrentAppName(loadedSettings.appName);
          state.setAppLogoUrl(loadedSettings.logoUrl);
        }
      };
      fetchAppAndLoginConfig();

      const handleAppConfigChange = () => {
        fetchAppAndLoginConfig();
      };
      window.addEventListener('appConfigChanged', handleAppConfigChange);

      return () => {
        observer.disconnect();
        window.removeEventListener('appConfigChanged', handleAppConfigChange);
      };
    }

    applyInitialSettings({
      initialSettings,
      isMobile,
      isThemeDark: state.isThemeDark,
      setLoginPageStyle: state.setLoginPageStyle,
      setOrganizationName: state.setOrganizationName,
      setLoginPageLogoSize: state.setLoginPageLogoSize,
      setMobileHeaderGradient1: state.setMobileHeaderGradient1,
      setMobileHeaderGradient2: state.setMobileHeaderGradient2,
      setMobileHeaderGradient3: state.setMobileHeaderGradient3,
      setMobileHeaderGradient4: state.setMobileHeaderGradient4,
      setMobileHeaderFontColor: state.setMobileHeaderFontColor,
      setMobileHeaderBackgroundType: state.setMobileHeaderBackgroundType,
      setMobileLoginLogoDataUrl: state.setMobileLoginLogoDataUrl,
    });

    return () => {
      observer.disconnect();
    };
  }, [initialSettings, isMobile, isSignoutRedirect, onSignoutParamCleaned, state.isThemeDark]);

  useEffect(() => {
    if (typeof document !== 'undefined' && state.currentAppName) {
      document.title = state.currentAppName;
    }
  }, [state.currentAppName]);

  useEffect(() => {
    async function fetchAzureAdConfig() {
      const authConfigState = await loadSignInAuthConfigState();
      state.setIsAzureAdConfigured(authConfigState.isAzureAdConfigured);
      state.setBasicAuthEnabled(authConfigState.basicAuthEnabled);
    }
    fetchAzureAdConfig();
  }, []);
}
