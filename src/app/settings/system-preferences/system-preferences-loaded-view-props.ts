import type { SystemPreferencesPageViewProps } from "./SystemPreferencesPageView";
import {
  buildSystemPreferencesAppearanceProps,
  buildSystemPreferencesGeneralProps,
  buildSystemPreferencesHeaderProps,
  buildSystemPreferencesNavigationProps,
} from "./system-preferences-loaded-view-basic-props";
import { buildSystemPreferencesBrandingProps } from "./system-preferences-loaded-view-branding-props";
import {
  buildSystemPreferencesEvaluateProps,
  buildSystemPreferencesSidebarProps,
} from "./system-preferences-loaded-view-sidebar-evaluate-props";
import type { SystemPreferencesLoadedViewBuilderOptions } from "./system-preferences-loaded-view-types";

export function buildSystemPreferencesPageViewProps(
  options: SystemPreferencesLoadedViewBuilderOptions,
): Omit<SystemPreferencesPageViewProps, "isEmbedded"> {
  return {
    headerProps: buildSystemPreferencesHeaderProps(options),
    navigationProps: buildSystemPreferencesNavigationProps(options),
    tabPanelProps: {
      activeTab: options.state.activeTab,
      generalProps: buildSystemPreferencesGeneralProps(options),
      appearanceProps: buildSystemPreferencesAppearanceProps(options),
      brandingProps: buildSystemPreferencesBrandingProps(options),
      sidebarProps: buildSystemPreferencesSidebarProps(options),
      evaluateProps: buildSystemPreferencesEvaluateProps(options),
    },
  };
}
