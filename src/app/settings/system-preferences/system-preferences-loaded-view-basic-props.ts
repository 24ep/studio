import type { SystemPreferencesLoadedViewBuilderOptions } from "./system-preferences-loaded-view-types";

export function buildSystemPreferencesHeaderProps({
  canEdit,
  onSave,
  state,
}: SystemPreferencesLoadedViewBuilderOptions) {
  return {
    showLogoOnly: state.showLogoOnly,
    saving: state.saving,
    saveConfirmed: state.saveConfirmed,
    canEdit,
    onSave,
  };
}

export function buildSystemPreferencesNavigationProps({
  state,
}: SystemPreferencesLoadedViewBuilderOptions) {
  return {
    activeTab: state.activeTab,
    onTabChange: state.setActiveTab,
  };
}

export function buildSystemPreferencesGeneralProps({
  canEdit,
  state,
}: SystemPreferencesLoadedViewBuilderOptions) {
  return {
    canEdit,
    appName: state.appName,
    setAppName: state.setAppName,
    themePreference: state.themePreference,
    setThemePreference: state.setThemePreference,
    generativeAICanvasMode: state.generativeAICanvasMode,
    setGenerativeAICanvasMode: state.setGenerativeAICanvasMode,
    defaultLanguage: state.defaultLanguage,
    setDefaultLanguage: state.setDefaultLanguage,
  };
}

export function buildSystemPreferencesAppearanceProps({
  canEdit,
  imageActions,
  state,
}: SystemPreferencesLoadedViewBuilderOptions) {
  return {
    canEdit,
    loginBackgroundType: state.loginBackgroundType,
    setLoginBackgroundType: state.setLoginBackgroundType,
    loginImagePreviewUrl: state.loginImagePreviewUrl,
    removeSelectedLoginImage: imageActions.removeSelectedLoginImage,
    handleLoginImageFileChange: imageActions.handleLoginImageFileChange,
    loginBackgroundGradient: state.loginBackgroundGradient,
    setLoginBackgroundGradient: state.setLoginBackgroundGradient,
    loginBackgroundColor: state.loginBackgroundColor,
    setLoginBackgroundColor: state.setLoginBackgroundColor,
    loginBackgroundTypeMobile: state.loginBackgroundTypeMobile,
    setLoginBackgroundTypeMobile: state.setLoginBackgroundTypeMobile,
    loginImagePreviewUrlMobile: state.loginImagePreviewUrlMobile,
    removeSelectedLoginImageMobile: imageActions.removeSelectedLoginImageMobile,
    handleLoginImageFileChangeMobile: imageActions.handleLoginImageFileChangeMobile,
    loginBackgroundGradientMobile: state.loginBackgroundGradientMobile,
    setLoginBackgroundGradientMobile: state.setLoginBackgroundGradientMobile,
    loginBackgroundColorMobile: state.loginBackgroundColorMobile,
    setLoginBackgroundColorMobile: state.setLoginBackgroundColorMobile,
    loginLayoutType: state.loginLayoutType,
    setLoginLayoutType: state.setLoginLayoutType,
    drawerStyle: state.drawerStyle,
    setDrawerStyle: state.setDrawerStyle,
  };
}
