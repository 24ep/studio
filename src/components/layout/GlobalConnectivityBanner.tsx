"use client";

import * as React from "react";
import { WifiOff } from "lucide-react";
import { useLocalization } from '@/contexts/LocalizationContext';

export function GlobalConnectivityBanner() {
  const [online, setOnline] = React.useState(true);
  const { t } = useLocalization();

  React.useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
      <div className="flex min-h-11 items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-foreground" role="status" aria-live="polite">
      <WifiOff className="h-4 w-4 text-amber-700 dark:text-amber-300" aria-hidden="true" />
      <span>{t("status.offlineMessage", "You are offline. Existing information remains available; updates will resume after reconnection.")}</span>
    </div>
  );
}
