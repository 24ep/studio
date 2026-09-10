"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalization } from '@/contexts/LocalizationContext';

export function AccessibilityPreferenceInitializer() {
  const { status } = useSession();
  const localization = useLocalization();
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/user-preferences').then(response => response.ok ? response.json() : null).then(data => {
      if (!data?.accessibility) return;
      const preferences = data.accessibility;
      const root = document.documentElement;
      root.style.setProperty('--accessibility-text-scale', `${(Number(preferences.textScale) || 100) / 100}`);
      root.classList.toggle('a11y-contrast', Boolean(preferences.increasedContrast));
      root.classList.toggle('a11y-reduced-motion', Boolean(preferences.reducedMotion));
      root.classList.toggle('a11y-underline-links', Boolean(preferences.underlineLinks));
      root.dataset.keyboardShortcuts = preferences.keyboardShortcuts === false ? 'false' : 'true';
      localization.setLocale(String(preferences.locale || 'en-US'));
    }).catch(() => undefined);
  }, [localization, status]);
  return null;
}
