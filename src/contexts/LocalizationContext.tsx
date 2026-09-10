'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AppKitLocalizationConfig } from '@/lib/appkit-sdk-client';
import type { StoredLocalizationConfig } from '@/lib/localization-config';
import { resolveSupportedLocale, translateWithConfig } from '@/lib/localization-utils';
import { createCommonLocalizationLabels, type CommonLocalizationLabel } from '@/lib/common-localization-labels';

export type LocalizationTranslator = (key: string, fallback?: string) => string;

type LocalizationContextValue = {
  config: AppKitLocalizationConfig | null;
  isLoading: boolean;
  locale: string;
  reload: () => Promise<void>;
  setLocale: (locale: string) => void;
  t: LocalizationTranslator;
  common: Record<CommonLocalizationLabel, string>;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);
let localizationSnapshotRequest: Promise<StoredLocalizationConfig> | null = null;

function createBuiltInLocalizationSnapshot(): StoredLocalizationConfig {
  return {
    config: {
      defaultLanguage: 'en',
      enabled: false,
      fallbackLanguage: 'en',
      supportedLanguages: [{ code: 'en', direction: 'ltr', name: 'English' }],
      translations: {},
    },
    environment: 'production',
    loadedAt: new Date().toISOString(),
  };
}

async function fetchLocalizationSnapshot(forceRefresh = false) {
  if (!localizationSnapshotRequest) {
    localizationSnapshotRequest = fetch('/api/localization?runtime=1', {
      cache: forceRefresh ? 'reload' : 'force-cache',
    })
      .then(async response => {
        if (!response.ok) throw new Error('Localization initialization failed');
        return response.json() as Promise<StoredLocalizationConfig>;
      })
      .finally(() => {
        localizationSnapshotRequest = null;
      });
  }

  return localizationSnapshotRequest;
}

function readCookie(name: string) {
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie.split('; ').find(value => value.startsWith(prefix))?.slice(prefix.length);
}

function resolveLocale(config: AppKitLocalizationConfig) {
  const supported = config.supportedLanguages?.map(language => language.code) || [];
  const cookieKey = config.localeCookieKey || 'preferred_language';
  const saved = decodeURIComponent(readCookie(cookieKey) || '').split('-', 1)[0];
  const browser = navigator.language.split('-', 1)[0];
  return resolveSupportedLocale(
    [saved, browser, config.defaultLanguage, config.fallbackLanguage, 'en'].find(Boolean),
    supported,
    config.fallbackLanguage || config.defaultLanguage || 'en',
  );
}

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppKitLocalizationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locale, setLocaleState] = useState('en');

  const applyConfig = useCallback((next: AppKitLocalizationConfig) => {
    setConfig(next);
    const nextLocale = resolveLocale(next);
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = next.supportedLanguages?.find(item => item.code === nextLocale)?.direction || 'ltr';
  }, []);

  const fetchLatest = useCallback(async (showLoading: boolean, forceRefresh = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const snapshot = await fetchLocalizationSnapshot(forceRefresh);
      applyConfig(snapshot.config);
    } catch (error) {
      console.warn('[LOCALIZATION] Using built-in English copy:', error);
      applyConfig(createBuiltInLocalizationSnapshot().config);
    } finally {
      setIsLoading(false);
    }
  }, [applyConfig]);

  const reload = useCallback(() => fetchLatest(true, true), [fetchLatest]);

  useEffect(() => {
    const handleAppConfigChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ defaultLanguage?: string }>;
      if (!customEvent.detail || customEvent.detail.defaultLanguage == null) return;
      void reload();
    };

    window.addEventListener("appConfigChanged", handleAppConfigChange);
    return () => {
      window.removeEventListener("appConfigChanged", handleAppConfigChange);
    };
  }, [reload]);

  useEffect(() => {
    void fetchLatest(true);
  }, [fetchLatest]);

  const setLocale = useCallback((nextLocale: string) => {
    const supported = config?.supportedLanguages?.map(language => language.code) || [];
    const resolved = resolveSupportedLocale(nextLocale, supported, config?.fallbackLanguage || 'en');
    const cookieKey = config?.localeCookieKey || 'preferred_language';
    document.cookie = `${encodeURIComponent(cookieKey)}=${encodeURIComponent(resolved)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setLocaleState(resolved);
    document.documentElement.lang = resolved;
    document.documentElement.dir = config?.supportedLanguages?.find(item => item.code === resolved)?.direction || 'ltr';
  }, [config]);

  const value = useMemo<LocalizationContextValue>(() => {
    const t: LocalizationTranslator = (key, fallback) => translateWithConfig(config, locale, key, fallback);
    return {
      common: createCommonLocalizationLabels(t),
      config,
      isLoading,
      locale,
      reload,
      setLocale,
      t,
    };
  }, [config, isLoading, locale, reload, setLocale]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) throw new Error('useLocalization must be used inside LocalizationProvider');
  return context;
}
