"use client";

import { useCallback, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';

import type { Position } from '@/lib/types';

import type { usePositionReferenceData } from './use-position-reference-data';
import type { usePositionsPageFilters } from './use-positions-page-filters';
import type { usePositionsPageUiState } from './use-positions-page-ui-state';

type PositionsPageActionsOptions = {
  fetchPositions: () => void;
  filters: ReturnType<typeof usePositionsPageFilters>;
  referenceData: Pick<ReturnType<typeof usePositionReferenceData>, 'fetchRecruiterStats'>;
  uiState: Pick<
    ReturnType<typeof usePositionsPageUiState>,
    | 'setPositionToDelete'
  >;
};

export function usePositionsPageActions({
  fetchPositions,
  filters,
  referenceData,
  uiState,
}: PositionsPageActionsOptions) {
  const router = useRouter();

  const openPosition = useCallback((positionId: string) => {
    router.push(`/positions/${positionId}`);
  }, [router]);

  const editPosition = useCallback((positionId: string) => {
    router.push(`/positions/${positionId}?edit=true`);
  }, [router]);

  const handleMobileEditClick = useCallback((positionId: string, event: MouseEvent) => {
    event.stopPropagation();
    editPosition(positionId);
  }, [editPosition]);

  const handleMobileDeleteClick = useCallback((position: Position, event: MouseEvent) => {
    event.stopPropagation();
    uiState.setPositionToDelete(position);
  }, [uiState]);

  const handleImportSuccess = useCallback(() => {
    fetchPositions();
    referenceData.fetchRecruiterStats();
  }, [fetchPositions, referenceData]);

  const handlePageChange = useCallback((newPage: number) => {
    filters.setPage(newPage);
    filters.updateURL(newPage);
  }, [filters]);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    filters.setPageSize(newPageSize);
    filters.setPage(1);
    filters.updateURL(1, newPageSize);
  }, [filters]);

  return {
    editPosition,
    handleImportSuccess,
    handleMobileDeleteClick,
    handleMobileEditClick,
    handlePageChange,
    handlePageSizeChange,
    openPosition,
  };
}
