import { convertMinIOUrlToSecureUrl } from "../../lib/imageUtils";

import type { SidebarHeaderContentProps } from "./sidebar-header-content-types";

type ContextualLogos = NonNullable<SidebarHeaderContentProps["contextualLogos"]>;

export function selectSidebarLogoUrl({
  appLogoUrl,
  contextualLogos,
  isCollapsed,
  isDarkMode,
}: {
  appLogoUrl: string | null;
  contextualLogos: ContextualLogos;
  isCollapsed: boolean;
  isDarkMode: boolean;
}): string | null {
  const contextualLogo = isCollapsed
    ? getCollapsedContextualLogo(contextualLogos, isDarkMode)
    : getExpandedContextualLogo(contextualLogos, isDarkMode);

  return convertMinIOUrlToSecureUrl(contextualLogo || appLogoUrl, false);
}

export function getEffectiveSidebarLogoSize({
  isCollapsed,
  sidebarLogoSize,
  collapsedSidebarLogoSize,
}: {
  isCollapsed: boolean;
  sidebarLogoSize: number;
  collapsedSidebarLogoSize: number;
}): number {
  return isCollapsed ? Math.min(collapsedSidebarLogoSize, 64) : sidebarLogoSize;
}

function getCollapsedContextualLogo(contextualLogos: ContextualLogos, isDarkMode: boolean): string | null {
  if (isDarkMode && contextualLogos.sidebarLogoCollapsedDarkMode) {
    return contextualLogos.sidebarLogoCollapsedDarkMode;
  }

  if (!isDarkMode && contextualLogos.sidebarLogoCollapsedLightMode) {
    return contextualLogos.sidebarLogoCollapsedLightMode;
  }

  return null;
}

function getExpandedContextualLogo(contextualLogos: ContextualLogos, isDarkMode: boolean): string | null {
  if (isDarkMode && contextualLogos.sidebarLogoExpandedDarkMode) {
    return contextualLogos.sidebarLogoExpandedDarkMode;
  }

  if (!isDarkMode && contextualLogos.sidebarLogoExpandedLightMode) {
    return contextualLogos.sidebarLogoExpandedLightMode;
  }

  return null;
}
