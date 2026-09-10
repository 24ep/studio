import type {
  ClearedPositionVisibleFilters,
  PositionFilterCountInput,
  PositionFilterSnapshot,
  VisiblePositionFiltersInput,
} from './position-page-types';

export function buildPositionFilterSnapshot(snapshot: PositionFilterSnapshot): PositionFilterSnapshot {
  return {
    searchTerm: snapshot.searchTerm,
    statusFilter: snapshot.statusFilter,
    departmentFilter: snapshot.departmentFilter,
    gradeFilter: snapshot.gradeFilter,
    selectedRecruiterId: snapshot.selectedRecruiterId,
    selectedHiringManagerId: snapshot.selectedHiringManagerId,
    page: snapshot.page,
    pageSize: snapshot.pageSize,
  };
}

export function countActivePositionFilters({
  searchTerm,
  statusFilter,
  departmentFilter,
  gradeFilter,
  selectedRecruiterId,
  selectedHiringManagerId,
}: PositionFilterCountInput) {
  return [
    Boolean(searchTerm),
    Boolean(statusFilter && statusFilter !== 'all'),
    Boolean(departmentFilter && departmentFilter !== 'all'),
    Boolean(gradeFilter),
    Boolean(selectedRecruiterId),
    Boolean(selectedHiringManagerId),
  ].filter(Boolean).length;
}

export function hasVisiblePositionFilters({
  searchTerm,
  statusFilter,
  departmentFilter,
  gradeFilter,
  selectedRecruiterId,
  selectedHiringManagerId,
}: VisiblePositionFiltersInput) {
  return Boolean(
    searchTerm ||
    statusFilter !== 'all' ||
    departmentFilter !== 'all' ||
    gradeFilter ||
    selectedRecruiterId ||
    selectedHiringManagerId
  );
}

export function getPositionEmptyStateMessage(filters: VisiblePositionFiltersInput) {
  return hasVisiblePositionFilters(filters)
    ? 'Try adjusting your filters'
    : 'Get started by adding your first position';
}

export function shouldShowAddFirstPositionButton(
  canCreatePositions: boolean,
  filters: VisiblePositionFiltersInput
) {
  return canCreatePositions && !hasVisiblePositionFilters(filters);
}

export function getClearedPositionVisibleFilters(): ClearedPositionVisibleFilters {
  return {
    searchTerm: '',
    statusFilter: 'all',
    departmentFilter: 'all',
    gradeFilter: null,
    selectedRecruiterId: null,
    selectedHiringManagerId: null,
  };
}
