"use client";

import { PWAInstallPromptBanner } from "./PWAInstallPromptBanner";
import { usePwaInstallPrompt } from "./use-pwa-install-prompt";
import type { PwaSettingsState } from "./pwa-settings-api";

export function PWAInstallPrompt({ pwaState }: { pwaState?: PwaSettingsState | null }) {
  const {
    handleDismiss,
    handleInstallClick,
    isMobileOrTablet,
    isPromptVisible,
  } = usePwaInstallPrompt(pwaState?.enabled);

  if (!isPromptVisible || !isMobileOrTablet) {
    return null;
  }

  return (
    <PWAInstallPromptBanner
      onDismiss={handleDismiss}
      onInstall={handleInstallClick}
    />
  );
}
