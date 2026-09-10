import type { MutableRefObject, RefObject } from 'react';

import type { ApplicantFilterValues } from '@/lib/types';

export interface SearchParamsLike {
  get(name: string): string | null;
}

export type TimeoutRef = MutableRefObject<NodeJS.Timeout | null>;

export interface UseApplicantsPageEffectsInput {
  sessionStatus: string;
  serverAuthError: boolean;
  serverPermissionError: boolean;
  initialApplicantsCount: number;
  filteredApplicantsCount: number;
  initialFetchError?: string;
  filters: ApplicantFilterValues;
  page: number;
  pageSize: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc' | null;
  settingsLoading: boolean;
  isClearingFilters: boolean;
  hasInitialDataFetch: boolean;
  realtimeConnected: boolean;
  searchParams: SearchParamsLike;
  currentRequestRef?: MutableRefObject<string | null>;
  filterChangeTimeoutRef: TimeoutRef;
  batchTimeoutRef: TimeoutRef;
  sidebarFilterRef: RefObject<HTMLElement | null>;
  setHasInitialDataFetch: (hasFetched: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setTableLoading: (isLoading: boolean) => void;
  fetchRecruiter: () => void;
  fetchSources: () => void;
  fetchTableData: (filters: ApplicantFilterValues, page: number, pageSize: number) => void;
  fetchAllApplicantsForCounts: () => void;
  forceRefreshFitScoreCounts: () => void;
  addFilterRef: (element: HTMLElement) => void;
  removeFilterRef: (element: HTMLElement) => void;
  onOpenSearchDrawer: () => void;
}
