import type { MutableRefObject } from 'react';

import type { Position } from '@/lib/types';
import type {
  PositionFilterSnapshot,
  PositionStatusFilter,
} from '../position-page-utils';

export type FetchPositions = (isSearch?: boolean, customPage?: number, signal?: AbortSignal) => Promise<void>;

export interface SearchParamsLike {
  get(name: string): string | null;
}

export interface UsePositionsPageEffectsInput {
  searchParams: SearchParamsLike;
  searchTerm: string;
  statusFilter: PositionStatusFilter;
  page: number;
  pageSize: number;
  departmentFilter: string;
  selectedRecruiterId: string | null;
  selectedHiringManagerId: string | null;
  gradeFilter: string | null;
  isLoading: boolean;
  isTableLoading: boolean;
  isSearching: boolean;
  positions: Position[];
  headcountData: { [positionId: string]: { total: number; vacant: number; filled: number } };
  sessionUserId?: string;
  isPreferencesLoaded: boolean;
  positionFilterSnapshot: PositionFilterSnapshot;
  searchTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  searchStuckTimeoutRef: MutableRefObject<NodeJS.Timeout | null>;
  hasInitialLoadRef: MutableRefObject<boolean>;
  isLoadingRef: MutableRefObject<boolean>;
  isTableLoadingRef: MutableRefObject<boolean>;
  isSearchingRef: MutableRefObject<boolean>;
  fetchPositionsRef: MutableRefObject<FetchPositions | null>;
  currentFiltersRef: MutableRefObject<PositionFilterSnapshot>;
  isUpdatingURLRef: MutableRefObject<boolean>;
  setSearchTerm: (value: string) => void;
  setStatusFilter: (value: PositionStatusFilter) => void;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;
  setIsLoading: (value: boolean) => void;
  setIsTableLoading: (value: boolean) => void;
  setIsSearching: (value: boolean) => void;
  setAvailableHiringManagers: (managers: { id: string; name: string; avatarUrl?: string | null; personalColor?: string | null }[]) => void;
  setVacantFromOpenPositions: (stats: { vacant: number; totalOpen: number }) => void;
  fetchPositions: FetchPositions;
  fetchAllDepartments: () => void;
  fetchRecruiterStats: () => void;
  fetchGrades: () => void;
  resetReferenceLoading: () => void;
}
