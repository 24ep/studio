"use client";

import { useCallback } from "react";

import { saveUserPreferenceModel } from "@/hooks/user-preferences-api";
import { useLocalization } from '@/contexts/LocalizationContext';

export type HeaderLocale = "en-US" | "th-TH";

export function useHeaderLocale() {
  const localization = useLocalization();
  const currentLocale: HeaderLocale = localization.locale.toLowerCase().startsWith('th') ? 'th-TH' : 'en-US';

  const changeLocale = useCallback((locale: HeaderLocale) => {
    localization.setLocale(locale === "th-TH" ? "th" : "en");
    void saveUserPreferenceModel("accessibility", { locale });
  }, [localization]);

  return { currentLocale, changeLocale };
}
