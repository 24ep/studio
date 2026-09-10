import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-hot-toast';
import type { Position } from '@/lib/types';
import { safeFetch } from '@/lib/safe-fetch';
import type { AddPositionFormValues } from '@/components/positions/AddPositionModal';
import { removePositionsByIds } from '../position-page-utils';

interface UsePositionCrudActionsProps {
  positionToDelete: Position | null;
  setPositionToDelete: Dispatch<SetStateAction<Position | null>>;
  setPositions: Dispatch<SetStateAction<Position[]>>;
  setIsAddModalOpen: Dispatch<SetStateAction<boolean>>;
  fetchAllDepartments: () => Promise<void>;
  fetchRecruiterStats: () => Promise<void>;
}

export function usePositionCrudActions({
  positionToDelete,
  setPositionToDelete,
  setPositions,
  setIsAddModalOpen,
  fetchAllDepartments,
  fetchRecruiterStats,
}: UsePositionCrudActionsProps) {
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddPosition = useCallback(async (formData: AddPositionFormValues) => {
    try {
      const result = await safeFetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        timeoutMs: 10000,
      });

      if (!result.ok) {
        console.warn('Skipping failed endpoint /api/positions (POST):', result.error || result.status);
        throw new Error(`Failed to add position: ${result.error}`);
      }

      const newPosition = result.data as Position;
      setPositions(prev => [...prev, newPosition]);
      setIsAddModalOpen(false);
      toast.success('Position added successfully');

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(() => {
        fetchAllDepartments();
        fetchRecruiterStats();
      }, 500);
    } catch {
      toast.error('Failed to add position');
    }
  }, [fetchAllDepartments, fetchRecruiterStats, setIsAddModalOpen, setPositions]);

  const handleDeletePosition = useCallback(async () => {
    if (!positionToDelete) return;

    try {
      const result = await safeFetch(`/api/positions/${positionToDelete.id}`, {
        method: 'DELETE',
        timeoutMs: 8000,
      });

      if (!result.ok) {
        console.warn('Skipping failed endpoint /api/positions/[id] (DELETE):', result.error || result.status);
        throw new Error(`Failed to delete position: ${result.error}`);
      }

      setPositions(prev => removePositionsByIds(prev, [positionToDelete.id]));
      setPositionToDelete(null);
      toast.success('Position deleted successfully');
      fetchRecruiterStats();
    } catch {
      toast.error('Failed to delete position');
    }
  }, [fetchRecruiterStats, positionToDelete, setPositionToDelete, setPositions]);

  const handleExportPositions = useCallback(async () => {
    try {
      const result = await safeFetch('/api/positions/export', {
        method: 'GET',
        timeoutMs: 15000,
      });

      if (!result.ok) {
        console.warn('Skipping failed endpoint /api/positions/export:', result.error || result.status);
        throw new Error(`Failed to export positions: ${result.error}`);
      }

      const blob = new Blob([result.data as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'positions-export.xlsx';
      document.body.appendChild(anchor);
      anchor.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);

      toast.success('Positions exported successfully as Excel file');
    } catch {
      toast.error('Failed to export positions');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    handleAddPosition,
    handleDeletePosition,
    handleExportPositions,
  };
}
