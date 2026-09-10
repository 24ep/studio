"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import type { LogEntry, LogLevel } from '@/lib/types';
import {
  APPLICATION_LOGS_PAGE_SIZE,
  type ApplicationLogsFilters,
  type LogUserOption,
} from './application-logs-page-types';
import { fetchApplicationLogUsers, fetchApplicationLogsPage } from './application-logs-page-api';
import {
  canViewLogs,
  filterLogUserOptions,
  getDefaultApplicationLogsFilters,
} from './application-logs-page-utils';

export { buildLogsUrl, canViewLogs } from './application-logs-page-utils';

export function useApplicationLogsPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actingUserIdFilter, setActingUserIdFilter] = useState('ALL');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [allUsers, setAllUsers] = useState<LogUserOption[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/settings/logs';
  const totalPages = Math.ceil(totalLogs / APPLICATION_LOGS_PAGE_SIZE);
  const currentFilters = useMemo(() => ({
    level: levelFilter,
    search: searchQuery,
    userId: actingUserIdFilter,
    start: startDate,
    end: endDate,
  }), [levelFilter, searchQuery, actingUserIdFilter, startDate, endDate]);

  const fetchLogUsers = useCallback(async () => {
    try {
      setAllUsers(await fetchApplicationLogUsers());
    } catch (error) {
      console.error('Error fetching users for log filter:', error);
      setAllUsers([]);
    }
  }, []);

  const fetchLogs = useCallback(async (page: number, filters: ApplicationLogsFilters) => {
    if (status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const result = await fetchApplicationLogsPage(page, filters);

      if (!result.ok) {
        setFetchError(result.error);
        setLogs([]);
        setTotalLogs(0);
        return;
      }

      setLogs(result.logs);
      setTotalLogs(result.total);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setFetchError((error as Error).message);
      setLogs([]);
      setTotalLogs(0);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    setIsClient(true);
    if (status === 'unauthenticated') {
      signIn(undefined, { callbackUrl: currentPath });
      return;
    }

    if (status !== 'authenticated') {
      return;
    }

    if (!canViewLogs(session.user)) {
      setFetchError('You do not have permission to view logs.');
      setIsLoading(false);
      return;
    }

    fetchLogUsers();
    fetchLogs(currentPage, currentFilters);
  }, [status, session, currentPage, currentFilters, currentPath, fetchLogUsers, fetchLogs]);

  const filteredUsersForDropdown = useMemo(() => {
    if (!Array.isArray(allUsers)) {
      console.warn('Settings logs page: allUsers is not an array:', allUsers);
      return [];
    }

    return filterLogUserOptions(allUsers, userSearch);
  }, [allUsers, userSearch]);

  const handleApplyFilters = useCallback(() => {
    setCurrentPage(1);
    fetchLogs(1, currentFilters);
  }, [fetchLogs, currentFilters]);

  const handleResetFilters = useCallback(() => {
    const resetFilters = getDefaultApplicationLogsFilters();

    setSearchQuery('');
    setLevelFilter('ALL');
    setActingUserIdFilter('ALL');
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
    fetchLogs(1, resetFilters);
  }, [fetchLogs]);

  const handleModalOpen = useCallback((log: LogEntry | null = null) => {
    setEditingLog(log);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingLog(null);
  }, []);

  return {
    sessionStatus: status,
    logs,
    isLoading,
    fetchError,
    isClient,
    currentPage,
    setCurrentPage,
    totalPages,
    levelFilter,
    setLevelFilter,
    searchQuery,
    setSearchQuery,
    actingUserIdFilter,
    setActingUserIdFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    allUsers,
    userSearch,
    setUserSearch,
    userPopoverOpen,
    setUserPopoverOpen,
    filteredUsersForDropdown,
    isModalOpen,
    editingLog,
    handleApplyFilters,
    handleResetFilters,
    handleModalOpen,
    handleModalClose,
  };
}
