import { describe, expect, it } from 'vitest';

import {
  DEFAULT_APPLICANT_SETTINGS,
  getApplicantSettingsColumn,
  getApplicantSettingsSaveErrorMessage,
  mergeApplicantSettings,
  reorderApplicantSettingsColumns,
  shouldShowApplicantSettingsColumn,
} from './applicant-settings-drawer-utils';

describe('applicant settings drawer utilities', () => {
  it('merges incoming settings with defaults and previous local state', () => {
    expect(mergeApplicantSettings({ pageSize: 50 }).pageSize).toBe(50);
    expect(mergeApplicantSettings({ showPinSection: true }, { pageSize: 40 })).toMatchObject({
      pageSize: 40,
      showPinSection: true,
      sortColumn: 'applicationDate',
    });
  });

  it('looks up and filters table column settings', () => {
    expect(getApplicantSettingsColumn('applicant')).toMatchObject({
      label: 'Applicant Name',
      settingKey: 'showApplicantColumn',
    });
    expect(getApplicantSettingsColumn('missing')).toBeNull();
    expect(shouldShowApplicantSettingsColumn('jobMatches', false)).toBe(false);
    expect(shouldShowApplicantSettingsColumn('jobMatches', true)).toBe(true);
    expect(shouldShowApplicantSettingsColumn('fitScore', false)).toBe(true);
  });

  it('reorders columns without mutating the original order', () => {
    const original = ['applicant', 'fitScore', 'status'];

    expect(
      reorderApplicantSettingsColumns({
        columnOrder: original,
        sourceIndex: 0,
        destinationIndex: 2,
      })
    ).toEqual(['fitScore', 'status', 'applicant']);
    expect(original).toEqual(['applicant', 'fitScore', 'status']);
    expect(
      reorderApplicantSettingsColumns({
        columnOrder: original,
        sourceIndex: 0,
        destinationIndex: null,
      })
    ).toEqual(original);
    expect(
      reorderApplicantSettingsColumns({
        columnOrder: original,
        sourceIndex: 99,
        destinationIndex: 0,
      })
    ).toEqual(original);
  });

  it('normalizes save errors for display', () => {
    expect(getApplicantSettingsSaveErrorMessage(new Error('bad'))).toBe('bad');
    expect(getApplicantSettingsSaveErrorMessage('bad')).toBe('Failed to save settings');
    expect(DEFAULT_APPLICANT_SETTINGS.columnOrder).toContain('applicant');
  });
});
