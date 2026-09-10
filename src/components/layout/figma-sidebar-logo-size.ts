const FIGMA_SIDEBAR_SMALL_LOGO_SIZE = 20;
const FIGMA_SIDEBAR_MEDIUM_LOGO_SIZE = 24;
const FIGMA_SIDEBAR_LARGE_LOGO_SIZE = 32;

export function getFigmaSidebarLogoDisplaySize(configuredSize: number) {
  if (configuredSize <= 32) {
    return FIGMA_SIDEBAR_SMALL_LOGO_SIZE;
  }

  if (configuredSize <= 48) {
    return FIGMA_SIDEBAR_MEDIUM_LOGO_SIZE;
  }

  return FIGMA_SIDEBAR_LARGE_LOGO_SIZE;
}
