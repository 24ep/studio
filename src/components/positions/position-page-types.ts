export type PositionSortDirection = 'asc' | 'desc' | null;
export type PositionStatusFilter = 'all' | 'open' | 'closed';
export type PositionFetchLoadingMode = 'search' | 'initial' | 'table';

export interface PositionFilterSnapshot {
  searchTerm: string;
  statusFilter: PositionStatusFilter;
  departmentFilter: string;
  gradeFilter: string | null;
  selectedRecruiterId: string | null;
  selectedHiringManagerId: string | null;
  page: number;
  pageSize: number;
}

export interface PositionFilterCountInput {
  searchTerm: string;
  statusFilter?: PositionStatusFilter;
  departmentFilter: string;
  gradeFilter?: string | null;
  selectedRecruiterId: string | null;
  selectedHiringManagerId: string | null;
}

export interface VisiblePositionFiltersInput {
  searchTerm: string;
  statusFilter: PositionStatusFilter;
  departmentFilter: string;
  gradeFilter?: string | null;
  selectedRecruiterId?: string | null;
  selectedHiringManagerId?: string | null;
}

export interface ClearedPositionVisibleFilters {
  searchTerm: string;
  statusFilter: PositionStatusFilter;
  departmentFilter: string;
  gradeFilter: string | null;
  selectedRecruiterId: string | null;
  selectedHiringManagerId: string | null;
}

export interface PositionPreferencesSnapshot {
  searchTerm: string;
  departmentFilter: string;
  statusFilter: PositionStatusFilter;
  selectedRecruiterId: string | null;
  pageSize: number;
}

export interface PositionPreferencesLike {
  searchTerm?: string | null;
  departmentFilter?: string | null;
  statusFilter?: string | null;
  selectedRecruiterId?: string | null;
  pageSize?: number | null;
}

export interface PositionPreferencesInitialization {
  preferences: PositionPreferencesSnapshot;
  shouldApplyStatusFilter: boolean;
}

export interface PositionPagePermissions {
  canCreatePositions: boolean;
  canAssignPositionRecruiter: boolean;
}

export interface PositionLoadingStateSnapshot {
  isLoading: boolean;
  isTableLoading: boolean;
  isSearching: boolean;
}

export interface PositionDrawerOpenChangeAction {
  isOpen: boolean;
  shouldClearSelection: boolean;
  shouldRefreshPositions: boolean;
}

export interface PositionSearchKeyAction {
  shouldClearSearch: boolean;
  shouldBlurInput: boolean;
}

export type PositionDepartmentFetchResult = {
  ok: boolean;
  data: unknown;
};

export type PositionDepartmentFetcher = (
  input: string,
  options: { timeoutMs: number }
) => Promise<PositionDepartmentFetchResult>;
