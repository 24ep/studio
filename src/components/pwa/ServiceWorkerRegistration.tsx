"use client";

import { useEffect, useState } from 'react';
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';
import { fetchPwaSettingsState } from './pwa-settings-api';
import {
  clearServiceWorkerCaches,
  hasServiceWorkerSupport,
  shouldCleanupServiceWorkers,
  shouldRegisterServiceWorker,
  shouldUnregisterServiceWorkers,
  SW_REGISTRATION_DELAY_MS,
  SW_UPDATE_INTERVAL_MS,
  SW_VERSION,
  SW_VERSION_KEY,
  unregisterServiceWorkerRegistrations,
} from './service-worker-registration-utils';
import type { PwaSettingsState } from './pwa-settings-api';

export function ServiceWorkerRegistration({ pwaState }: { pwaState?: PwaSettingsState | null }) {
  const [pwaEnabled, setPwaEnabled] = useState(pwaState?.enabled ?? false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (pwaState !== undefined) {
      setPwaEnabled(pwaState?.enabled ?? false);
      return;
    }

    const checkPWAEnabled = async () => {
      try {
        const settings = await fetchPwaSettingsState();
        setPwaEnabled(settings?.enabled ?? false);
      } catch (error) {
        console.error('Failed to check PWA setting:', error);
        setPwaEnabled(false);
      }
    };

    checkPWAEnabled();
  }, [pwaState]);

  useEffect(() => {
    const cleanupOldServiceWorker = async () => {
      if (!hasServiceWorkerSupport()) return;

      try {
        const storedVersion = localStorage.getItem(SW_VERSION_KEY);

        if (!shouldCleanupServiceWorkers({ storedVersion, nodeEnv: process.env.NODE_ENV })) return;

        const registrations = await navigator.serviceWorker.getRegistrations();
        await unregisterServiceWorkerRegistrations(registrations);

        if ('caches' in window) {
          await clearServiceWorkerCaches(caches);
        }

        localStorage.setItem(SW_VERSION_KEY, SW_VERSION);
      } catch (error) {
        console.error('Error during service worker cleanup:', error);
      }
    };

    cleanupOldServiceWorker();
  }, []);

  useEffect(() => {
    const canRegisterServiceWorker = shouldRegisterServiceWorker({
      pwaEnabled,
      nodeEnv: process.env.NODE_ENV,
      serviceWorkerSupported: hasServiceWorkerSupport(),
    });

    if (shouldUnregisterServiceWorkers({ pwaEnabled, nodeEnv: process.env.NODE_ENV }) || !canRegisterServiceWorker) {
      if (hasServiceWorkerSupport()) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          unregisterServiceWorkerRegistrations(registrations);
        });
      }
      setRegistration(null);
      return;
    }

    const registrationTimeout = setTimeout(() => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          setRegistration(registration);
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
          setRegistration(null);
        });
    }, SW_REGISTRATION_DELAY_MS);

    return () => {
      clearTimeout(registrationTimeout);
      setRegistration(null);
    };
  }, [pwaEnabled]);

  useVisibilityInterval(
    () => {
      void registration?.update();
    },
    SW_UPDATE_INTERVAL_MS,
    Boolean(registration),
  );

  return null;
}

