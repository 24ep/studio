"use client";

import { useCallback, useEffect, useState } from "react";
import { useSharedSSE } from "@/hooks/use-shared-sse";
import { safeFetch } from "@/lib/safe-fetch";
import type { QueueItem, QueueResponse } from "./applicants/applicant-import-queue-types";

const REFRESH_EVENT_TYPES = new Set(["upload_queue_update", "queue"]);
const MIN_UPDATE_INTERVAL_MS = 500;
const REFRESH_BATCH_DELAY_MS = 100;

interface QueueEventData {
  data?: unknown;
  total?: number;
  summary?: QueueResponse["summary"];
}

function buildQueueParams(
  page: number,
  pageSize: number,
  searchTerm: string,
  statusFilter: string,
) {
  return new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter !== "all" && { status: statusFilter }),
  });
}

function getQueueEventData(data: unknown): QueueEventData {
  return data && typeof data === "object" ? data as QueueEventData : {};
}

function queueResponseFromEvent(data: unknown): QueueResponse | null {
  const eventData = getQueueEventData(data);

  if (!Array.isArray(eventData.data)) {
    return null;
  }

  return {
    data: eventData.data as QueueItem[],
    total: eventData.total || 0,
    summary: eventData.summary || { queued: 0, inprocess: 0, success: 0, error: 0 },
  };
}

export function useUploadQueueStatus() {
  const [queueData, setQueueData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { isConnected: realtimeConnected, subscribeToEvents } = useSharedSSE();

  const fetchQueue = useCallback(async (currentPage = 1, currentPageSize = 10) => {
    setLoading(true);
    setErrorMessage(null);

    const params = buildQueueParams(currentPage, currentPageSize, searchTerm, statusFilter);
    const result = await safeFetch<QueueResponse>(`/api/upload-queue?${params}`, { timeoutMs: 12000 });

    if (result.ok && result.data) {
      setQueueData(result.data);
      setLastUpdate(new Date());
    } else {
      console.warn("Skipping failed endpoint /api/upload-queue:", result.error || result.status);
      setErrorMessage("Some data failed to load. Showing last known values.");
    }

    setLoading(false);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchQueue(page, pageSize);
  }, [fetchQueue, page, pageSize]);

  useEffect(() => {
    let mounted = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;
    let lastUpdateTime = 0;

    const unsubscribe = subscribeToEvents((event) => {
      if (!mounted || !REFRESH_EVENT_TYPES.has(event.type)) {
        return;
      }

      const now = Date.now();
      if (now - lastUpdateTime < MIN_UPDATE_INTERVAL_MS) {
        return;
      }

      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }

      refreshTimeout = setTimeout(() => {
        if (!mounted) {
          return;
        }

        const eventQueueData = queueResponseFromEvent(event.data);
        if (eventQueueData) {
          setQueueData(eventQueueData);
        } else {
          fetchQueue(page, pageSize);
        }

        setLastUpdate(new Date());
        lastUpdateTime = now;
      }, REFRESH_BATCH_DELAY_MS);
    });

    return () => {
      mounted = false;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      unsubscribe();
    };
  }, [subscribeToEvents, fetchQueue, page, pageSize]);

  useEffect(() => {
    const handleRefreshEvent = () => {
      fetchQueue(page, pageSize);
      setLastUpdate(new Date());
    };

    window.addEventListener("refreshApplicantQueue", handleRefreshEvent);

    return () => {
      window.removeEventListener("refreshApplicantQueue", handleRefreshEvent);
    };
  }, [fetchQueue, page, pageSize]);

  return {
    queueData,
    loading,
    errorMessage,
    selectedItem,
    showDetails,
    searchTerm,
    statusFilter,
    page,
    pageSize,
    lastUpdate,
    realtimeConnected,
    actions: {
      setSearchTerm,
      setShowDetails,
      handleItemClick(item: QueueItem) {
        setSelectedItem(item);
        setShowDetails(true);
      },
      handleSearch() {
        setPage(1);
        fetchQueue(1, pageSize);
      },
      handleStatusFilterChange(value: string) {
        setStatusFilter(value);
        setPage(1);
      },
      handlePageSizeChange(value: string) {
        setPageSize(Number(value));
        setPage(1);
      },
      handleRefresh() {
        fetchQueue(page, pageSize);
      },
      goToPreviousPage() {
        setPage((currentPage) => Math.max(1, currentPage - 1));
      },
      goToNextPage() {
        const totalPages = queueData ? Math.ceil(queueData.total / pageSize) : page;
        setPage((currentPage) => Math.min(totalPages, currentPage + 1));
      },
    },
  };
}
