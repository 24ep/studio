import type {
  PositionDrawerOpenChangeAction,
  PositionFetchLoadingMode,
  PositionLoadingStateSnapshot,
  PositionPagePermissions,
  PositionSearchKeyAction,
} from './position-page-types';

export function buildPositionPagePermissions(modulePermissions?: unknown): PositionPagePermissions {
  const permissions = Array.isArray(modulePermissions) ? modulePermissions : [];

  return {
    canCreatePositions: permissions.includes('POSITIONS_CREATE'),
    canAssignPositionRecruiter: permissions.includes('POSITIONS_RECRUITER_ASSIGN'),
  };
}

export function buildPositionTotalPages(total: number, pageSize: number) {
  const safePageSize = pageSize > 0 ? pageSize : 20;
  return Math.max(1, Math.ceil(Math.max(0, total) / safePageSize));
}

export function getPositionFetchLoadingMode(
  isSearch: boolean,
  isInitialLoad: boolean
): PositionFetchLoadingMode {
  if (isSearch) return 'search';
  return isInitialLoad ? 'initial' : 'table';
}

export function shouldClearPositionPageLoading(mode: PositionFetchLoadingMode) {
  return mode !== 'search';
}

export function hasActivePositionLoadingState({
  isLoading,
  isTableLoading,
  isSearching,
}: PositionLoadingStateSnapshot) {
  return Boolean(isLoading || isTableLoading || isSearching);
}

export function shouldStartInitialPositionLoad({
  hasInitialLoad,
  sessionUserId,
  isPreferencesLoaded,
}: {
  hasInitialLoad: boolean;
  sessionUserId?: string | null;
  isPreferencesLoaded: boolean;
}) {
  return !hasInitialLoad && Boolean(sessionUserId) && isPreferencesLoaded;
}

export function getPositionDrawerOpenChangeAction(isOpen: boolean): PositionDrawerOpenChangeAction {
  return {
    isOpen,
    shouldClearSelection: !isOpen,
    shouldRefreshPositions: !isOpen,
  };
}

export function shouldStopPositionSearchAfterInputChange(isSearching: boolean, value: string) {
  return isSearching && value === '';
}

export function getPositionSearchKeyAction(key: string): PositionSearchKeyAction {
  const isEscape = key === 'Escape';

  return {
    shouldClearSearch: isEscape,
    shouldBlurInput: isEscape,
  };
}
