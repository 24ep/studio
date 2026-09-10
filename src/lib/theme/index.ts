/**
 * Theme Utilities Module
 * 
 * This module provides utilities for managing theme colors, sidebar styling,
 * and visual preferences. It includes:
 * 
 * - Color utilities (HSL conversion, gradient parsing)
 * - Theme setting (light/dark mode)
 * - Sidebar color styling
 * - Sidebar active style management
 * - Sidebar background image management
 * 
 * @module theme
 */

// Re-export color utilities
export { parseGradientToHsl, hexToHsl, isFullGradientString } from './colors';

// Re-export CSS variable mapping
export { cssVarMapping, primaryButtonShadowMapping } from './css-var-mapping';

// Re-export main theme setting function
export { setThemeAndColors } from './set-theme';

// Re-export sidebar styles
export {
  applySidebarStylesWithTheme,
  getCurrentSidebarColors,
  applySidebarStyles,
  waitForSidebar,
  reapplyCurrentSidebarColors,
} from './sidebar-styles';

// Re-export sidebar active style
export {
  type SidebarActiveStyle,
  getSidebarActiveStyle,
  setSidebarActiveStyle,
  applySidebarActiveStyle,
  initializeSidebarStyle,
  setupSidebarStyleListener,
  initializeSidebarStyles,
} from './sidebar-active';

// Re-export sidebar background
export {
  applySidebarBackgroundSettings,
  applySidebarBackgroundToCSS,
  initializeSidebarBackground,
  cleanupSidebarBackground,
} from './sidebar-background';

// Re-export header branding
export {
  applyHeaderBrandingSettings,
  applyHeaderBrandingToCSS,
  initializeHeaderBranding,
} from './header-branding';
