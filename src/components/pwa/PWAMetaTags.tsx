"use client";

import { useEffect, useState } from 'react';
import {
  applyPwaMetaTags,
  type PwaMetaSettings,
  removePwaMetaTags,
  updateDynamicThemeColor,
} from './pwa-meta-tags-utils';
import { fetchPwaSettingsState, type PwaSettingsState } from './pwa-settings-api';

export function PWAMetaTags({ pwaState }: { pwaState?: PwaSettingsState | null }) {
  const [pwaEnabled, setPwaEnabled] = useState(pwaState?.enabled ?? false);
  const [pwaSettings, setPwaSettings] = useState<PwaMetaSettings | null>(pwaState?.metaSettings ?? null);

  useEffect(() => {
    if (pwaState !== undefined) {
      setPwaEnabled(pwaState?.enabled ?? false);
      setPwaSettings(pwaState?.metaSettings ?? null);

      if (pwaState?.enabled) {
        applyPwaMetaTags(document, pwaState.metaSettings);
      } else {
        removePwaMetaTags(document);
      }
      return;
    }

    const checkPWAEnabled = async () => {
      try {
        const pwaState = await fetchPwaSettingsState();
        if (!pwaState) return;

        setPwaEnabled(pwaState.enabled);
        setPwaSettings(pwaState.metaSettings);

        if (pwaState.enabled) {
          applyPwaMetaTags(document, pwaState.metaSettings);
        } else {
          removePwaMetaTags(document);
        }
      } catch (error) {
        console.error('Failed to check PWA setting:', error);
        setPwaEnabled(false);
      }
    };

    checkPWAEnabled();
  }, [pwaState]);

  useEffect(() => {
    if (!pwaEnabled || !pwaSettings) return;

    const handleThemeColorUpdate = () => {
      updateDynamicThemeColor(document, pwaSettings.themeColor);
    };

    const observer = new MutationObserver(handleThemeColorUpdate);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeColorUpdate);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleThemeColorUpdate);
    };
  }, [pwaEnabled, pwaSettings]);

  return null;
}
