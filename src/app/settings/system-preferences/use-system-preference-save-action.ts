"use client";

import type { Dispatch, SetStateAction } from "react";

import { setThemeAndColors } from "@/lib/themeUtils";
import type {
  DrawerStyle,
  EvaluateHeaderBackgroundType,
  LoginBackgroundType,
  LoginPageLayoutType,
  SidebarBackgroundType,
  SidebarColors,
  SidebarImageFit,
  SidebarImagePosition,
  SidebarNavigationMode,
  ThemePreference,
  HeaderBackgroundType,
} from "@/components/settings/system-preferences/constants";
import {
  applySavedSystemPreferenceAssetUpdates,
  buildSystemPreferencesFormData,
  getSavedSystemPreferenceAssetUpdates,
} from "@/components/settings/system-preferences/utils";
import { saveSystemPreferences } from "./system-preferences-api";

export type ToastActions = {
  success: (message: string) => void;
  showError: (message: string) => void;
};

export type SystemPreferenceSaveActionInput = ToastActions & {
  themePreference: ThemePreference;
  appName: string;
  generativeAICanvasMode: boolean;
  defaultLanguage: string;
  drawerStyle: DrawerStyle;
  sidebarColors: SidebarColors;
  loginBackgroundType: LoginBackgroundType;
  loginBackgroundColor: string;
  loginLayoutType: LoginPageLayoutType;
  loginPageLogoSize: number;
  loginBackgroundGradient: string | null;
  loginBackgroundTypeMobile: LoginBackgroundType;
  loginBackgroundColorMobile: string;
  loginBackgroundGradientMobile: string | null;
  evaluateHeaderBackgroundType: EvaluateHeaderBackgroundType;
  evaluateHeaderBackgroundColor: string;
  evaluateHeaderTextColor: string;
  evaluateHeaderBackgroundGradient: string | null;
  sidebarBackgroundType: SidebarBackgroundType;
  sidebarImageFit: SidebarImageFit;
  sidebarImagePosition: SidebarImagePosition;
  sidebarBackgroundBlurPercent: number;
  sidebarBackgroundTranslucencyPercent: number;
  sidebarNavigationMode: SidebarNavigationMode;
  sidebarSecondaryGroupLabels: string[];
  headerBackgroundType: HeaderBackgroundType;
  headerBackgroundColor: string;
  headerBackgroundGradient: string | null;
  headerTextColor: string;
  splashBackgroundColor: string;
  splashAnimationType: string;
  selectedLoginImageFile: File | null;
  selectedLoginImageFileMobile: File | null;
  selectedEvaluateHeaderImageFile: File | null;
  selectedSidebarImageFile: File | null;
  selectedSplashLogoFile: File | null;
  savedLogoUrl: string | null;
  savedLoginPageLogoLightModeUrl: string | null;
  savedLoginPageLogoDarkModeUrl: string | null;
  savedSidebarLogoCollapsedLightModeUrl: string | null;
  savedSidebarLogoExpandedLightModeUrl: string | null;
  savedSidebarLogoCollapsedDarkModeUrl: string | null;
  savedSidebarLogoExpandedDarkModeUrl: string | null;
  savedSplashLogoDataUrl: string | null;
  setSavedLogoUrl: Dispatch<SetStateAction<string | null>>;
  setSavedLoginImageDataUrl: Dispatch<SetStateAction<string | null>>;
  setSavedLoginImageDataUrlMobile: Dispatch<SetStateAction<string | null>>;
  setSavedSplashLogoDataUrl: Dispatch<SetStateAction<string | null>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
};

export function useSystemPreferenceSaveAction({
  success,
  showError,
  themePreference,
  appName,
  generativeAICanvasMode,
  defaultLanguage,
  drawerStyle,
  sidebarColors,
  loginBackgroundType,
  loginBackgroundColor,
  loginLayoutType,
  loginPageLogoSize,
  loginBackgroundGradient,
  loginBackgroundTypeMobile,
  loginBackgroundColorMobile,
  loginBackgroundGradientMobile,
  evaluateHeaderBackgroundType,
  evaluateHeaderBackgroundColor,
  evaluateHeaderTextColor,
  evaluateHeaderBackgroundGradient,
  sidebarBackgroundType,
  sidebarImageFit,
  sidebarImagePosition,
  sidebarBackgroundBlurPercent,
  sidebarBackgroundTranslucencyPercent,
  sidebarNavigationMode,
  sidebarSecondaryGroupLabels,
  headerBackgroundType,
  headerBackgroundColor,
  headerBackgroundGradient,
  headerTextColor,
  splashBackgroundColor,
  splashAnimationType,
  selectedLoginImageFile,
  selectedLoginImageFileMobile,
  selectedEvaluateHeaderImageFile,
  selectedSidebarImageFile,
  selectedSplashLogoFile,
  savedLogoUrl,
  savedLoginPageLogoLightModeUrl,
  savedLoginPageLogoDarkModeUrl,
  savedSidebarLogoCollapsedLightModeUrl,
  savedSidebarLogoExpandedLightModeUrl,
  savedSidebarLogoCollapsedDarkModeUrl,
  savedSidebarLogoExpandedDarkModeUrl,
  savedSplashLogoDataUrl,
  setSavedLogoUrl,
  setSavedLoginImageDataUrl,
  setSavedLoginImageDataUrlMobile,
  setSavedSplashLogoDataUrl,
  setSaving,
}: SystemPreferenceSaveActionInput) {
  return async function handleSavePreferences() {
    setSaving(true);

      const { formData } = buildSystemPreferencesFormData({
        themePreference,
        appName,
        defaultLanguage,
        generativeAICanvasMode,
      drawerStyle,
      sidebarColors,
      loginBackgroundType,
      loginBackgroundColor,
      loginLayoutType,
      loginPageLogoSize,
      loginBackgroundGradient,
      loginBackgroundTypeMobile,
      loginBackgroundColorMobile,
      loginBackgroundGradientMobile,
      evaluateHeaderBackgroundType,
      evaluateHeaderBackgroundColor,
      evaluateHeaderTextColor,
      evaluateHeaderBackgroundGradient,
      sidebarBackgroundType,
      sidebarImageFit,
      sidebarImagePosition,
      sidebarBackgroundBlurPercent,
      sidebarBackgroundTranslucencyPercent,
      sidebarNavigationMode,
      sidebarSecondaryGroupLabels,
      headerBackgroundType,
      headerBackgroundColor,
      headerBackgroundGradient,
      headerTextColor,
      splashBackgroundColor,
      splashAnimationType,
      selectedLoginImageFile,
      selectedLoginImageFileMobile,
      selectedEvaluateHeaderImageFile,
      selectedSidebarImageFile,
      selectedSplashLogoFile,
      savedLogoUrl,
      savedLoginPageLogoLightModeUrl,
      savedLoginPageLogoDarkModeUrl,
      savedSidebarLogoCollapsedLightModeUrl,
      savedSidebarLogoExpandedLightModeUrl,
      savedSidebarLogoCollapsedDarkModeUrl,
      savedSidebarLogoExpandedDarkModeUrl,
      savedSplashLogoDataUrl,
    });

    try {
      const data = await saveSystemPreferences(formData);
      const savedAssetUpdates = getSavedSystemPreferenceAssetUpdates(data);

      applySavedSystemPreferenceAssetUpdates(savedAssetUpdates, {
        setSavedLogoUrl,
        setSavedLoginImageDataUrl,
        setSavedLoginImageDataUrlMobile,
        setSavedSplashLogoDataUrl,
      });

      success("Your system preferences have been updated successfully.");
      setThemeAndColors({
        themePreference,
        sidebarColors,
      });
      window.dispatchEvent(new CustomEvent("appConfigChanged", {
        detail: {
          sidebarNavigationMode,
          sidebarSecondaryGroupLabels,
          defaultLanguage,
        },
      }));
    } catch (e) {
      const error = e as Error;
      showError(`Error Saving Preferences: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
}
