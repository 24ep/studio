"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSharedSSE } from '@/hooks/use-shared-sse';
import type { Position } from '@/lib/types';
import {
  filterOpenPositions,
  filterPositionSelectOptions,
  getPositionUpdateAction,
} from './position-select-dropdown-utils';
import { fetchApplicantPositionList } from './position-list-api';

export function usePositionSelectDropdown({
  filterOpenOnly,
  value,
}: {
  filterOpenOnly: boolean;
  value?: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { subscribeToEvents } = useSharedSSE();

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      setPositions(filterOpenPositions(await fetchApplicantPositionList(), filterOpenOnly));
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filterOpenOnly]);

  useEffect(() => {
    void fetchPositions();
  }, [fetchPositions]);

  useEffect(() => {
    const unsubscribe = subscribeToEvents((event) => {
      if (getPositionUpdateAction(event) === 'list_updated') {
        void fetchPositions();
      }
    });

    return unsubscribe;
  }, [fetchPositions, subscribeToEvents]);

  return {
    error,
    filteredPositions: useMemo(
      () => filterPositionSelectOptions(positions, searchTerm),
      [positions, searchTerm]
    ),
    loading,
    open,
    searchTerm,
    selectedPosition: useMemo(
      () => positions.find(position => position.id === value),
      [positions, value]
    ),
    setOpen,
    setSearchTerm,
  };
}
