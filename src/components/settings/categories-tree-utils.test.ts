import { describe, expect, it } from 'vitest';
import {
  buildCategoryTreeSortableStyle,
  buildCategoryItemFormState,
  buildCategoryItemPayload,
  buildCategoryTree,
  getCategoryItemsForCategory,
  getCategoryItemCategoryId,
  getCategoryTreeCategoryContainerClassName,
  getCategoryTreeConnectorHeight,
  getCategoryTreeDropdownZIndex,
  getCategoryTreeItemContainerClassName,
  hasCategoryTreeItems,
  shouldShowCategoryItemRemoveAction,
  shouldShowCategoryTreeHorizontalConnector,
  shouldShowCategoryTreeLastConnector,
  shouldShowCategoryTreeVerticalConnector,
} from './categories-tree-utils';
import type { Category, CategoryItem } from './CategoriesTreeParts';

const makeCategory = (id: string, sortOrder: number, parentId?: string): Category => ({
  id,
  name: id,
  sortOrder,
  parentId,
  isActive: true,
});

const makeItem = (id: string, categoryId?: string, groupId?: string): CategoryItem => ({
  id,
  name: id,
  sortOrder: 1,
  categoryId,
  groupId,
});

describe('categories-tree-utils', () => {
  it('uses categoryId before groupId when resolving an item category', () => {
    expect(getCategoryItemCategoryId(makeItem('item', 'category', 'group'))).toBe('category');
    expect(getCategoryItemCategoryId(makeItem('item', undefined, 'group'))).toBe('group');
  });

  it('filters category items by categoryId or groupId fallback', () => {
    const items = [
      makeItem('direct', 'category'),
      makeItem('fallback', undefined, 'category'),
      makeItem('other', 'other'),
    ];

    expect(getCategoryItemsForCategory(items, 'category').map(item => item.id)).toEqual(['direct', 'fallback']);
  });

  it('builds sortable styles with optional transition values', () => {
    expect(buildCategoryTreeSortableStyle('translate3d(0, 8px, 0)', 'transform 200ms ease')).toEqual({
      transform: 'translate3d(0, 8px, 0)',
      transition: 'transform 200ms ease',
    });
    expect(buildCategoryTreeSortableStyle(undefined, null)).toEqual({
      transform: undefined,
      transition: undefined,
    });
  });

  it('builds stable container classes for category and item drag states', () => {
    expect(getCategoryTreeCategoryContainerClassName(false)).toBe('transition-all duration-200');
    expect(getCategoryTreeCategoryContainerClassName(true)).toBe('transition-all duration-200 opacity-50');
    expect(getCategoryTreeItemContainerClassName(false)).toBe('ml-6');
    expect(getCategoryTreeItemContainerClassName(true)).toBe('opacity-50 ml-6');
  });

  it('derives tree menu stacking and item presence', () => {
    expect(getCategoryTreeDropdownZIndex(100)).toBe(110);
    expect(hasCategoryTreeItems([])).toBe(false);
    expect(hasCategoryTreeItems([makeItem('item', 'category')])).toBe(true);
  });

  it('only shows remove action for items in the selected concrete category', () => {
    const item = makeItem('item', 'category');

    expect(shouldShowCategoryItemRemoveAction(item, 'category')).toBe(true);
    expect(shouldShowCategoryItemRemoveAction(item, 'other')).toBe(false);
    expect(shouldShowCategoryItemRemoveAction(item, 'all')).toBe(false);
  });

  it('derives connector geometry for category item rows', () => {
    expect(getCategoryTreeConnectorHeight(3)).toBe('60px');
    expect(shouldShowCategoryTreeVerticalConnector(1)).toBe(false);
    expect(shouldShowCategoryTreeVerticalConnector(2)).toBe(true);
    expect(shouldShowCategoryTreeHorizontalConnector(0, 2)).toBe(true);
    expect(shouldShowCategoryTreeHorizontalConnector(1, 2)).toBe(false);
    expect(shouldShowCategoryTreeLastConnector(0, 2)).toBe(false);
    expect(shouldShowCategoryTreeLastConnector(1, 2)).toBe(true);
  });

  it('builds sorted root categories and attaches items by categoryId or groupId', () => {
    const tree = buildCategoryTree(
      [makeCategory('later', 2), makeCategory('child', 1, 'later'), makeCategory('first', 1)],
      [makeItem('one', 'first'), makeItem('two', undefined, 'later'), makeItem('orphan', 'missing')]
    );

    expect(tree.map(category => category.id)).toEqual(['first', 'later']);
    expect(tree[0].items?.map(item => item.id)).toEqual(['one']);
    expect(tree[1].items?.map(item => item.id)).toEqual(['two']);
  });

  it('converts none category values to null for API payloads', () => {
    expect(buildCategoryItemPayload({ name: 'Skill', categoryId: 'none', groupId: 'group' })).toEqual({
      name: 'Skill',
      categoryId: null,
      groupId: 'group',
    });
  });

  it('builds item form state with none defaults', () => {
    expect(buildCategoryItemFormState()).toEqual({ name: '', categoryId: 'none', groupId: 'none' });
    expect(buildCategoryItemFormState({ name: 'Skill', categoryId: 'cat' })).toEqual({
      name: 'Skill',
      categoryId: 'cat',
      groupId: 'none',
    });
  });
});
