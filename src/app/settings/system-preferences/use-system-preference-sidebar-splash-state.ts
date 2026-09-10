import { useCallback, useMemo, useState } from "react";

import { applySidebarStyles } from "@/lib/themeUtils";
import {
  DEFAULT_SIDEBAR_LAYOUT_SETTINGS,
  type SidebarNavigationMode,
} from "../../../components/layout/sidebar-layout-settings";
import {
  DEFAULT_SIDEBAR_COLORS_BASE,
  DEFAULT_SIDEBAR_BACKGROUND_BLUR_PERCENT,
  DEFAULT_SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT,
  DEFAULT_SPLASH_ANIMATION_TYPE,
  DEFAULT_SPLASH_BACKGROUND_COLOR,
  createInitialSidebarColors,
  type SidebarBackgroundType,
  type SidebarColors,
  type SidebarImageFit,
  type SidebarImagePosition,
} from "@/components/settings/system-preferences/constants";

export function useSystemPreferenceSidebarSplashState() {
  const [sidebarColors, setSidebarColors] = useState<SidebarColors>(DEFAULT_SIDEBAR_COLORS_BASE);
  const [sidebarBackgroundType, setSidebarBackgroundType] = useState<SidebarBackgroundType>("gradient");
  const [selectedSidebarImageFile, setSelectedSidebarImageFile] = useState<File | null>(null);
  const [sidebarImagePreviewUrl, setSidebarImagePreviewUrl] = useState<string | null>(null);
  const [savedSidebarImageUrl, setSavedSidebarImageUrl] = useState<string | null>(null);
  const [sidebarImageFit, setSidebarImageFit] = useState<SidebarImageFit>("cover");
  const [sidebarImagePosition, setSidebarImagePosition] = useState<SidebarImagePosition>("center");
  const [sidebarBackgroundBlurPercent, setSidebarBackgroundBlurPercent] = useState<number>(
    DEFAULT_SIDEBAR_BACKGROUND_BLUR_PERCENT,
  );
  const [sidebarBackgroundTranslucencyPercent, setSidebarBackgroundTranslucencyPercent] = useState<number>(
    DEFAULT_SIDEBAR_BACKGROUND_TRANSLUCENCY_PERCENT,
  );
  const [sidebarNavigationMode, setSidebarNavigationMode] = useState<SidebarNavigationMode>(
    DEFAULT_SIDEBAR_LAYOUT_SETTINGS.mode,
  );
  const [sidebarSecondaryGroupLabels, setSidebarSecondaryGroupLabels] = useState<string[]>(
    DEFAULT_SIDEBAR_LAYOUT_SETTINGS.secondaryGroupLabels,
  );

  const [splashBackgroundColor, setSplashBackgroundColor] = useState<string>(DEFAULT_SPLASH_BACKGROUND_COLOR);
  const [splashAnimationType, setSplashAnimationType] = useState<string>(DEFAULT_SPLASH_ANIMATION_TYPE);
  const [selectedSplashLogoFile, setSelectedSplashLogoFile] = useState<File | null>(null);
  const [splashLogoPreviewUrl, setSplashLogoPreviewUrl] = useState<string | null>(null);
  const [savedSplashLogoDataUrl, setSavedSplashLogoDataUrl] = useState<string | null>(null);

  const resetSidebarColors = useCallback(() => {
    const newSidebarColors = createInitialSidebarColors();
    setSidebarColors(newSidebarColors);
    applySidebarStyles(newSidebarColors);
  }, []);
  const loadedPreferenceStateSetters = useMemo(() => ({
    setSidebarColors,
    setSidebarBackgroundType,
    setSavedSidebarImageUrl,
    setSidebarImagePreviewUrl,
    setSidebarImageFit,
    setSidebarImagePosition,
    setSidebarBackgroundBlurPercent,
    setSidebarBackgroundTranslucencyPercent,
    setSidebarNavigationMode,
    setSidebarSecondaryGroupLabels,
    setSplashBackgroundColor,
    setSplashAnimationType,
    setSavedSplashLogoDataUrl,
    setSplashLogoPreviewUrl,
  }), []);

  return {
    sidebarColors,
    setSidebarColors,
    sidebarBackgroundType,
    setSidebarBackgroundType,
    selectedSidebarImageFile,
    setSelectedSidebarImageFile,
    sidebarImagePreviewUrl,
    setSidebarImagePreviewUrl,
    savedSidebarImageUrl,
    setSavedSidebarImageUrl,
    sidebarImageFit,
    setSidebarImageFit,
    sidebarImagePosition,
    setSidebarImagePosition,
    sidebarBackgroundBlurPercent,
    setSidebarBackgroundBlurPercent,
    sidebarBackgroundTranslucencyPercent,
    setSidebarBackgroundTranslucencyPercent,
    sidebarNavigationMode,
    setSidebarNavigationMode,
    sidebarSecondaryGroupLabels,
    setSidebarSecondaryGroupLabels,
    splashBackgroundColor,
    setSplashBackgroundColor,
    splashAnimationType,
    setSplashAnimationType,
    selectedSplashLogoFile,
    setSelectedSplashLogoFile,
    splashLogoPreviewUrl,
    setSplashLogoPreviewUrl,
    savedSplashLogoDataUrl,
    setSavedSplashLogoDataUrl,
    resetSidebarColors,
    loadedPreferenceStateSetters,
  };
}
