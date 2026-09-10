"use client";

import { useCallback, useState, type MutableRefObject } from "react";
import { toast } from "react-hot-toast";

import type { Position } from "@/lib/types";
import { safeFetch } from "@/lib/safe-fetch";
import {
  buildPositionListQuery,
  getPositionFetchLoadingMode,
  normalizePositionListResponse,
  shouldClearPositionPageLoading,
} from "../position-page-utils";
import type { PositionFilterSnapshot } from "../position-page-types";

type PositionHeadcountData = {
  [positionId: string]: { total: number; vacant: number; filled: number };
};

interface UsePositionsPageDataStateOptions {
  currentFiltersRef: MutableRefObject<PositionFilterSnapshot>;
  isInitialLoadRef: MutableRefObject<boolean>;
}

export function usePositionsPageDataState({
  currentFiltersRef,
  isInitialLoadRef,
}: UsePositionsPageDataStateOptions) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [total, setTotal] = useState(0);
  const [availableHiringManagers, setAvailableHiringManagers] = useState<{ id: string; name: string; avatarUrl?: string | null; personalColor?: string | null }[]>([]);
  const [headcountData, setHeadcountData] = useState<PositionHeadcountData>({});
  const [vacantFromOpenPositions, setVacantFromOpenPositions] = useState({ vacant: 0, totalOpen: 0 });

  const fetchPositions = useCallback(async (isSearch = false, customPage?: number, signal?: AbortSignal) => {
    const loadingMode = getPositionFetchLoadingMode(isSearch, isInitialLoadRef.current);

    if (loadingMode === "search") {
      setIsSearching(true);
    } else if (loadingMode === "initial") {
      setIsLoading(true);
      isInitialLoadRef.current = false;
    } else {
      setIsTableLoading(true);
    }

    try {
      const query = buildPositionListQuery(currentFiltersRef.current, customPage);
      const result = await safeFetch(`/api/positions?${query.toString()}`, { timeoutMs: 12000, signal });

      if (!result.ok) {
        console.warn("Skipping failed endpoint /api/positions:", result.error || result.status);
        setPositions([]);
        setTotal(0);
        setHeadcountData({});
        toast.error("Failed to load positions");
        return;
      }

      const positionListResponse = normalizePositionListResponse(result.data);

      if (positionListResponse.positions.length === 0 && positionListResponse.total === 0) {
        setPositions([]);
        setTotal(0);
        setHeadcountData({});
      } else {
        setPositions(positionListResponse.positions);
        setTotal(positionListResponse.total);
        setHeadcountData(positionListResponse.headcountData);
      }
    } catch {
      toast.error("Failed to load positions");
    } finally {
      setIsSearching(false);
      if (shouldClearPositionPageLoading(loadingMode)) {
        setIsTableLoading(false);
        setIsLoading(false);
      }
    }
  }, [currentFiltersRef, isInitialLoadRef]);

  return {
    availableHiringManagers,
    fetchPositions,
    headcountData,
    isLoading,
    isSearching,
    isTableLoading,
    positions,
    setAvailableHiringManagers,
    setHeadcountData,
    setIsLoading,
    setIsSearching,
    setIsTableLoading,
    setPositions,
    setVacantFromOpenPositions,
    total,
    vacantFromOpenPositions,
  };
}
