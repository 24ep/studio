import { describe, expect, it } from 'vitest';
import {
  APP_NAME_HELP_TEXT,
  GENERATIVE_AI_CANVAS_HELP_TEXT,
  THEME_PREFERENCE_HELP_TEXT,
  THEME_PREFERENCE_OPTIONS,
  getThemePreferenceOption,
} from './general-tab-utils';

describe('general-tab-utils', () => {
  it('defines stable theme preference options', () => {
    expect(THEME_PREFERENCE_OPTIONS).toEqual([
      { value: 'light', label: 'Light', icon: 'sun' },
      { value: 'dark', label: 'Dark', icon: 'moon' },
      { value: 'system', label: 'System', icon: 'system' },
    ]);
  });

  it('finds theme options by value', () => {
    expect(getThemePreferenceOption('dark')).toEqual({
      value: 'dark',
      label: 'Dark',
      icon: 'moon',
    });
  });

  it('keeps general tab helper copy centralized', () => {
    expect(APP_NAME_HELP_TEXT).toContain('header');
    expect(THEME_PREFERENCE_HELP_TEXT).toContain('personal preferences');
    expect(GENERATIVE_AI_CANVAS_HELP_TEXT).toContain('WYSIWYG');
  });
});
