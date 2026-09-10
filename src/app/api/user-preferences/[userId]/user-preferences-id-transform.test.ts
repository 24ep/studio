import { describe, expect, it } from 'vitest';

import {
  createDefaultLegacyUserPreferences,
  transformLegacyUserPreferenceRows,
} from './user-preferences-id-transform';

describe('legacy user preferences transform', () => {
  it('creates default legacy preferences', () => {
    expect(createDefaultLegacyUserPreferences()).toMatchObject({
      taskBoard: {
        searchTerm: '',
        selectedStages: [],
        viewMode: 'kanban',
      },
      positions: {
        pageSize: 20,
        sortOrder: 'desc',
      },
      appearance: {
        personalColor: '#3B82F6',
      },
      sidebar: {
        showAssignedPositions: false,
        mainSidebarPinned: true,
      },
    });
  });

  it('applies legacy preference rows with parser fallbacks', () => {
    const preferences = transformLegacyUserPreferenceRows([
      { modelType: 'taskBoard', attributeKey: 'searchTerm', uiPreference: 'ana' },
      { modelType: 'taskBoard', attributeKey: 'selectedStages', uiPreference: '["screening"]' },
      { modelType: 'taskBoard', attributeKey: 'viewMode', uiPreference: 'table' },
      { modelType: 'positions', attributeKey: 'selectedRecruiterId', uiPreference: 'null' },
      { modelType: 'positions', attributeKey: 'pageSize', uiPreference: 'bad' },
      { modelType: 'positions', attributeKey: 'sortOrder', uiPreference: 'asc' },
      { modelType: 'appearance', attributeKey: 'personalColor', uiPreference: '#111111' },
      { modelType: 'sidebar', attributeKey: 'showAssignedPositions', uiPreference: 'true' },
      { modelType: 'sidebar', attributeKey: 'mainSidebarPinned', uiPreference: 'false' },
      { modelType: 'unknown', attributeKey: 'ignored', uiPreference: 'value' },
    ]);

    expect(preferences.taskBoard.searchTerm).toBe('ana');
    expect(preferences.taskBoard.selectedStages).toEqual(['screening']);
    expect(preferences.taskBoard.viewMode).toBe('table');
    expect(preferences.positions.selectedRecruiterId).toBeNull();
    expect(preferences.positions.pageSize).toBe(20);
    expect(preferences.positions.sortOrder).toBe('asc');
    expect(preferences.appearance.personalColor).toBe('#111111');
    expect(preferences.sidebar.showAssignedPositions).toBe(true);
    expect(preferences.sidebar.mainSidebarPinned).toBe(false);
  });

  it('falls back for invalid arrays and enum-like values', () => {
    const preferences = transformLegacyUserPreferenceRows([
      { modelType: 'taskBoard', attributeKey: 'selectedStages', uiPreference: 'bad json' },
      { modelType: 'taskBoard', attributeKey: 'viewMode', uiPreference: 'grid' },
      { modelType: 'positions', attributeKey: 'sortOrder', uiPreference: 'up' },
    ]);

    expect(preferences.taskBoard.selectedStages).toEqual([]);
    expect(preferences.taskBoard.viewMode).toBe('kanban');
    expect(preferences.positions.sortOrder).toBe('desc');
  });
});
