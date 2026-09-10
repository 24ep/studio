"use client";

import { useEffect, useState } from "react";
import { useLocalization } from '@/contexts/LocalizationContext';
import { getHeaderUserMenuLabels } from "./header-user-menu-i18n";

export function useHeaderUserMenuLabels() {
  const { locale, t } = useLocalization();
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const root = document.documentElement;
    const syncLanguage = () => setLanguage(root.lang || "en");
    syncLanguage();

    const observer = new MutationObserver(syncLanguage);
    observer.observe(root, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);

  const labels = getHeaderUserMenuLabels(locale || language);
  return Object.fromEntries(
    Object.entries(labels).map(([key, fallback]) => [key, t(`header.${key}`, fallback)]),
  ) as typeof labels;
}
