"use client";

import { useCallback, useMemo, useState } from 'react';

import type { Applicant } from '@/lib/types';
import {
  getNextApplicantSortState,
  sortPositionDrawerApplicants,
} from '../position-detail-drawer-utils';

type SortDirection = 'asc' | 'desc';

interface UsePositionApplicantListStateOptions {
  excludedSortColumns?: string[];
  initialSortColumn: string;
}

export function usePositionApplicantListState({
  excludedSortColumns = [],
  initialSortColumn,
}: UsePositionApplicantListStateOptions) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(initialSortColumn);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleSort = useCallback((column: string | null, direction?: SortDirection | null) => {
    const nextSort = getNextApplicantSortState(sortColumn, sortDirection, column, direction);
    setSortColumn(nextSort.sortColumn);
    setSortDirection(nextSort.sortDirection);
  }, [sortColumn, sortDirection]);

  const sortedApplicants = useMemo(() => (
    sortPositionDrawerApplicants(applicants, sortColumn, sortDirection, excludedSortColumns)
  ), [applicants, excludedSortColumns, sortColumn, sortDirection]);

  return {
    applicants,
    handleSort,
    openMenu,
    page,
    pageSize,
    searchTerm,
    setApplicants,
    setOpenMenu,
    setPage,
    setPageSize,
    setSearchTerm,
    setSortColumn,
    setSortDirection,
    setTotal,
    sortColumn,
    sortDirection,
    sortedApplicants,
    total,
  };
}
