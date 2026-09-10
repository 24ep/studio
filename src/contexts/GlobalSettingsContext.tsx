"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { normalizeSystemSettingsResponse, type SystemSettingsRecord } from '@/lib/system-settings-response';

export interface GlobalSettings {
  appName: string;
  appLogoDataUrl: string | null;
  appFaviconDataUrl: string | null;
  organizationLogoDataUrl: string | null;
  appThemePreference: string;
  showLogoOnly: boolean;
  sidebarLogoSize: number;
  sidebarLogoCollapsedLightMode: string | null;
  sidebarLogoExpandedLightMode: string | null;
  sidebarLogoCollapsedDarkMode: string | null;
  sidebarLogoExpandedDarkMode: string | null;
  loginPageLogoLightMode: string | null;
  loginPageLogoDarkMode: string | null;
  
  // Splash Screen Settings
  splashBackgroundColor: string;
  splashLogoDataUrl: string | null;
  splashAnimationType: string;

  pwaEnabled: boolean;
  pwaThemeColor: string;
  pwaBackgroundColor: string;
  pwaAppleMobileWebAppTitle: string;
  pwaAppleMobileWebAppStatusBarStyle: string;
  rightClickProtectionEnabled: boolean;
  screenCaptureProtectionEnabled: boolean;

  [key: string]: unknown;
}

interface GlobalSettingsContextType {
  settings: GlobalSettings;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateSettings: (updates: Partial<GlobalSettings>) => void;
}

const defaultSettings: GlobalSettings = {
  appName: "hrive",
  appLogoDataUrl: null,
  appFaviconDataUrl: null,
  organizationLogoDataUrl: null,
  appThemePreference: 'system',
  showLogoOnly: false,
  sidebarLogoSize: 48,
  sidebarLogoCollapsedLightMode: null,
  sidebarLogoExpandedLightMode: null,
  sidebarLogoCollapsedDarkMode: null,
  sidebarLogoExpandedDarkMode: null,
  loginPageLogoLightMode: null,
  loginPageLogoDarkMode: null,
  
  // Splash Screen Defaults
  splashBackgroundColor: '#ffffff',
  splashLogoDataUrl: null,
  splashAnimationType: 'spinner',
  pwaEnabled: false,
  pwaThemeColor: '#000000',
  pwaBackgroundColor: '#171a26',
  pwaAppleMobileWebAppTitle: 'hrive',
  pwaAppleMobileWebAppStatusBarStyle: 'default',
  rightClickProtectionEnabled: false,
  screenCaptureProtectionEnabled: false,
};

const GLOBAL_SETTINGS_KEYS = [
  'appName', 'appLogoDataUrl', 'appFaviconDataUrl', 'organizationLogoDataUrl',
  'appThemePreference', 'showLogoOnly', 'sidebarLogoSize',
  'sidebarLogoCollapsedLightMode', 'sidebarLogoExpandedLightMode',
  'sidebarLogoCollapsedDarkMode', 'sidebarLogoExpandedDarkMode',
  'loginPageLogoLightMode', 'loginPageLogoDarkMode',
  'splashBackgroundColor', 'splashLogoDataUrl', 'splashAnimationType',
  'pwaEnabled', 'pwaThemeColor', 'pwaBackgroundColor',
  'pwaAppleMobileWebAppTitle', 'pwaAppleMobileWebAppStatusBarStyle',
  'rightClickProtectionEnabled', 'screenCaptureProtectionEnabled',
] as const;

const GLOBAL_SETTINGS_URL = `/api/settings/system-settings?${new URLSearchParams({
  keys: GLOBAL_SETTINGS_KEYS.join(','),
}).toString()}`;
const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

export function GlobalSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTime = useRef<number>(0);
  const hasInitialized = useRef<boolean>(false);

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    // Prevent excessive API calls - only fetch once per 5 minutes unless forced
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime.current < SETTINGS_CACHE_TTL_MS) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(GLOBAL_SETTINGS_URL, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch system settings');
      }
      
      const data = await response.json();
      
      const settingsData: SystemSettingsRecord = normalizeSystemSettingsResponse(data);
      
      // Merge with defaults
      const mergedSettings = {
        ...defaultSettings,
        ...settingsData,
      };
      
      setSettings(mergedSettings);
      lastFetchTime.current = now;
    } catch (err) {
      console.warn('Global settings unavailable; continuing with defaults.', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    return fetchSettings(true);
  }, [fetchSettings]);

  const updateSettings = useCallback((updates: Partial<GlobalSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  // Initialize settings on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    fetchSettings();
  }, [fetchSettings]);

  // Listen for settings changes from other components
  useEffect(() => {
    const handleSettingsChange = () => {
      fetchSettings(true);
    };

    window.addEventListener('globalSettingsChanged', handleSettingsChange);
    
    return () => {
      window.removeEventListener('globalSettingsChanged', handleSettingsChange);
    };
  }, [fetchSettings]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: GlobalSettingsContextType = useMemo(() => ({
    settings,
    isLoading,
    error,
    refetch,
    updateSettings,
  }), [settings, isLoading, error, refetch, updateSettings]);

  return (
    <GlobalSettingsContext.Provider value={value}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  const context = useContext(GlobalSettingsContext);
  if (context === undefined) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
}
