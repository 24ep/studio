export interface BaseItemFormState {
  name: string;
  description: string;
  groupId: string;
  iconUrl: string;
  maxScore?: number;
  skillType?: string;
}

type GroupedItem = {
  id: string;
  groupId?: string | null;
};

type SelectedGroup = {
  id: string;
} | null;

export function buildBaseItemFormState(
  showSkillFields: boolean,
  overrides: Partial<BaseItemFormState> = {}
): BaseItemFormState {
  const { maxScore, skillType, ...baseOverrides } = overrides;
  const skillOverrides = showSkillFields
    ? {
      maxScore: maxScore ?? 100,
      skillType: skillType ?? 'hard_skill',
    }
    : {};

  return {
    name: '',
    description: '',
    groupId: 'none',
    iconUrl: '',
    ...skillOverrides,
    ...baseOverrides,
  };
}

export function buildBaseItemPayload(formData: BaseItemFormState) {
  return {
    ...formData,
    groupId: formData.groupId === 'none' ? null : formData.groupId,
  };
}

export function getBaseItemGroupCopy(itemTitle: string) {
  const lowerTitle = itemTitle.toLowerCase();
  const groupLabel = lowerTitle.includes('skill') || lowerTitle.includes('trait')
    ? 'Category'
    : 'Group';

  return {
    groupLabel,
    noGroupLabel: groupLabel === 'Category' ? 'No Category' : 'No Group',
    groupPlaceholder: groupLabel === 'Category' ? 'Select a category (optional)' : 'Select a group',
  };
}

export function parseBaseItemMaxScore(value: string) {
  return parseInt(value, 10) || 100;
}

export function getItemsForSelectedGroup<T extends GroupedItem>(
  items: T[],
  selectedGroupId: string
) {
  return selectedGroupId === 'all'
    ? items
    : items.filter(item => item.groupId === selectedGroupId);
}

export function getAvailableItemsForGroup<T extends GroupedItem>(
  items: T[],
  selectedGroupId: string
) {
  return selectedGroupId === 'all'
    ? []
    : items.filter(item => item.groupId !== selectedGroupId);
}

export function getItemsForGroupDetails<T extends GroupedItem>(
  items: T[],
  selectedGroup: SelectedGroup
) {
  return selectedGroup ? getItemsForSelectedGroup(items, selectedGroup.id) : [];
}

export function buildSortOrderUpdates<T extends { id: string }>(items: T[]) {
  return items.map((item, index) => ({
    id: item.id,
    sortOrder: index,
  }));
}

export function applySortedItemOrder<T extends { id: string; sortOrder: number }>(
  allItems: T[],
  reorderedItems: T[]
) {
  const sortOrderById = new Map(buildSortOrderUpdates(reorderedItems).map(update => [update.id, update.sortOrder]));

  return allItems.map(item => (
    sortOrderById.has(item.id)
      ? { ...item, sortOrder: sortOrderById.get(item.id)! }
      : item
  ));
}
