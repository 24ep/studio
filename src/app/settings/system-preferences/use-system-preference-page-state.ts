import { useMemo, useRef } from "react";

import { useSystemPreferenceAppearanceState } from "./use-system-preference-appearance-state";
import { useSystemPreferenceCoreState } from "./use-system-preference-core-state";
import { useSystemPreferenceLogoState } from "./use-system-preference-logo-state";
import { useSystemPreferenceSidebarSplashState } from "./use-system-preference-sidebar-splash-state";

export function useSystemPreferencePageState() {
  const coreState = useSystemPreferenceCoreState();
  const logoState = useSystemPreferenceLogoState();
  const appearanceState = useSystemPreferenceAppearanceState();
  const sidebarSplashState = useSystemPreferenceSidebarSplashState();
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadedPreferenceStateSetters = useMemo(() => ({
    ...coreState.loadedPreferenceStateSetters,
    ...logoState.loadedPreferenceStateSetters,
    ...appearanceState.loadedPreferenceStateSetters,
    ...sidebarSplashState.loadedPreferenceStateSetters,
  }), [
    appearanceState.loadedPreferenceStateSetters,
    coreState.loadedPreferenceStateSetters,
    logoState.loadedPreferenceStateSetters,
    sidebarSplashState.loadedPreferenceStateSetters,
  ]);

  const {
    loadedPreferenceStateSetters: _coreSetters,
    ...coreValues
  } = coreState;
  const {
    loadedPreferenceStateSetters: _logoSetters,
    ...logoValues
  } = logoState;
  const {
    loadedPreferenceStateSetters: _appearanceSetters,
    ...appearanceValues
  } = appearanceState;
  const {
    loadedPreferenceStateSetters: _sidebarSplashSetters,
    ...sidebarSplashValues
  } = sidebarSplashState;

  return {
    ...coreValues,
    ...logoValues,
    ...appearanceValues,
    ...sidebarSplashValues,
    isMountedRef,
    abortControllerRef,
    loadedPreferenceStateSetters,
  };
}
