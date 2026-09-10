"use client";

import { useCallback, useEffect, useRef } from 'react';
import type { Session } from 'next-auth';

import { useAppLayoutState } from '@/hooks/use-app-layout-state';

import {
  initializeAppLayoutSidebarStyles,
  reapplyAppLayoutSidebarColorsForThemeChange,
  reapplyAppLayoutSidebarStylesAfterLogin,
} from './app-layout-settings';
import {
  clearAppLayoutTimeout,
  fetchAndApplyAppLayoutGlobalSettings,
  handleAppConfigChangedEvent,
  type AppLayoutGlobalSettingsRefs,
} from './app-layout-global-settings-utils';
import { fetchLayoutSystemSettings } from './layout-system-settings-api';

type AppLayoutStateApi = ReturnType<typeof useAppLayoutState>;

interface UseAppLayoutGlobalSettingsInput {
  appLayoutState: AppLayoutStateApi;
  isClient: boolean;
  session: Session | null;
  status: string;
}

export function useAppLayoutGlobalSettings({
  appLayoutState,
  isClient,
  session,
  status,
}: UseAppLayoutGlobalSettingsInput) {
  const updateAppConfigRef = useRef<AppLayoutStateApi['updateAppConfig'] | null>(null);
  const updateThemeAndColorsRef = useRef<AppLayoutStateApi['updateThemeAndColors'] | null>(null);
  const resetToDefaultsRef = useRef<AppLayoutStateApi['resetToDefaults'] | null>(null);
  const setLogoLoadingRef = useRef<AppLayoutStateApi['setLogoLoading'] | null>(null);
  const hasInitializedRef = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const appLayoutRefs: AppLayoutGlobalSettingsRefs = {
    resetToDefaultsRef,
    setLogoLoadingRef,
    updateAppConfigRef,
    updateThemeAndColorsRef,
  };

  const {
    initializeClient,
    resetToDefaults,
    setLogoLoading,
    updateAppConfig,
    updateThemeAndColors,
  } = appLayoutState;

  useEffect(() => {
    if (!updateAppConfigRef.current) updateAppConfigRef.current = updateAppConfig;
    if (!updateThemeAndColorsRef.current) updateThemeAndColorsRef.current = updateThemeAndColors;
    if (!resetToDefaultsRef.current) resetToDefaultsRef.current = resetToDefaults;
    if (!setLogoLoadingRef.current) setLogoLoadingRef.current = setLogoLoading;
  }, [resetToDefaults, setLogoLoading, updateAppConfig, updateThemeAndColors]);

  const fetchGlobalSettings = useCallback(async () => {
    await fetchAndApplyAppLayoutGlobalSettings({
      fetchSettings: fetchLayoutSystemSettings,
      fetchTimeoutRef,
      isMountedRef,
      refs: appLayoutRefs,
    });
  }, []);

  const handleAppConfigChange = useCallback((event: Event) => {
    handleAppConfigChangedEvent({
      event,
      isMounted: isMountedRef.current,
      updateAppConfig: updateAppConfigRef.current,
    });
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    initializeClient();
    initializeAppLayoutSidebarStyles();
    fetchGlobalSettings();
    window.addEventListener('appConfigChanged', handleAppConfigChange);

    return () => {
      try {
        window.removeEventListener('appConfigChanged', handleAppConfigChange);
      } catch (error) {
        console.warn('[APPLAYOUT] Error removing app config listener:', error);
      }
    };
  }, [fetchGlobalSettings, handleAppConfigChange, initializeClient]);

  useEffect(() => {
    if (status !== 'authenticated' || !session || !isClient) return;

    const timer = setTimeout(() => {
      fetchGlobalSettings();
      setTimeout(() => {
        reapplyAppLayoutSidebarStylesAfterLogin();
      }, 300);
    }, 150);

    return () => clearTimeout(timer);
  }, [fetchGlobalSettings, isClient, session, status]);

  const handleThemeChange = useCallback(() => {
    if (!isMountedRef.current) return;

    reapplyAppLayoutSidebarColorsForThemeChange();
  }, []);

  useEffect(() => {
    let mediaQuery: MediaQueryList | null = null;

    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.removeEventListener('change', handleThemeChange);
      mediaQuery.addEventListener('change', handleThemeChange);
    } catch (error) {
      console.warn('[APPLAYOUT] MediaQuery not supported:', error);
    }

    return () => {
      if (!mediaQuery) return;

      try {
        mediaQuery.removeEventListener('change', handleThemeChange);
      } catch (error) {
        console.warn('[APPLAYOUT] Error removing theme change listener:', error);
      }
    };
  }, [handleThemeChange]);

  useEffect(() => () => {
    isMountedRef.current = false;
    clearAppLayoutTimeout(fetchTimeoutRef);
  }, []);
}
