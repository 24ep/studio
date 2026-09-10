import { describe, expect, it } from 'vitest';

import type { ApplicantSource } from '@/lib/types';
import {
  filterAvailableSources,
  getNextSourceSelection,
  SOURCE_SELECT_ALL_ID,
  SOURCE_UNASSIGNED_ID,
} from './source-multi-select-utils';

const sources = [
  {
    id: 'source-1',
    name: 'LinkedIn',
    description: 'Social',
    allowSubSource: false,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'source-2',
    name: 'Referral',
    description: 'Employee',
    allowSubSource: false,
    sortOrder: 2,
    isActive: true,
  },
] satisfies ApplicantSource[];

describe('source multi select utilities', () => {
  it('selects all sources and unassigned when select all is toggled on', () => {
    const selection = getNextSourceSelection({
      availableSources: sources,
      selectedSourceIds: new Set(),
      sourceId: SOURCE_SELECT_ALL_ID,
    });

    expect(Array.from(selection)).toEqual([
      SOURCE_SELECT_ALL_ID,
      'source-1',
      'source-2',
      SOURCE_UNASSIGNED_ID,
    ]);
  });

  it('removes select all when an individual selected source is deselected', () => {
    const selection = getNextSourceSelection({
      availableSources: sources,
      selectedSourceIds: new Set([SOURCE_SELECT_ALL_ID, 'source-1', 'source-2', SOURCE_UNASSIGNED_ID]),
      sourceId: 'source-1',
    });

    expect(selection.has(SOURCE_SELECT_ALL_ID)).toBe(false);
    expect(selection.has('source-1')).toBe(false);
    expect(selection.has('source-2')).toBe(true);
  });

  it('filters by source name or description', () => {
    expect(filterAvailableSources(sources, 'employee').map((source) => source.id)).toEqual(['source-2']);
    expect(filterAvailableSources(sources, 'link').map((source) => source.id)).toEqual(['source-1']);
  });
});
