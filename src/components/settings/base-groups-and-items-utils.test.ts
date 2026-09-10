import { describe, expect, it } from 'vitest';

import {
  applySortedItemOrder,
  buildBaseItemFormState,
  buildBaseItemPayload,
  buildSortOrderUpdates,
  getBaseItemGroupCopy,
  getAvailableItemsForGroup,
  getItemsForGroupDetails,
  getItemsForSelectedGroup,
  parseBaseItemMaxScore,
} from './base-groups-and-items-utils';

describe('base groups and items utilities', () => {
  it('builds item form state with optional skill defaults', () => {
    expect(buildBaseItemFormState(false)).toEqual({
      name: '',
      description: '',
      groupId: 'none',
      iconUrl: '',
    });
    expect(buildBaseItemFormState(false, { maxScore: 50, skillType: 'test_score' })).not.toHaveProperty('maxScore');

    expect(buildBaseItemFormState(true, {
      name: 'React',
      groupId: 'group-1',
      skillType: 'test_score',
    })).toEqual({
      name: 'React',
      description: '',
      groupId: 'group-1',
      iconUrl: '',
      maxScore: 100,
      skillType: 'test_score',
    });
  });

  it('normalizes empty group selection for save payloads', () => {
    expect(buildBaseItemPayload(buildBaseItemFormState(false))).toEqual({
      name: '',
      description: '',
      groupId: null,
      iconUrl: '',
    });

    expect(buildBaseItemPayload(buildBaseItemFormState(false, { groupId: 'group-1' })).groupId).toBe('group-1');
  });

  it('derives item group copy from item titles', () => {
    expect(getBaseItemGroupCopy('Expertise Skills')).toEqual({
      groupLabel: 'Category',
      noGroupLabel: 'No Category',
      groupPlaceholder: 'Select a category (optional)',
    });
    expect(getBaseItemGroupCopy('Applicant Sources')).toEqual({
      groupLabel: 'Group',
      noGroupLabel: 'No Group',
      groupPlaceholder: 'Select a group',
    });
  });

  it('parses max score input with a stable fallback', () => {
    expect(parseBaseItemMaxScore('250')).toBe(250);
    expect(parseBaseItemMaxScore('')).toBe(100);
    expect(parseBaseItemMaxScore('invalid')).toBe(100);
  });

  it('selects filtered and available items by group', () => {
    const items = [
      { id: 'a', groupId: 'group-1' },
      { id: 'b', groupId: 'group-2' },
      { id: 'c', groupId: null },
    ];

    expect(getItemsForSelectedGroup(items, 'all')).toBe(items);
    expect(getItemsForSelectedGroup(items, 'group-1').map(item => item.id)).toEqual(['a']);
    expect(getAvailableItemsForGroup(items, 'all')).toEqual([]);
    expect(getAvailableItemsForGroup(items, 'group-1').map(item => item.id)).toEqual(['b', 'c']);
  });

  it('selects details items only when a group is active', () => {
    const items = [
      { id: 'a', groupId: 'group-1' },
      { id: 'b', groupId: 'group-2' },
    ];

    expect(getItemsForGroupDetails(items, null)).toEqual([]);
    expect(getItemsForGroupDetails(items, { id: 'group-2' }).map(item => item.id)).toEqual(['b']);
  });

  it('builds and applies sort-order updates', () => {
    const items = [
      { id: 'a', sortOrder: 0 },
      { id: 'b', sortOrder: 1 },
      { id: 'c', sortOrder: 2 },
    ];
    const reordered = [items[2], items[0]];

    expect(buildSortOrderUpdates(reordered)).toEqual([
      { id: 'c', sortOrder: 0 },
      { id: 'a', sortOrder: 1 },
    ]);
    expect(applySortedItemOrder(items, reordered)).toEqual([
      { id: 'a', sortOrder: 1 },
      { id: 'b', sortOrder: 1 },
      { id: 'c', sortOrder: 0 },
    ]);
  });
});
