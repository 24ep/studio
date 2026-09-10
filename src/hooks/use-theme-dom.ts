import type { MutableRefObject } from 'react';

import {
  type ThemeMode,
} from './use-theme-utils';

const THEME_CHANGE_THROTTLE_MS = 500;
const SIDEBAR_COLOR_REAPPLY_UNLOCK_MS = 200;

export function canApplyThemeChange(lastThemeChange: MutableRefObject<number>) {
  const now = Date.now();
  if (now - lastThemeChange.current < THEME_CHANGE_THROTTLE_MS) {
    return false;
  }

  lastThemeChange.current = now;
  return true;
}

export function applyThemeClass(theme: ThemeMode) {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const isDark = theme === 'dark';

  root.classList.toggle('dark', isDark);
  root.style.colorScheme = isDark ? 'dark' : 'light';
  root.dataset.resolvedTheme = isDark ? 'dark' : 'light';
}

export function scheduleSidebarColorReapply(isUpdatingRef: MutableRefObject<boolean>) {
  if (isUpdatingRef.current) {
    return;
  }

  isUpdatingRef.current = true;
  requestAnimationFrame(() => {
    import('@/lib/themeUtils').then(({ reapplyCurrentSidebarColors }) => {
      reapplyCurrentSidebarColors();
      window.setTimeout(() => {
        isUpdatingRef.current = false;
      }, SIDEBAR_COLOR_REAPPLY_UNLOCK_MS);
    }).catch(() => {
      window.setTimeout(() => {
        isUpdatingRef.current = false;
      }, SIDEBAR_COLOR_REAPPLY_UNLOCK_MS);
    });
  });
}
