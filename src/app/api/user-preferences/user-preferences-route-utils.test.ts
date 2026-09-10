import { describe, expect, it } from 'vitest';
import {
  buildUserPreferenceUpserts,
  createDefaultUserPreferences,
  isValidUserPreferenceModelType,
  normalizeUserPreferenceModelType,
  parseJsonArray,
  transformUserPreferenceRows,
} from './user-preferences-route-utils';

describe('user-preferences-route-utils', () => {
  it('validates and normalizes model types', () => {
    expect(isValidUserPreferenceModelType('applicants')).toBe(true);
    expect(isValidUserPreferenceModelType('unknown')).toBe(false);
    expect(normalizeUserPreferenceModelType('applicants')).toBe('Applicants');
  });

  it('parses JSON arrays with fallback copies', () => {
    const fallback = ['name'];
    const parsedFallback = parseJsonArray('bad json', fallback);

    expect(parseJsonArray('["email"]', fallback)).toEqual(['email']);
    expect(parsedFallback).toEqual(['name']);
    expect(parsedFallback).not.toBe(fallback);
  });

  it('transforms rows over default preferences', () => {
    const preferences = transformUserPreferenceRows([
      { modelType: 'taskBoard', attributeKey: 'viewMode', uiPreference: 'table' },
      { modelType: 'positions', attributeKey: 'pageSize', uiPreference: '50' },
      { modelType: 'appearance', attributeKey: 'themePreference', uiPreference: 'dark' },
      { modelType: 'Applicants', attributeKey: 'sortDirection', uiPreference: 'null' },
      { modelType: 'sidebar', attributeKey: 'showAssignedPositions', uiPreference: 'false' },
      { modelType: 'sidebar', attributeKey: 'mainSidebarPinned', uiPreference: 'false' },
      { modelType: 'accessibility', attributeKey: 'locale', uiPreference: 'th-TH' },
      { modelType: 'accessibility', attributeKey: 'keyboardShortcuts', uiPreference: 'false' },
    ]);

    expect(preferences.taskBoard.viewMode).toBe('table');
    expect(preferences.positions.pageSize).toBe(50);
    expect(preferences.appearance.themePreference).toBe('dark');
    expect(preferences.applicants.sortDirection).toBeNull();
    expect(preferences.sidebar.showAssignedPositions).toBe(false);
    expect(preferences.sidebar.mainSidebarPinned).toBe(false);
    expect(preferences.accessibility.locale).toBe('th-TH');
    expect(preferences.accessibility.keyboardShortcuts).toBe(false);
  });

  it('builds upsert inputs with serialized values', () => {
    const upserts = buildUserPreferenceUpserts('user-1', 'applicants', {
      pageSize: 25,
      columnOrder: ['name'],
      selectedRecruiterId: null,
    });

    expect(upserts).toEqual([
      expect.objectContaining({ modelType: 'Applicants', attributeKey: 'pageSize', uiPreference: '25' }),
      expect.objectContaining({ modelType: 'Applicants', attributeKey: 'columnOrder', uiPreference: '["name"]' }),
      expect.objectContaining({ modelType: 'Applicants', attributeKey: 'selectedRecruiterId', uiPreference: 'null' }),
    ]);
  });

  it('returns fresh default arrays', () => {
    const first = createDefaultUserPreferences();
    const second = createDefaultUserPreferences();

    expect(first.taskBoard.visibleCardFields).toEqual(second.taskBoard.visibleCardFields);
    expect(first.taskBoard.visibleCardFields).not.toBe(second.taskBoard.visibleCardFields);
  });
});
