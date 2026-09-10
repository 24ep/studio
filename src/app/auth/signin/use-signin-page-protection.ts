"use client";

import { useEffect } from "react";

import type { SystemSetting } from "@/lib/types";

export function useSignInPageProtection(initialSettings?: SystemSetting[]) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loginProtection = initialSettings?.find((setting) => setting.key === 'loginPageDevToolsProtectionEnabled')?.value !== 'false';
    const globalRightClickProtection = initialSettings?.find((setting) => setting.key === 'rightClickProtectionEnabled')?.value === 'true';

    const shouldDisableRightClick = loginProtection || globalRightClickProtection;
    const shouldDisableDevTools = loginProtection;

    if (!shouldDisableRightClick && !shouldDisableDevTools) return;

    const handleContextMenu = (event: MouseEvent) => {
      if (shouldDisableRightClick) {
        event.preventDefault();
        return false;
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldDisableDevTools) return;

      const isBlockedCtrlShiftKey = event.ctrlKey
        && event.shiftKey
        && ['I', 'J', 'C'].includes(event.key);
      const isViewSourceShortcut = event.ctrlKey && event.key === 'u';

      if (event.key === 'F12' || isBlockedCtrlShiftKey || isViewSourceShortcut) {
        event.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [initialSettings]);
}
