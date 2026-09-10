import { useCallback, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-hot-toast';
import type { Position } from '@/lib/types';
import { safeAll, safeFetch } from '@/lib/safe-fetch';
import {
  applyMatchCriteriaToPositions,
  getPositionIds,
  getPositionSelectionState,
  removePositionsByIds,
  togglePositionIdSelection,
} from '../position-page-utils';

interface UsePositionBulkActionsProps {
  filteredPositions: Position[];
  setPositions: Dispatch<SetStateAction<Position[]>>;
  fetchRecruiterStats: () => Promise<void>;
}

export function usePositionBulkActions({
  filteredPositions,
  setPositions,
  fetchRecruiterStats,
}: UsePositionBulkActionsProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkMatchCriteriaModalOpen, setIsBulkMatchCriteriaModalOpen] = useState(false);

  const { allSelected } = useMemo(
    () => getPositionSelectionState(selectedIds, filteredPositions),
    [selectedIds, filteredPositions]
  );

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedIds(checked ? getPositionIds(filteredPositions) : []);
  }, [filteredPositions]);

  const handleRowSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => togglePositionIdSelection(prev, id, checked));
  }, []);

  const handleBulkDelete = useCallback(async () => {
    setShowBulkDeleteConfirm(false);
    try {
      const deletePromises = selectedIds.map(id =>
        safeFetch(`/api/positions/${id}`, { method: 'DELETE', timeoutMs: 8000 })
      );
      const results = await safeAll(deletePromises);

      const failedDeletions = results.filter(result => !result.ok);
      if (failedDeletions.length > 0) {
        console.warn('Some position deletions failed:', failedDeletions.map(result => result.error));
        throw new Error('Failed to delete some positions');
      }

      setPositions(prev => removePositionsByIds(prev, selectedIds));
      setSelectedIds([]);
      toast.success('Selected positions deleted successfully');
      await fetchRecruiterStats();
    } catch (error) {
      toast.error('Failed to delete some positions');
    }
  }, [fetchRecruiterStats, selectedIds, setPositions]);

  const handleBulkMatchCriteriaUpdate = useCallback(async (matchCriteria: string) => {
    const selectedCount = selectedIds.length;

    try {
      const response = await safeFetch('/api/positions/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_match_criteria',
          positionIds: selectedIds,
          matchCriteria,
        }),
        timeoutMs: 10000,
      });

      if (!response.ok) {
        throw new Error(response.error || 'Failed to update match criteria');
      }

      setPositions(prev => applyMatchCriteriaToPositions(prev, selectedIds, matchCriteria));
      setSelectedIds([]);
      toast.success(`Match criteria updated for ${selectedCount} position${selectedCount !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to update match criteria:', error);
      toast.error('Failed to update match criteria');
      throw error;
    }
  }, [selectedIds, setPositions]);

  return {
    selectedIds,
    setSelectedIds,
    showBulkDeleteConfirm,
    setShowBulkDeleteConfirm,
    isBulkMatchCriteriaModalOpen,
    setIsBulkMatchCriteriaModalOpen,
    allSelected,
    handleSelectAll,
    handleRowSelect,
    handleBulkDelete,
    handleBulkMatchCriteriaUpdate,
  };
}
