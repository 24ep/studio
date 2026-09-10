import type { SystemPreferencesLoadedViewBuilderOptions } from "./system-preferences-loaded-view-types";

export function buildSystemPreferencesSidebarProps({
  canEdit,
  imageActions,
  state,
}: SystemPreferencesLoadedViewBuilderOptions) {
  return {
    canEdit,
    activeSidebarTab: state.activeSidebarTab,
    setActiveSidebarTab: state.setActiveSidebarTab,
    sidebarColors: state.sidebarColors,
    setSidebarColors: state.setSidebarColors,
    resetSidebarColors: state.resetSidebarColors,
    sidebarBackgroundType: state.sidebarBackgroundType,
    setSidebarBackgroundType: state.setSidebarBackgroundType,
    sidebarImagePreviewUrl: state.sidebarImagePreviewUrl,
    savedSidebarImageUrl: state.savedSidebarImageUrl,
    removeSelectedSidebarImage: imageActions.removeSelectedSidebarImage,
    handleSidebarImageFileChange: imageActions.handleSidebarImageFileChange,
    sidebarImageFit: state.sidebarImageFit,
    setSidebarImageFit: state.setSidebarImageFit,
    sidebarImagePosition: state.sidebarImagePosition,
    setSidebarImagePosition: state.setSidebarImagePosition,
    sidebarBackgroundBlurPercent: state.sidebarBackgroundBlurPercent,
    setSidebarBackgroundBlurPercent: state.setSidebarBackgroundBlurPercent,
    sidebarBackgroundTranslucencyPercent: state.sidebarBackgroundTranslucencyPercent,
    setSidebarBackgroundTranslucencyPercent: state.setSidebarBackgroundTranslucencyPercent,
  };
}

export function buildSystemPreferencesEvaluateProps({
  canEdit,
  imageActions,
  state,
}: SystemPreferencesLoadedViewBuilderOptions) {
  return {
    canEdit,
    evaluateHeaderBackgroundType: state.evaluateHeaderBackgroundType,
    setEvaluateHeaderBackgroundType: state.setEvaluateHeaderBackgroundType,
    evaluateHeaderImagePreviewUrl: state.evaluateHeaderImagePreviewUrl,
    savedEvaluateHeaderImageDataUrl: state.savedEvaluateHeaderImageDataUrl,
    removeSelectedEvaluateHeaderImage: imageActions.removeSelectedEvaluateHeaderImage,
    handleEvaluateHeaderImageFileChange: imageActions.handleEvaluateHeaderImageFileChange,
    evaluateHeaderBackgroundGradient: state.evaluateHeaderBackgroundGradient,
    setEvaluateHeaderBackgroundGradient: state.setEvaluateHeaderBackgroundGradient,
    evaluateHeaderBackgroundColor: state.evaluateHeaderBackgroundColor,
    setEvaluateHeaderBackgroundColor: state.setEvaluateHeaderBackgroundColor,
    evaluateHeaderTextColor: state.evaluateHeaderTextColor,
    setEvaluateHeaderTextColor: state.setEvaluateHeaderTextColor,
  };
}
