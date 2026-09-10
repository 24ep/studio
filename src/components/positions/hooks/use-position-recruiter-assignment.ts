import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { toast } from 'react-hot-toast';
import type { Position } from '@/lib/types';
import { safeFetch } from '@/lib/safe-fetch';
import {
  applyAssignedPositionResponse,
  applyOptimisticRecruiterAssignment,
  getAssignedPositionFromResponse,
  getRecruiterAssignmentSuccessMessage,
  getRecruiterNameById,
  getRecruiterSyncApplicantCount,
  type PositionRecruiterOption,
} from '../position-page-utils';

interface UsePositionRecruiterAssignmentProps {
  positions: Position[];
  availableRecruiter: PositionRecruiterOption[];
  setPositions: Dispatch<SetStateAction<Position[]>>;
  fetchRecruiterStats: () => Promise<void>;
}

export function usePositionRecruiterAssignment({
  positions,
  availableRecruiter,
  setPositions,
  fetchRecruiterStats,
}: UsePositionRecruiterAssignmentProps) {
  const [assigningRecruiter, setAssigningRecruiter] = useState<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetAssigningRecruiter = useCallback(() => {
    setAssigningRecruiter(null);
  }, []);

  const handleAssignRecruiterToPosition = useCallback(async (positionId: string, recruiterId: string | null) => {
    if (assigningRecruiter === positionId) {
      return;
    }

    setAssigningRecruiter(positionId);

    const prevPositions = [...positions];
    const recruiterName = getRecruiterNameById(availableRecruiter, recruiterId);

    setPositions(prev => applyOptimisticRecruiterAssignment(prev, positionId, recruiterId, recruiterName));

    try {
      const result = await safeFetch(`/api/positions/${positionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recruiterId }),
        credentials: 'include',
        timeoutMs: 8000,
      });

      if (!result.ok) {
        console.warn('Skipping failed endpoint /api/positions/[id] (PUT):', result.error || result.status);
        throw new Error(`Failed to update recruiter assignment: ${result.error}`);
      }

      const responseData = result.data;
      const updatedPosition = getAssignedPositionFromResponse(responseData);

      if (!updatedPosition) {
        setPositions(prevPositions);
        throw new Error('Invalid response from server');
      }

      setPositions(prev => applyAssignedPositionResponse(prev, positionId, updatedPosition, recruiterName));
      toast.success(getRecruiterAssignmentSuccessMessage(
        recruiterId,
        getRecruiterSyncApplicantCount(responseData),
      ));

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = setTimeout(() => {
        fetchRecruiterStats().catch(() => undefined);
      }, 1000);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast.error('Request timed out. Please try again.');
        } else {
          toast.error(`Failed to update recruiter assignment: ${error.message}`);
        }
      } else {
        toast.error('Failed to update recruiter assignment');
      }

      setPositions(prevPositions);
    } finally {
      setAssigningRecruiter(null);
    }
  }, [assigningRecruiter, availableRecruiter, fetchRecruiterStats, positions, setPositions]);

  useEffect(() => {
    if (!assigningRecruiter) {
      return;
    }

    const timeout = setTimeout(() => {
      setAssigningRecruiter(null);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [assigningRecruiter]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return {
    assigningRecruiter,
    resetAssigningRecruiter,
    handleAssignRecruiterToPosition,
  };
}
