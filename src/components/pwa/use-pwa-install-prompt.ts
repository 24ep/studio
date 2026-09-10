"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  isMobileDevice,
  isStandaloneMode,
  useDevicePlatform,
} from "@/hooks/use-device-platform";

import {
  getPwaInstallInstructions,
  getPwaInstallPromptDelay,
  isMobileOrTabletDevice,
  PWA_INSTALL_ACCEPTED_KEY,
  PWA_INSTALL_DISMISSED_KEY,
  shouldShowDelayedPwaPrompt,
  shouldTreatPwaAsInstalled,
} from "./pwa-install-utils";
import type { BeforeInstallPromptEvent } from "./pwa-install-types";
import { fetchPwaSettingsState } from "./pwa-settings-api";

export function usePwaInstallPrompt(initialPwaEnabled?: boolean) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [pwaEnabled, setPwaEnabled] = useState(initialPwaEnabled ?? false);
  const devicePlatform = useDevicePlatform();

  const getUserAgent = () => (typeof navigator !== "undefined" ? navigator.userAgent : "");

  const getIsMobileOrTablet = () => isMobileOrTabletDevice({
    isMobileDevice: isMobileDevice(),
    userAgent: getUserAgent(),
    innerWidth: typeof window !== "undefined" ? window.innerWidth : Number.POSITIVE_INFINITY,
  });

  useEffect(() => {
    if (initialPwaEnabled !== undefined) {
      setPwaEnabled(initialPwaEnabled);
      return;
    }

    const checkPWAEnabled = async () => {
      try {
        const settings = await fetchPwaSettingsState();
        if (settings) {
          setPwaEnabled(settings.enabled);
          return;
        }

        console.error("PWA Install Prompt: Failed to fetch system settings");
      } catch (error) {
        console.error("PWA Install Prompt: Failed to check PWA setting:", error);
      }
    };

    void checkPWAEnabled();
  }, [initialPwaEnabled]);

  useEffect(() => {
    if (!pwaEnabled) {
      setDeferredPrompt(null);
      setIsInstalled(false);
      setShowPrompt(false);
      return;
    }

    const isStandalone = isStandaloneMode();
    const installDismissed = localStorage.getItem(PWA_INSTALL_DISMISSED_KEY);
    const installAccepted = localStorage.getItem(PWA_INSTALL_ACCEPTED_KEY);
    const isMobileOrTablet = getIsMobileOrTablet();

    if (shouldTreatPwaAsInstalled({ isStandalone, installAccepted })) {
      setIsInstalled(true);
      setShowPrompt(false);
      return;
    }

    if (shouldShowDelayedPwaPrompt({ isStandalone, installAccepted, installDismissed, isMobileOrTablet })) {
      const delay = getPwaInstallPromptDelay(devicePlatform, getUserAgent());
      const timer = setTimeout(() => {
        const stillStandalone = isStandaloneMode();
        const stillDismissed = localStorage.getItem(PWA_INSTALL_DISMISSED_KEY);
        const stillAccepted = localStorage.getItem(PWA_INSTALL_ACCEPTED_KEY);
        const stillMobileOrTablet = getIsMobileOrTablet();

        if (
          shouldShowDelayedPwaPrompt({
            isStandalone: stillStandalone,
            installAccepted: stillAccepted,
            installDismissed: stillDismissed,
            isMobileOrTablet: stillMobileOrTablet,
          })
        ) {
          setShowPrompt(true);
        }
      }, delay);

      return () => clearTimeout(timer);
    }

    setShowPrompt(false);
  }, [pwaEnabled, devicePlatform]);

  useEffect(() => {
    if (!pwaEnabled || isInstalled) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      if (!getIsMobileOrTablet()) return;

      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [pwaEnabled, isInstalled]);

  useEffect(() => {
    if (!pwaEnabled) return;

    const checkInstalled = () => {
      if (isStandaloneMode()) {
        setIsInstalled(true);
        setShowPrompt(false);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      localStorage.setItem(PWA_INSTALL_ACCEPTED_KEY, "true");
      toast.success("App installed successfully!");
    };

    checkInstalled();
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [pwaEnabled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast(getPwaInstallInstructions(devicePlatform), {
        duration: 5000,
      });
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        localStorage.setItem(PWA_INSTALL_ACCEPTED_KEY, "true");
        toast.success("App installation started!");
      } else {
        localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "true");
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Error during installation:", error);
      toast.error("Failed to install app");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, "true");
  };

  return {
    handleDismiss,
    handleInstallClick,
    isMobileOrTablet: getIsMobileOrTablet(),
    isPromptVisible: pwaEnabled && !isInstalled && showPrompt,
  };
}
