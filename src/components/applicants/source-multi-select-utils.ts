import type { ApplicantSource } from '@/lib/types';

export const SOURCE_SELECT_ALL_ID = 'select-all';
export const SOURCE_UNASSIGNED_ID = 'unassigned';

export function getNextSourceSelection({
  availableSources,
  selectedSourceIds,
  sourceId,
}: {
  availableSources: ApplicantSource[];
  selectedSourceIds: Set<string>;
  sourceId: string;
}) {
  const newSelection = new Set(selectedSourceIds);

  if (sourceId === SOURCE_SELECT_ALL_ID) {
    if (newSelection.has(SOURCE_SELECT_ALL_ID)) {
      newSelection.clear();
      return newSelection;
    }

    return getAllSourceSelection(availableSources);
  }

  if (newSelection.has(sourceId)) {
    newSelection.delete(sourceId);
    newSelection.delete(SOURCE_SELECT_ALL_ID);
    return newSelection;
  }

  newSelection.add(sourceId);
  const allSourcesSelected = availableSources.every((source) => newSelection.has(source.id))
    && newSelection.has(SOURCE_UNASSIGNED_ID);

  return allSourcesSelected ? getAllSourceSelection(availableSources) : newSelection;
}

export function filterAvailableSources(availableSources: ApplicantSource[], searchQuery: string) {
  if (!searchQuery.trim()) {
    return availableSources;
  }

  const query = searchQuery.toLowerCase();
  return availableSources.filter((source) =>
    source.name.toLowerCase().includes(query) ||
    Boolean(source.description?.toLowerCase().includes(query)),
  );
}

function getAllSourceSelection(availableSources: ApplicantSource[]) {
  const selection = new Set<string>([SOURCE_SELECT_ALL_ID]);
  availableSources.forEach((source) => selection.add(source.id));
  selection.add(SOURCE_UNASSIGNED_ID);
  return selection;
}
