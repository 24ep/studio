"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { LogEntry, UserProfile } from '@/lib/types';
import {
  canGoToNextActivityPage,
  canGoToPreviousActivityPage,
  getUserActivityTotalPages,
} from './user-activity-logs-utils';
import { fetchUserActivityLogs } from './user-activity-logs-api';

interface UseUserActivityLogsOptions {
  isOpen: boolean;
  user: UserProfile | null;
}

export function useUserActivityLogs({ isOpen, user }: UseUserActivityLogsOptions) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = useCallback(async (page: number = 1) => {
    if (!user?.id || !isOpen) return;

    setIsLoading(true);
    try {
      const result = await fetchUserActivityLogs({ page, userId: user.id });
      setLogs(result.logs);
      setTotalLogs(result.total);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching user activity logs:', error);
      toast.error('Failed to load activity logs');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isOpen]);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchLogs(1);
    } else {
      setLogs([]);
      setCurrentPage(1);
      setTotalLogs(0);
    }
  }, [isOpen, user?.id, fetchLogs]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchLogs(currentPage).finally(() => setIsRefreshing(false));
  }, [fetchLogs, currentPage]);

  const handlePreviousPage = useCallback(() => {
    if (canGoToPreviousActivityPage(currentPage)) {
      fetchLogs(currentPage - 1);
    }
  }, [currentPage, fetchLogs]);

  const handleNextPage = useCallback(() => {
    if (canGoToNextActivityPage(currentPage, totalLogs)) {
      fetchLogs(currentPage + 1);
    }
  }, [currentPage, fetchLogs, totalLogs]);

  return {
    currentPage,
    handleNextPage,
    handlePreviousPage,
    handleRefresh,
    isLoading,
    isRefreshing,
    logs,
    totalLogs,
    totalPages: getUserActivityTotalPages(totalLogs),
  };
}
