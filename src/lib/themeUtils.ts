/**
 * Theme Utilities
 * 
 * This file re-exports all functions from the theme module for backward compatibility.
 * New code should import directly from '@/lib/theme' instead.
 * 
 * @deprecated Import from '@/lib/theme' instead
 * @module themeUtils
 */

// Re-export everything from the theme module
export {
  // Color utilities
  parseGradientToHsl,
  hexToHsl,
  isFullGradientString,
  
  // CSS variable mapping
  cssVarMapping,
  primaryButtonShadowMapping,
  
  // Main theme setting function
  setThemeAndColors,
  
  // Sidebar styles
  applySidebarStylesWithTheme,
  getCurrentSidebarColors,
  applySidebarStyles,
  waitForSidebar,
  reapplyCurrentSidebarColors,
  
  // Sidebar active style
  type SidebarActiveStyle,
  getSidebarActiveStyle,
  setSidebarActiveStyle,
  applySidebarActiveStyle,
  initializeSidebarStyle,
  setupSidebarStyleListener,
  initializeSidebarStyles,
  
  // Sidebar background
  applySidebarBackgroundSettings,
  applySidebarBackgroundToCSS,
  initializeSidebarBackground,
  cleanupSidebarBackground,
  
  // Header branding
  applyHeaderBrandingSettings,
  applyHeaderBrandingToCSS,
  initializeHeaderBranding,
} from './theme';
