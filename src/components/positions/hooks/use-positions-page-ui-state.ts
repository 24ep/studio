import { useCallback, useMemo, useState } from 'react';
import type { Position } from '@/lib/types';
import {
  getNextPositionSortState,
  getPositionDrawerOpenChangeAction,
  sortPositions,
  type PositionSortDirection,
} from '../position-page-utils';

interface UsePositionsPageUiStateInput {
  positions: Position[];
  fetchPositions: (isSearch?: boolean, customPage?: number, signal?: AbortSignal) => Promise<void>;
}

export function usePositionsPageUiState({
  positions,
  fetchPositions,
}: UsePositionsPageUiStateInput) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isMobileFilterModalOpen, setIsMobileFilterModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<PositionSortDirection>('asc');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleSort = useCallback((column: string | null, direction?: PositionSortDirection) => {
    const nextSort = getNextPositionSortState(sortColumn, sortDirection, column, direction);
    setSortColumn(nextSort.sortColumn);
    setSortDirection(nextSort.sortDirection);
  }, [sortColumn, sortDirection]);

  const sortedPositions = useMemo(() => {
    return sortPositions(positions, sortColumn, sortDirection);
  }, [positions, sortColumn, sortDirection]);

  const handleNewDrawerOpenChange = useCallback((open: boolean) => {
    const action = getPositionDrawerOpenChangeAction(open);
    setIsNewDrawerOpen(action.isOpen);
    if (action.shouldClearSelection) {
      setSelectedPositionId(null);
    }
    if (action.shouldRefreshPositions) {
      fetchPositions(false);
    }
  }, [fetchPositions]);

  const handleEditDrawerOpenChange = useCallback((open: boolean) => {
    const action = getPositionDrawerOpenChangeAction(open);
    setIsEditDrawerOpen(action.isOpen);
    if (action.shouldClearSelection) {
      setEditingPositionId(null);
    }
    if (action.shouldRefreshPositions) {
      fetchPositions(false);
    }
  }, [fetchPositions]);

  return {
    isAddModalOpen,
    setIsAddModalOpen,
    isNewDrawerOpen,
    setIsNewDrawerOpen,
    selectedPositionId,
    setSelectedPositionId,
    isEditDrawerOpen,
    setIsEditDrawerOpen,
    editingPositionId,
    setEditingPositionId,
    positionToDelete,
    setPositionToDelete,
    isImportModalOpen,
    setIsImportModalOpen,
    isMobileFilterModalOpen,
    setIsMobileFilterModalOpen,
    sortColumn,
    sortDirection,
    openMenu,
    setOpenMenu,
    sortedPositions,
    handleSort,
    handleNewDrawerOpenChange,
    handleEditDrawerOpenChange,
  };
}
