/**
 * Sidebar Styles
 * Functions for applying sidebar color and style settings
 */

import { cssVarMapping } from './css-var-mapping';
import { isFullGradientString } from './colors';

// Store current sidebar colors for re-application
let currentSidebarColors: Record<string, string> = {};

type SidebarThemeContext = {
  themeSuffix: 'L' | 'D';
  bgStartKey: string;
  activeBgStartKey: string;
  isFullGradient: boolean;
  isActiveFullGradient: boolean;
};

export function applySidebarStylesWithTheme(sidebarColors: Record<string, string>, isDark: boolean) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;

  currentSidebarColors = { ...sidebarColors };
  const themeContext = buildSidebarThemeContext(sidebarColors, isDark);

  applyFullGradientStyles(root, sidebarColors, themeContext);
  applySidebarCssVariables(root, sidebarColors, themeContext);
  applyButtonTextColors(root, sidebarColors);
}

function buildSidebarThemeContext(sidebarColors: Record<string, string>, isDark: boolean): SidebarThemeContext {
  const themeSuffix = isDark ? 'D' : 'L';
  const bgStartKey = `sidebarBgStart${themeSuffix}`;
  const activeBgStartKey = `sidebarActiveBgStart${themeSuffix}`;

  return {
    themeSuffix,
    bgStartKey,
    activeBgStartKey,
    isFullGradient: isFullGradientString(sidebarColors[bgStartKey]),
    isActiveFullGradient: isFullGradientString(sidebarColors[activeBgStartKey]),
  };
}

function applyFullGradientStyles(
  root: HTMLElement,
  sidebarColors: Record<string, string>,
  themeContext: SidebarThemeContext
) {
  const bgStartValue = sidebarColors[themeContext.bgStartKey];
  const activeBgStartValue = sidebarColors[themeContext.activeBgStartKey];

  if (themeContext.isFullGradient && bgStartValue) {
    root.style.setProperty('--sidebar-background-full-gradient', bgStartValue);
  } else {
    root.style.removeProperty('--sidebar-background-full-gradient');
  }

  if (themeContext.isActiveFullGradient && activeBgStartValue) {
    root.style.setProperty('--sidebar-active-bg-full-gradient', activeBgStartValue);
    root.style.setProperty(
      `--sidebar-active-background-${themeContext.themeSuffix.toLowerCase()}`,
      activeBgStartValue
    );
  } else {
    root.style.removeProperty('--sidebar-active-bg-full-gradient');
    root.style.removeProperty(`--sidebar-active-background-${themeContext.themeSuffix.toLowerCase()}`);
  }
}

function applySidebarCssVariables(
  root: HTMLElement,
  sidebarColors: Record<string, string>,
  themeContext: SidebarThemeContext
) {
  Object.entries(sidebarColors).forEach(([key, value]) => {
    if (!shouldApplySidebarColorKey(key, value, themeContext)) {
      return;
    }

    const cssVarName = cssVarMapping[key];
    if (cssVarName) {
      root.style.setProperty(cssVarName, getSidebarCssVariableValue(key, value));
    }
  });
}

function shouldApplySidebarColorKey(key: string, value: string, themeContext: SidebarThemeContext) {
  if (!key.endsWith(themeContext.themeSuffix) || !value) return false;
  return !(
    (key === themeContext.bgStartKey && themeContext.isFullGradient) ||
    (key === themeContext.activeBgStartKey && themeContext.isActiveFullGradient)
  );
}

function getSidebarCssVariableValue(key: string, value: string) {
  return key === 'buttonTextColorL' || key === 'buttonTextColorD'
    ? `hsl(${value})`
    : value;
}

function applyButtonTextColors(root: HTMLElement, sidebarColors: Record<string, string>) {
  if (sidebarColors.buttonTextColorL) {
    root.style.setProperty('--button-text-color-l', `hsl(${sidebarColors.buttonTextColorL})`);
  }
  if (sidebarColors.buttonTextColorD) {
    root.style.setProperty('--button-text-color-d', `hsl(${sidebarColors.buttonTextColorD})`);
  }
}

export function getCurrentSidebarColors(): Record<string, string> {
  return { ...currentSidebarColors };
}

export function applySidebarStyles(sidebarColors: Record<string, string>) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');
  applySidebarStylesWithTheme(sidebarColors, isDark);
}

export function waitForSidebar(maxAttempts = 20, interval = 100): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    let attempts = 0;
    const checkSidebar = () => {
      const sidebar = document.querySelector('[data-sidebar="sidebar"]') as HTMLElement;
      if (sidebar) {
        resolve(sidebar);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(checkSidebar, interval);
      } else {
        resolve(null);
      }
    };
    checkSidebar();
  });
}

function getSidebarElements() {
  if (typeof document.querySelectorAll === 'function') {
    return Array.from(document.querySelectorAll<HTMLElement>('[data-sidebar="sidebar"]'))
      .filter((sidebarElement) => sidebarElement.dataset?.sidebarSurface !== 'rail');
  }

  const sidebar = document.querySelector('[data-sidebar="sidebar"]') as HTMLElement | null;
  return sidebar && sidebar.dataset?.sidebarSurface !== 'rail' ? [sidebar] : [];
}

export function reapplyCurrentSidebarColors() {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;
  const isDark = root.classList.contains('dark');

  waitForSidebar().then(() => {
    requestAnimationFrame(() => {
      applySidebarStylesWithTheme(currentSidebarColors, isDark);
    });
  });
}
