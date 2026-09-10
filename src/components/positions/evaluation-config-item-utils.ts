import type {
  GroupableEvaluationItem,
  SelectedEvaluationItem,
} from './evaluation-config-types';

function matchesEvaluationItemSearch(item: { name?: string; description?: string }, searchTerm: string) {
  const normalizedSearch = searchTerm.toLowerCase();

  return Boolean(
    item.name?.toLowerCase().includes(normalizedSearch) ||
    item.description?.toLowerCase().includes(normalizedSearch)
  );
}

export function getSelectableItemsInGroup<T extends GroupableEvaluationItem>(
  items: T[],
  assignedIds: Set<string>,
  groupId: string | 'ungrouped',
  searchTerm: string
) {
  const normalizedSearch = searchTerm.toLowerCase();

  return items
    .filter(item => !assignedIds.has(item.id))
    .filter(item => (groupId === 'ungrouped' ? !item.groupId : item.groupId === groupId))
    .filter(item => matchesEvaluationItemSearch(item, normalizedSearch));
}

export function filterUnassignedEvaluationItems<T extends GroupableEvaluationItem>(
  items: T[],
  assignedIds: Iterable<string>,
  searchTerm: string
) {
  const assignedIdSet = new Set(assignedIds);

  return items.filter(item => (
    !assignedIdSet.has(item.id) &&
    matchesEvaluationItemSearch(item, searchTerm)
  ));
}

export function filterAssignedEvaluationItems<TAssignment, TItem extends GroupableEvaluationItem>(
  assignments: TAssignment[],
  getItem: (assignment: TAssignment) => TItem,
  searchTerm: string
) {
  return assignments.filter(assignment => matchesEvaluationItemSearch(getItem(assignment), searchTerm));
}

export function toggleSelectedItemsForGroup<T extends SelectedEvaluationItem>(
  selectedItems: SelectedEvaluationItem[],
  groupItems: T[]
) {
  if (groupItems.length === 0) {
    return selectedItems;
  }

  const selectedIds = new Set(selectedItems.map(item => item.id));
  const allSelected = groupItems.every(item => selectedIds.has(item.id));

  if (allSelected) {
    return selectedItems.filter(item => !groupItems.some(groupItem => groupItem.id === item.id));
  }

  const toAdd = groupItems
    .filter(item => !selectedIds.has(item.id))
    .map(item => ({ id: item.id, name: item.name }));

  return toAdd.length > 0 ? [...selectedItems, ...toAdd] : selectedItems;
}
