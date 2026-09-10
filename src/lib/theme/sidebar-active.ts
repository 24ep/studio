/**
 * Sidebar Active Style
 * Functions for managing sidebar active item styling
 */

import { reapplyCurrentSidebarColors } from './sidebar-styles';
import { applySidebarBackgroundToCSS } from './sidebar-background';

export type SidebarActiveStyle = "gradient" | "solid" | "outline" | "subtle" | "border" | "glow" | "glass";

const SIDEBAR_ACTIVE_STYLE_KEY = 'sidebarActiveStylePreference';

type SidebarConfigChangeDetail = {
  sidebarActiveStyle?: SidebarActiveStyle;
};

function isSidebarActiveStyle(value: unknown): value is SidebarActiveStyle {
  return (
    value === 'gradient' ||
    value === 'solid' ||
    value === 'outline' ||
    value === 'subtle' ||
    value === 'border' ||
    value === 'glow' ||
    value === 'glass'
  );
}

/**
 * Get current sidebar active style
 */
export function getSidebarActiveStyle(): SidebarActiveStyle {
  if (typeof window === 'undefined') return 'gradient';
  return (localStorage.getItem(SIDEBAR_ACTIVE_STYLE_KEY) as SidebarActiveStyle) || 'gradient';
}

/**
 * Set sidebar active style
 */
export function setSidebarActiveStyle(style: SidebarActiveStyle) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SIDEBAR_ACTIVE_STYLE_KEY, style);
  applySidebarActiveStyle(style);
}

/**
 * Apply sidebar active style
 */
export function applySidebarActiveStyle(style: SidebarActiveStyle) {
  if (typeof window === 'undefined') return;

  // Remove existing style classes
  document.documentElement.classList.remove(
    'sidebar-active-gradient',
    'sidebar-active-solid',
    'sidebar-active-outline',
    'sidebar-active-subtle',
    'sidebar-active-border',
    'sidebar-active-glow',
    'sidebar-active-glass'
  );

  // Add new style class
  document.documentElement.classList.add(`sidebar-active-${style}`);
}

/**
 * Initialize sidebar style on load
 */
export function initializeSidebarStyle() {
  if (typeof window === 'undefined') return;
  const style = getSidebarActiveStyle();
  applySidebarActiveStyle(style);

  // Also ensure sidebar colors are applied
  reapplyCurrentSidebarColors();
}

/**
 * Listen for preference changes
 */
export function setupSidebarStyleListener() {
  if (typeof window === 'undefined') return;

  window.addEventListener('appConfigChanged', (event: Event) => {
    const detail = event instanceof CustomEvent
      ? event.detail as SidebarConfigChangeDetail
      : undefined;

    if (isSidebarActiveStyle(detail?.sidebarActiveStyle)) {
      applySidebarActiveStyle(detail.sidebarActiveStyle);
    }
    // Also reapply colors when config changes
    reapplyCurrentSidebarColors();
    // Reapply background settings when config changes
    applySidebarBackgroundToCSS();
  });
}

/**
 * Comprehensive initialization function
 */
export function initializeSidebarStyles() {
  if (typeof window === 'undefined') return;

  // Initialize active style
  initializeSidebarStyle();

  // Setup listeners
  setupSidebarStyleListener();

  // Initialize sidebar background (imported dynamically to avoid circular dependency)
  import('./sidebar-background').then(({ initializeSidebarBackground }) => {
    initializeSidebarBackground();
  });

  // Force a re-application of colors
  setTimeout(() => {
    reapplyCurrentSidebarColors();
  }, 50);
}
