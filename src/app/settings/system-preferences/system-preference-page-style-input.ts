import type { UseSystemPreferenceStyleEffectsOptions } from "./use-system-preference-style-effects";
import type { SystemPreferencePageState } from "./system-preference-page-state-type";

export function buildSystemPreferenceStyleEffectsInput(
  state: SystemPreferencePageState,
): UseSystemPreferenceStyleEffectsOptions {
  return {
    isMountedRef: state.isMountedRef,
    sidebarColors: state.sidebarColors,
    sidebarBackgroundType: state.sidebarBackgroundType,
    savedSidebarImageUrl: state.savedSidebarImageUrl,
    sidebarImageFit: state.sidebarImageFit,
    sidebarImagePosition: state.sidebarImagePosition,
    sidebarBackgroundBlurPercent: state.sidebarBackgroundBlurPercent,
    sidebarBackgroundTranslucencyPercent: state.sidebarBackgroundTranslucencyPercent,
    headerBackgroundType: state.headerBackgroundType,
    headerBackgroundColor: state.headerBackgroundColor,
    headerBackgroundGradient: state.headerBackgroundGradient,
    headerImagePreviewUrl: state.headerImagePreviewUrl,
    headerTextColor: state.headerTextColor,
  };
}
