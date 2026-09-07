/**
 * Set Theme and Colors
 * Main function for applying theme settings
 */

import { parseGradientToHsl } from './colors';
import { applySidebarBackgroundToCSS } from './sidebar-background-css';
import { applySidebarStylesWithTheme, getCurrentSidebarColors } from './sidebar-styles';

const LEGACY_PRIMARY_GRADIENT_START = '179 67% 66%';
const LEGACY_PRIMARY_GRADIENT_END = '238 74% 61%';
const DEFAULT_DARK_BLUE_PRIMARY_START = '220 78% 28%';
const DEFAULT_DARK_BLUE_PRIMARY_END = '222 72% 36%';

function normalizePrimaryDefault(value: string | undefined, legacyValue: string, nextValue: string) {
  return value === legacyValue ? nextValue : value;
}

/**
 * Keep the document root as the single source of truth for resolved theme.
 * Setting color-scheme at the same time prevents native controls and portalled
 * UI from retaining the previous dark appearance after switching to light.
 */
function applyResolvedTheme(root: HTMLElement, shouldBeDark: boolean) {
  root.classList.toggle('dark', shouldBeDark);
  root.style.colorScheme = shouldBeDark ? 'dark' : 'light';
  root.dataset.resolvedTheme = shouldBeDark ? 'dark' : 'light';
}

/**
 * Set theme and apply colors
 */
export function setThemeAndColors({
  themePreference,
  primaryGradient,
  primaryGradientStart,
  primaryGradientEnd,
  sidebarColors = {},
  primaryButtonShadows = {},
}: {
  themePreference: 'light' | 'dark' | 'system',
  primaryGradient?: string | null,
  primaryGradientStart?: string,
  primaryGradientEnd?: string,
  sidebarColors?: Record<string, string>,
  primaryButtonShadows?: {
    primaryButtonShadowL?: string | null;
    primaryButtonShadowHoverL?: string | null;
    primaryButtonShadowD?: string | null;
    primaryButtonShadowHoverD?: string | null;
  },
}) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;

  // Determine if theme should be dark
  let shouldBeDark = false;
  if (themePreference === 'dark') {
    shouldBeDark = true;
  } else if (themePreference === 'light') {
    shouldBeDark = false;
  } else if (themePreference === 'system') {
    shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  applyResolvedTheme(root, shouldBeDark);

  // Extract start/end from primary gradient for CSS variables
  let gradientStart = primaryGradientStart;
  let gradientEnd = primaryGradientEnd;
  let shouldApplyPrimaryGradient = Boolean(primaryGradient);
  
  if (primaryGradient) {
    const parsed = parseGradientToHsl(primaryGradient);
    if (parsed) {
      gradientStart = parsed.start;
      gradientEnd = parsed.end;
      shouldApplyPrimaryGradient = !(
        parsed.start === LEGACY_PRIMARY_GRADIENT_START &&
        parsed.end === LEGACY_PRIMARY_GRADIENT_END
      );
    }
  }

  gradientStart = normalizePrimaryDefault(
    gradientStart,
    LEGACY_PRIMARY_GRADIENT_START,
    DEFAULT_DARK_BLUE_PRIMARY_START
  );
  gradientEnd = normalizePrimaryDefault(
    gradientEnd,
    LEGACY_PRIMARY_GRADIENT_END,
    DEFAULT_DARK_BLUE_PRIMARY_END
  );
  
  // Set primary color CSS variables
  if (gradientStart) {
    root.style.setProperty('--primary-gradient-start-l', gradientStart);
    root.style.setProperty('--primary-gradient-start-d', gradientStart);
    root.style.setProperty('--primary', gradientStart);
    
    // Also set sidebar active colors to match primary button colors
    root.style.setProperty('--sidebar-active-bg-start-l', gradientStart);
    root.style.setProperty('--sidebar-active-bg-start-d', gradientStart);
  }
  if (gradientEnd) {
    root.style.setProperty('--primary-gradient-end-l', gradientEnd);
    root.style.setProperty('--primary-gradient-end-d', gradientEnd);
    
    // Also set sidebar active colors to match primary button colors
    root.style.setProperty('--sidebar-active-bg-end-l', gradientEnd);
    root.style.setProperty('--sidebar-active-bg-end-d', gradientEnd);
  }
  
  // Store full gradient string for direct use in inline styles
  if (primaryGradient && shouldApplyPrimaryGradient) {
    root.style.setProperty('--primary-gradient', primaryGradient);
  } else if (!shouldApplyPrimaryGradient) {
    root.style.removeProperty('--primary-gradient');
  }

  // Apply button text colors if provided in sidebarColors
  if (sidebarColors.buttonTextColorL) {
    root.style.setProperty('--button-text-color-l', `hsl(${sidebarColors.buttonTextColorL})`);
  }
  if (sidebarColors.buttonTextColorD) {
    root.style.setProperty('--button-text-color-d', `hsl(${sidebarColors.buttonTextColorD})`);
  }

  // Apply primary button shadows if provided
  if (primaryButtonShadows.primaryButtonShadowL) {
    root.style.setProperty('--primary-button-shadow-l', primaryButtonShadows.primaryButtonShadowL);
  }
  if (primaryButtonShadows.primaryButtonShadowHoverL) {
    root.style.setProperty('--primary-button-shadow-hover-l', primaryButtonShadows.primaryButtonShadowHoverL);
  }
  if (primaryButtonShadows.primaryButtonShadowD) {
    root.style.setProperty('--primary-button-shadow-d', primaryButtonShadows.primaryButtonShadowD);
  }
  if (primaryButtonShadows.primaryButtonShadowHoverD) {
    root.style.setProperty('--primary-button-shadow-hover-d', primaryButtonShadows.primaryButtonShadowHoverD);
  }

  // Theme-only controls (for example the header menu) do not pass the full
  // sidebar palette. Reuse the palette loaded during app initialization so the
  // newly selected light/dark variant is actually applied.
  const effectiveSidebarColors = Object.keys(sidebarColors).length > 0
    ? sidebarColors
    : getCurrentSidebarColors();

  // Apply sidebar styles with explicit theme information
  requestAnimationFrame(() => {
    applySidebarStylesWithTheme(effectiveSidebarColors, shouldBeDark);
    applySidebarBackgroundToCSS();
  });
}
