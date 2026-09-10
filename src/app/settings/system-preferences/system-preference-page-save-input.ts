import type { SystemPreferenceSaveActionInput } from "./use-system-preference-save-action";
import type { SystemPreferencePageState } from "./system-preference-page-state-type";

export function buildSystemPreferenceSaveActionInput({
  showError,
  state,
  success,
}: {
  showError: (message: string) => void;
  state: SystemPreferencePageState;
  success: (message: string) => void;
}): SystemPreferenceSaveActionInput {
  return {
    success,
    showError,
    themePreference: state.themePreference,
    appName: state.appName,
    generativeAICanvasMode: state.generativeAICanvasMode,
    defaultLanguage: state.defaultLanguage,
    drawerStyle: state.drawerStyle,
    sidebarColors: state.sidebarColors,
    loginBackgroundType: state.loginBackgroundType,
    loginBackgroundColor: state.loginBackgroundColor,
    loginLayoutType: state.loginLayoutType,
    loginPageLogoSize: state.loginPageLogoSize,
    loginBackgroundGradient: state.loginBackgroundGradient,
    loginBackgroundTypeMobile: state.loginBackgroundTypeMobile,
    loginBackgroundColorMobile: state.loginBackgroundColorMobile,
    loginBackgroundGradientMobile: state.loginBackgroundGradientMobile,
    evaluateHeaderBackgroundType: state.evaluateHeaderBackgroundType,
    evaluateHeaderBackgroundColor: state.evaluateHeaderBackgroundColor,
    evaluateHeaderTextColor: state.evaluateHeaderTextColor,
    evaluateHeaderBackgroundGradient: state.evaluateHeaderBackgroundGradient,
    sidebarBackgroundType: state.sidebarBackgroundType,
    sidebarImageFit: state.sidebarImageFit,
    sidebarImagePosition: state.sidebarImagePosition,
    sidebarBackgroundBlurPercent: state.sidebarBackgroundBlurPercent,
    sidebarBackgroundTranslucencyPercent: state.sidebarBackgroundTranslucencyPercent,
    sidebarNavigationMode: state.sidebarNavigationMode,
    sidebarSecondaryGroupLabels: state.sidebarSecondaryGroupLabels,
    headerBackgroundType: state.headerBackgroundType,
    headerBackgroundColor: state.headerBackgroundColor,
    headerBackgroundGradient: state.headerBackgroundGradient,
    headerTextColor: state.headerTextColor,
    splashBackgroundColor: state.splashBackgroundColor,
    splashAnimationType: state.splashAnimationType,
    selectedLoginImageFile: state.selectedLoginImageFile,
    selectedLoginImageFileMobile: state.selectedLoginImageFileMobile,
    selectedEvaluateHeaderImageFile: state.selectedEvaluateHeaderImageFile,
    selectedSidebarImageFile: state.selectedSidebarImageFile,
    selectedSplashLogoFile: state.selectedSplashLogoFile,
    savedLogoUrl: state.savedLogoUrl,
    savedLoginPageLogoLightModeUrl: state.savedLoginPageLogoLightModeUrl,
    savedLoginPageLogoDarkModeUrl: state.savedLoginPageLogoDarkModeUrl,
    savedSidebarLogoCollapsedLightModeUrl:
      state.savedSidebarLogoCollapsedLightModeUrl,
    savedSidebarLogoExpandedLightModeUrl:
      state.savedSidebarLogoExpandedLightModeUrl,
    savedSidebarLogoCollapsedDarkModeUrl:
      state.savedSidebarLogoCollapsedDarkModeUrl,
    savedSidebarLogoExpandedDarkModeUrl:
      state.savedSidebarLogoExpandedDarkModeUrl,
    savedSplashLogoDataUrl: state.savedSplashLogoDataUrl,
    setSavedLogoUrl: state.setSavedLogoUrl,
    setSavedLoginImageDataUrl: state.setSavedLoginImageDataUrl,
    setSavedLoginImageDataUrlMobile: state.setSavedLoginImageDataUrlMobile,
    setSavedSplashLogoDataUrl: state.setSavedSplashLogoDataUrl,
    setSaving: state.setSaving,
  };
}
