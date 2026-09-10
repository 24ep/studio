"use client";

import * as React from "react";
import {
  PENDING_COUNT_POLL_INTERVAL_MS,
  parsePendingCountSseData,
} from "./pending-count-utils";
import { fetchPendingCountState } from "./pending-count-api";
import { useSharedSSE } from "@/hooks/use-shared-sse";
import { useVisibilityInterval } from '@/hooks/use-visibility-interval';

export function usePendingCount() {
  const [pendingCount, setPendingCount] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const { isConnected, subscribeToEvents } = useSharedSSE();

  const fetchPendingCount = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const nextState = await fetchPendingCountState();
      setPendingCount(nextState.pendingCount);
      setHasPermission(nextState.hasPermission);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchPendingCount();
  }, [fetchPendingCount]);

  React.useEffect(() => {
    return subscribeToEvents((event) => {
      if (hasPermission === false) {
        return;
      }

      const nextPendingCount = parsePendingCountSseData(event.data);
      if (nextPendingCount !== null) {
        setPendingCount(nextPendingCount);
      }
    });
  }, [hasPermission, subscribeToEvents]);

  const shouldPollCount = !isConnected && hasPermission !== false;
  useVisibilityInterval(fetchPendingCount, PENDING_COUNT_POLL_INTERVAL_MS, shouldPollCount);

  return { pendingCount, isLoading };
}
