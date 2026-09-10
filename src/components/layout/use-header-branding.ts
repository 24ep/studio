"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  HEADER_BRANDING_DEFAULT_DESKTOP_ZOOM,
  HEADER_BRANDING_ZOOM_STORAGE_KEY,
  buildHeaderBrandingState,
  buildHeaderZoomStyleValues,
  deriveHeaderPageTitle,
  getHeaderZoomLevel,
  getInitialHeaderAppName,
  getInitialHeaderLogoUrl,
  parseHeaderBrandingSettingsResponse,
  shouldPersistDefaultHeaderZoom,
} from "./header-branding-utils";
import { fetchLayoutSystemSettings } from "./layout-system-settings-api";

interface UseHeaderBrandingOptions {
  initialPageTitle: string;
  propAppName?: string;
  propLogoUrl?: string | null;
  isMobile: boolean;
}

export function useHeaderBranding({
  initialPageTitle,
  propAppName,
  propLogoUrl,
  isMobile,
}: UseHeaderBrandingOptions) {
  const mountedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [currentAppName, setCurrentAppName] = useState<string>(getInitialHeaderAppName(propAppName));
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(getInitialHeaderLogoUrl(propLogoUrl));
  const [effectivePageTitle, setEffectivePageTitle] = useState(initialPageTitle);

  const applyRemZoom = useCallback((zoomLevel: number) => {
    try {
      const zoomStyles = buildHeaderZoomStyleValues(zoomLevel);

      document.documentElement.style.fontSize = zoomStyles.rootFontSize;
      document.documentElement.style.setProperty("--zoom-scale", zoomStyles.zoomScale);
      document.body.style.fontSize = zoomStyles.bodyFontSize;
    } catch (error) {
      console.error("Error applying rem zoom:", error);
    }
  }, []);

  useEffect(() => {
    try {
      if (isMobile) {
        applyRemZoom(getHeaderZoomLevel(true, null));
        return;
      }

      const savedZoom = localStorage.getItem(HEADER_BRANDING_ZOOM_STORAGE_KEY);
      const zoomLevel = getHeaderZoomLevel(false, savedZoom);
      applyRemZoom(zoomLevel);

      if (shouldPersistDefaultHeaderZoom(false, savedZoom)) {
        localStorage.setItem(HEADER_BRANDING_ZOOM_STORAGE_KEY, HEADER_BRANDING_DEFAULT_DESKTOP_ZOOM.toString());
      }
    } catch (error) {
      console.warn("Failed to load saved zoom level:", error);
    }
  }, [isMobile, applyRemZoom]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    const fetchAppName = async () => {
      try {
        const data = await fetchLayoutSystemSettings();
        if (!data) return;

        const settings = parseHeaderBrandingSettingsResponse(data);
        const branding = buildHeaderBrandingState(settings);

        setCurrentAppName(branding.appName);
        setAppLogoUrl(branding.appLogoUrl);
      } catch (error) {
        console.warn("[HEADER] Failed to fetch app name:", error);
      }
    };

    fetchAppName();
  }, []);

  useEffect(() => {
    const nextPageTitle = deriveHeaderPageTitle(initialPageTitle, currentAppName);

    setEffectivePageTitle(nextPageTitle);
    document.title = nextPageTitle;
  }, [initialPageTitle, currentAppName]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBrandingChange = () => {
      setMounted((prev) => !prev);
      setTimeout(() => setMounted(true), 0);
    };

    window.addEventListener("headerBrandingChanged", handleBrandingChange);
    import("@/lib/theme/header-branding").then((module) => module.initializeHeaderBranding());

    return () => {
      window.removeEventListener("headerBrandingChanged", handleBrandingChange);
    };
  }, []);

  return {
    mounted,
    currentAppName,
    appLogoUrl,
    effectivePageTitle,
  };
}
