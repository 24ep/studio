import type { UseSystemPreferenceImageActionsInput } from "./use-system-preference-image-action-types";
import type { SystemPreferencePageState } from "./system-preference-page-state-type";

export function buildSystemPreferenceImageActionsInput({
  showError,
  state,
}: {
  showError: (message: string) => void;
  state: SystemPreferencePageState;
}): UseSystemPreferenceImageActionsInput {
  return {
    showError,
    logoPreviewUrl: state.logoPreviewUrl,
    savedLogoUrl: state.savedLogoUrl,
    loginImagePreviewUrl: state.loginImagePreviewUrl,
    savedLoginImageDataUrl: state.savedLoginImageDataUrl,
    loginImagePreviewUrlMobile: state.loginImagePreviewUrlMobile,
    savedLoginImageDataUrlMobile: state.savedLoginImageDataUrlMobile,
    evaluateHeaderImagePreviewUrl: state.evaluateHeaderImagePreviewUrl,
    savedEvaluateHeaderImageDataUrl: state.savedEvaluateHeaderImageDataUrl,
    headerImagePreviewUrl: state.headerImagePreviewUrl,
    savedHeaderImageDataUrl: state.savedHeaderImageDataUrl,
    sidebarImagePreviewUrl: state.sidebarImagePreviewUrl,
    savedSidebarImageUrl: state.savedSidebarImageUrl,
    splashLogoPreviewUrl: state.splashLogoPreviewUrl,
    savedSplashLogoDataUrl: state.savedSplashLogoDataUrl,
    setSelectedLogoFile: state.setSelectedLogoFile,
    setLogoPreviewUrl: state.setLogoPreviewUrl,
    setSavedLogoUrl: state.setSavedLogoUrl,
    setLoginPageLogoLightModePreviewUrl:
      state.setLoginPageLogoLightModePreviewUrl,
    setSavedLoginPageLogoLightModeUrl:
      state.setSavedLoginPageLogoLightModeUrl,
    setLoginPageLogoDarkModePreviewUrl:
      state.setLoginPageLogoDarkModePreviewUrl,
    setSavedLoginPageLogoDarkModeUrl: state.setSavedLoginPageLogoDarkModeUrl,
    setSidebarLogoCollapsedLightModePreviewUrl:
      state.setSidebarLogoCollapsedLightModePreviewUrl,
    setSavedSidebarLogoCollapsedLightModeUrl:
      state.setSavedSidebarLogoCollapsedLightModeUrl,
    setSidebarLogoExpandedLightModePreviewUrl:
      state.setSidebarLogoExpandedLightModePreviewUrl,
    setSavedSidebarLogoExpandedLightModeUrl:
      state.setSavedSidebarLogoExpandedLightModeUrl,
    setSidebarLogoCollapsedDarkModePreviewUrl:
      state.setSidebarLogoCollapsedDarkModePreviewUrl,
    setSavedSidebarLogoCollapsedDarkModeUrl:
      state.setSavedSidebarLogoCollapsedDarkModeUrl,
    setSidebarLogoExpandedDarkModePreviewUrl:
      state.setSidebarLogoExpandedDarkModePreviewUrl,
    setSavedSidebarLogoExpandedDarkModeUrl:
      state.setSavedSidebarLogoExpandedDarkModeUrl,
    setSelectedLoginImageFile: state.setSelectedLoginImageFile,
    setLoginImagePreviewUrl: state.setLoginImagePreviewUrl,
    setSavedLoginImageDataUrl: state.setSavedLoginImageDataUrl,
    setSelectedLoginImageFileMobile: state.setSelectedLoginImageFileMobile,
    setLoginImagePreviewUrlMobile: state.setLoginImagePreviewUrlMobile,
    setSavedLoginImageDataUrlMobile: state.setSavedLoginImageDataUrlMobile,
    setSelectedEvaluateHeaderImageFile: state.setSelectedEvaluateHeaderImageFile,
    setEvaluateHeaderImagePreviewUrl: state.setEvaluateHeaderImagePreviewUrl,
    setSavedEvaluateHeaderImageDataUrl:
      state.setSavedEvaluateHeaderImageDataUrl,
    setSelectedHeaderImageFile: state.setSelectedHeaderImageFile,
    setHeaderImagePreviewUrl: state.setHeaderImagePreviewUrl,
    setSavedHeaderImageDataUrl: state.setSavedHeaderImageDataUrl,
    setSelectedSidebarImageFile: state.setSelectedSidebarImageFile,
    setSidebarImagePreviewUrl: state.setSidebarImagePreviewUrl,
    setSavedSidebarImageUrl: state.setSavedSidebarImageUrl,
    setSelectedSplashLogoFile: state.setSelectedSplashLogoFile,
    setSplashLogoPreviewUrl: state.setSplashLogoPreviewUrl,
    setSavedSplashLogoDataUrl: state.setSavedSplashLogoDataUrl,
  };
}
