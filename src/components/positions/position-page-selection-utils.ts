import type { Position } from '@/lib/types';

export function getPositionSelectionState(selectedIds: string[], positions: Array<Pick<Position, 'id'>>) {
  const visibleIds = positions.map(position => position.id);
  const selectedSet = new Set(selectedIds);
  const selectedVisibleCount = visibleIds.filter(id => selectedSet.has(id)).length;
  const allSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;

  return {
    allSelected,
    someSelected: selectedVisibleCount > 0 && !allSelected,
  };
}

export function getPositionIds(positions: Array<Pick<Position, 'id'>>) {
  return positions.map(position => position.id);
}

export function togglePositionIdSelection(selectedIds: string[], id: string, checked: boolean) {
  if (!checked) return selectedIds.filter(selectedId => selectedId !== id);
  if (selectedIds.includes(id)) return selectedIds;

  return [...selectedIds, id];
}

export function removePositionsByIds(positions: Position[], idsToRemove: string[]) {
  const ids = new Set(idsToRemove);
  return positions.filter(position => !ids.has(position.id));
}

export function applyMatchCriteriaToPositions(
  positions: Position[],
  selectedIds: string[],
  matchCriteria: string
) {
  const ids = new Set(selectedIds);

  return positions.map(position => (
    ids.has(position.id)
      ? { ...position, matchCriteria }
      : position
  ));
}
