"use client";

import { useMemo } from "react";

import { useGlobalSettings } from "@/contexts/GlobalSettingsContext";
import { PWAMetaTags } from "./PWAMetaTags";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
import { ServiceWorkerRecovery } from "./ServiceWorkerRecovery";
import { ServiceWorkerRegistration } from "./ServiceWorkerRegistration";
import { getPwaMetaSettings } from "./pwa-meta-tags-utils";
import { isPwaEnabledFromSettings } from "./pwa-settings-utils";

export function PWAClientFeatures() {
  const { settings, isLoading } = useGlobalSettings();
  const pwaState = useMemo(() => isLoading ? null : ({
    enabled: isPwaEnabledFromSettings(settings),
    metaSettings: getPwaMetaSettings(settings),
  }), [isLoading, settings]);

  return (
    <>
      <PWAMetaTags pwaState={pwaState} />
      <ServiceWorkerRegistration pwaState={pwaState} />
      {pwaState?.enabled ? (
        <>
          <ServiceWorkerRecovery />
          <PWAInstallPrompt pwaState={pwaState} />
        </>
      ) : null}
    </>
  );
}
