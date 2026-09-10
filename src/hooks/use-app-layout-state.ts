import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  DEFAULT_APP_NAME,
  type AppLayoutConfigUpdates,
  type AppLayoutState,
} from './app-layout-state-types';
import { useBatchedAppLayoutState } from './use-batched-app-layout-state';

export function useAppLayoutState() {
  const { state, updateState } = useBatchedAppLayoutState();
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearBatchTimeout = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
  }, []);

  const scheduleBatchedUpdate = useCallback((updates: Partial<AppLayoutState>, delay: number) => {
    clearBatchTimeout();
    batchTimeoutRef.current = setTimeout(() => {
      updateState(updates);
    }, delay);
  }, [clearBatchTimeout, updateState]);

  const initializeClient = useCallback(() => {
    updateState({ isClient: true });
  }, [updateState]);

  const setLogoLoading = useCallback((loading: boolean) => {
    scheduleBatchedUpdate({ isLogoLoading: loading }, 200);
  }, [scheduleBatchedUpdate]);

  const updateAppConfig = useCallback((config: AppLayoutConfigUpdates) => {
    if (config.appLogoUrl !== undefined) {
      updateState(config);
      return;
    }

    scheduleBatchedUpdate(config, 100);
  }, [scheduleBatchedUpdate, updateState]);

  const updateThemeAndColors = useCallback((themeAndColors: AppLayoutState['themeAndColors']) => {
    scheduleBatchedUpdate({ themeAndColors }, 400);
  }, [scheduleBatchedUpdate]);

  const resetToDefaults = useCallback(() => {
    scheduleBatchedUpdate({
      appLogoUrl: null,
      currentAppName: DEFAULT_APP_NAME,
      showLogoOnly: false,
      sidebarLogoSize: 48,
      collapsedSidebarLogoSize: 40,
      contextualLogos: {
        sidebarLogoCollapsedLightMode: null,
        sidebarLogoExpandedLightMode: null,
        sidebarLogoCollapsedDarkMode: null,
        sidebarLogoExpandedDarkMode: null,
      },
    }, 400);
  }, [scheduleBatchedUpdate]);

  const memoizedValue = useMemo(() => ({
    ...state,
    updateState,
    initializeClient,
    setLogoLoading,
    updateAppConfig,
    updateThemeAndColors,
    resetToDefaults,
  }), [
    state,
    updateState,
    initializeClient,
    setLogoLoading,
    updateAppConfig,
    updateThemeAndColors,
    resetToDefaults,
  ]);

  useEffect(() => {
    return clearBatchTimeout;
  }, [clearBatchTimeout]);

  return memoizedValue;
}
