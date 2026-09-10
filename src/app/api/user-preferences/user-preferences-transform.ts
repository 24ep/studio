import { createDefaultUserPreferences } from './user-preferences-defaults';
import {
  applyApplicantPreference,
  applyAppearancePreference,
  applyPositionsPreference,
  applySidebarPreference,
  applyTaskBoardPreference,
} from './user-preferences-appliers';
import type { UserPreferenceRow } from './user-preferences-route-types';

export function transformUserPreferenceRows(rows: UserPreferenceRow[]) {
  const preferences = createDefaultUserPreferences();

  rows.forEach((pref) => {
    const value = pref.uiPreference;

    if (pref.modelType === 'taskBoard') {
      applyTaskBoardPreference(preferences, pref.attributeKey, value);
    } else if (pref.modelType === 'positions') {
      applyPositionsPreference(preferences, pref.attributeKey, value);
    } else if (pref.modelType === 'appearance') {
      applyAppearancePreference(preferences, pref.attributeKey, value);
    } else if (pref.modelType === 'Applicants') {
      applyApplicantPreference(preferences, pref.attributeKey, value);
    } else if (pref.modelType === 'sidebar') {
      applySidebarPreference(preferences, pref.attributeKey, value);
    } else if (pref.modelType === 'accessibility') {
      const accessibility = preferences.accessibility as Record<string, unknown>;
      if (pref.attributeKey === 'textScale') accessibility.textScale = Number(value) || 100;
      if (pref.attributeKey === 'increasedContrast') accessibility.increasedContrast = value === 'true';
      if (pref.attributeKey === 'reducedMotion') accessibility.reducedMotion = value === 'true';
      if (pref.attributeKey === 'underlineLinks') accessibility.underlineLinks = value === 'true';
      if (pref.attributeKey === 'locale' && typeof value === 'string' && value.trim()) accessibility.locale = value.trim();
      if (pref.attributeKey === 'keyboardShortcuts') accessibility.keyboardShortcuts = value !== 'false';
    }
  });

  return preferences;
}
