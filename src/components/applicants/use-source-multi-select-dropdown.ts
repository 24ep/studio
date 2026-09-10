import { useMemo, useState } from 'react';

import type { ApplicantSource } from '@/lib/types';
import {
  filterAvailableSources,
  getNextSourceSelection,
  SOURCE_SELECT_ALL_ID,
  SOURCE_UNASSIGNED_ID,
} from './source-multi-select-utils';

interface UseSourceMultiSelectDropdownInput {
  availableSources: ApplicantSource[];
  onSelectionChange: (selectedIds: Set<string>) => void;
  selectedSourceIds: Set<string>;
}

export function useSourceMultiSelectDropdown({
  availableSources,
  onSelectionChange,
  selectedSourceIds,
}: UseSourceMultiSelectDropdownInput) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const safeSelectedSourceIds = selectedSourceIds || new Set<string>();
  const safeAvailableSources = Array.isArray(availableSources) ? availableSources : [];

  const isUnassignedSelected = safeSelectedSourceIds.has(SOURCE_UNASSIGNED_ID);
  const isSelectAllSelected = safeSelectedSourceIds.has(SOURCE_SELECT_ALL_ID);
  const selectedSources = safeAvailableSources.filter((source) => safeSelectedSourceIds.has(source.id));
  const filteredSources = useMemo(() => (
    filterAvailableSources(safeAvailableSources, searchQuery)
  ), [safeAvailableSources, searchQuery]);

  return {
    filteredSources,
    isSelectAllSelected,
    isUnassignedSelected,
    open,
    safeAvailableSources,
    safeSelectedSourceIds,
    searchQuery,
    selectedSources,
    setOpen,
    setSearchQuery,
    handleClearAll() {
      onSelectionChange(new Set());
      setSearchQuery('');
    },
    handleRemove(sourceId: string) {
      const newSelection = new Set(safeSelectedSourceIds);
      newSelection.delete(sourceId);
      onSelectionChange(newSelection);
    },
    handleSelect(sourceId: string) {
      onSelectionChange(getNextSourceSelection({
        availableSources: safeAvailableSources,
        selectedSourceIds: safeSelectedSourceIds,
        sourceId,
      }));
    },
  };
}
