"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { useSharedSSE } from "@/hooks/use-shared-sse";

import { fetchAssignedPositionsForRecruiter } from "./assigned-positions-sidebar-api";
import { isAssignedPositionsRefreshEvent } from "./assigned-positions-sidebar-utils";
import type { AssignedPosition } from "./AssignedPositionsSidebarTypes";

const ASSIGNED_POSITIONS_MIN_UPDATE_INTERVAL_MS = 1000;
const ASSIGNED_POSITIONS_REFRESH_DEBOUNCE_MS = 1000;

export function useAssignedPositionsSidebar() {
  const { data: session } = useSession();
  const [positions, setPositions] = useState<AssignedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isPositionDrawerOpen, setIsPositionDrawerOpen] = useState(false);
  const { subscribeToEvents } = useSharedSSE();

  const user = session?.user;
  const userId = user?.id;

  const fetchAssignedPositions = useCallback(async (isInitialLoad = false) => {
    if (!userId) {
      return;
    }

    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError(null);

    try {
      setPositions(await fetchAssignedPositionsForRecruiter(userId));
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching assigned positions:", err);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchAssignedPositions(true);
    }
  }, [fetchAssignedPositions, user?.role, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let mounted = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastUpdateTime = 0;

    const unsubscribe = subscribeToEvents((event) => {
      if (!mounted || !isAssignedPositionsRefreshEvent(event)) {
        return;
      }

      const now = Date.now();
      if (now - lastUpdateTime < ASSIGNED_POSITIONS_MIN_UPDATE_INTERVAL_MS) {
        return;
      }

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(() => {
        if (mounted && userId) {
          lastUpdateTime = Date.now();
          fetchAssignedPositions(false);
        }
      }, ASSIGNED_POSITIONS_REFRESH_DEBOUNCE_MS);
    });

    return () => {
      mounted = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      unsubscribe();
    };
  }, [fetchAssignedPositions, subscribeToEvents, userId]);

  const openPosition = (positionId: string) => {
    setSelectedPositionId(positionId);
    setIsPositionDrawerOpen(true);
  };

  return {
    user,
    positions,
    isLoading,
    error,
    selectedPositionId,
    isPositionDrawerOpen,
    fetchAssignedPositions,
    openPosition,
    setIsPositionDrawerOpen,
  };
}
