import type { ThemePreference } from './constants';

export type ThemePreferenceIconKey = 'sun' | 'moon' | 'system';

export interface ThemePreferenceOption {
  value: ThemePreference;
  label: string;
  icon: ThemePreferenceIconKey;
}

export const THEME_PREFERENCE_OPTIONS: ThemePreferenceOption[] = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'system' },
];

export const APP_NAME_HELP_TEXT = 'This name will be displayed in the header, browser tab, and other locations';

export const THEME_PREFERENCE_HELP_TEXT = 'Users can still override this setting in their personal preferences';

export const GENERATIVE_AI_CANVAS_HELP_TEXT =
  'Enable canvas mode with WYSIWYG editor and chart generation (BI) features';

export function getThemePreferenceOption(value: ThemePreference) {
  return THEME_PREFERENCE_OPTIONS.find(option => option.value === value) ?? null;
}
