import { describe, expect, it } from 'vitest';

import { getImportableAppKitFeatureIds, summarizeAppKitRecords } from './appkit-setup-preview';

describe('summarizeAppKitRecords', () => {
  it('returns safe display fields and limits the preview sample', () => {
    const records = Array.from({ length: 7 }, (_, index) => ({
      name: `Stage ${index + 1}`,
      description: `Description ${index + 1}`,
      apiKey: `secret-${index + 1}`,
    }));

    expect(summarizeAppKitRecords('recruitment-stages', records)).toEqual({
      featureId: 'recruitment-stages',
      count: 7,
      items: Array.from({ length: 5 }, (_, index) => ({
        label: `Stage ${index + 1}`,
        detail: `Description ${index + 1}`,
      })),
    });
  });
});

describe('getImportableAppKitFeatureIds', () => {
  it('only returns preview groups that actually contain records', () => {
    expect(getImportableAppKitFeatureIds([
      { featureId: 'recruitment-stages', count: 7, items: [] },
      { featureId: 'applicant-sources', count: 0, items: [] },
      { featureId: 'grades', count: 14, items: [] },
    ])).toEqual(['recruitment-stages', 'grades']);
  });

  it('returns an empty list when AppKit has no importable records', () => {
    expect(getImportableAppKitFeatureIds([
      { featureId: 'applicant-sources', count: 0, items: [] },
      { featureId: 'headcount-types', count: 0, items: [] },
    ])).toEqual([]);
  });
});
