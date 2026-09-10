import { beforeEach, describe, expect, it } from 'vitest';

import {
  cleanupOldTrackers,
  clearChangeTrackersForTest,
  generateTrackedDataHash,
  getChangeTrackingStats,
  hasTrackedDataChanged,
  omitTrackedFields,
} from './data-change-tracker-store';

describe('data-change-tracker-store', () => {
  beforeEach(() => {
    clearChangeTrackersForTest();
  });

  it('hashes objects deterministically and omits ignored fields', () => {
    expect(generateTrackedDataHash({ b: 2, a: 1 })).toBe(generateTrackedDataHash({ a: 1, b: 2 }));
    expect(omitTrackedFields({ id: '1', updated_at: 'now' }, ['updated_at'])).toEqual({ id: '1' });
  });

  it('detects first snapshots, ignores unchanged data, and ignores configured fields', () => {
    expect(hasTrackedDataChanged('applicant-1', { id: '1', name: 'Ada' })).toBe(true);
    expect(hasTrackedDataChanged('applicant-1', { id: '1', name: 'Ada' })).toBe(false);
    expect(hasTrackedDataChanged('applicant-1', {
      id: '1',
      name: 'Ada',
      updated_at: 'later',
    }, {
      ignoreFields: ['updated_at'],
    })).toBe(false);
    expect(hasTrackedDataChanged('applicant-1', { id: '1', name: 'Grace' })).toBe(true);
  });

  it('reports and cleans tracker state', () => {
    hasTrackedDataChanged('dashboard', { total: 1 });

    expect(getChangeTrackingStats()).toMatchObject({
      totalTrackers: 1,
      trackers: [{ key: 'dashboard', hasSnapshot: true }],
    });
    expect(cleanupOldTrackers(0)).toBe(1);
    expect(getChangeTrackingStats().totalTrackers).toBe(0);
  });
});
