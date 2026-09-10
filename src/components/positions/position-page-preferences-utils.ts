import { hasPositionStatusOrQueryInSearch } from './position-page-query-utils';
import type {
  PositionPreferencesInitialization,
  PositionPreferencesLike,
  PositionPreferencesSnapshot,
} from './position-page-types';

export function normalizePositionPreferences(preferences: PositionPreferencesLike | null | undefined): PositionPreferencesSnapshot {
  const statusFilter = preferences?.statusFilter;

  return {
    searchTerm: preferences?.searchTerm || '',
    departmentFilter: preferences?.departmentFilter || 'all',
    statusFilter: statusFilter === 'open' || statusFilter === 'closed' ? statusFilter : 'all',
    selectedRecruiterId: preferences?.selectedRecruiterId || null,
    pageSize: preferences?.pageSize || 20,
  };
}

export function shouldInitializePositionPreferences(
  isPreferencesLoaded: boolean,
  hasInitializedFromPreferences: boolean
) {
  return isPreferencesLoaded && !hasInitializedFromPreferences;
}

export function getPositionPreferencesInitialization(
  preferences: PositionPreferencesLike | null | undefined,
  search = ''
): PositionPreferencesInitialization {
  return {
    preferences: normalizePositionPreferences(preferences),
    shouldApplyStatusFilter: !hasPositionStatusOrQueryInSearch(search),
  };
}

export function getChangedPositionPreferences(
  current: PositionPreferencesSnapshot,
  lastSaved: PositionPreferencesSnapshot
): PositionPreferencesSnapshot | null {
  const hasChanges =
    current.searchTerm !== lastSaved.searchTerm ||
    current.departmentFilter !== lastSaved.departmentFilter ||
    current.statusFilter !== lastSaved.statusFilter ||
    current.selectedRecruiterId !== lastSaved.selectedRecruiterId ||
    current.pageSize !== lastSaved.pageSize;

  return hasChanges ? current : null;
}
