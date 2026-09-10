import type {
  PositionFilterSnapshot,
  PositionStatusFilter,
} from './position-page-types';

type PositionListQueryInput = PositionFilterSnapshot;

export function parsePositionStatusFromSearch(
  search: string,
  fallbackStatus: PositionStatusFilter = 'all'
): PositionStatusFilter {
  const searchParams = new URLSearchParams(search);
  const statusParam = searchParams.get('status');
  const queryParam = searchParams.get('query');

  if (statusParam?.toLowerCase() === 'open') return 'open';
  if (statusParam?.toLowerCase() === 'closed') return 'closed';

  const queryStatusMatch = queryParam?.match(/status:(open|closed)/i);
  if (queryStatusMatch?.[1]?.toLowerCase() === 'open') return 'open';
  if (queryStatusMatch?.[1]?.toLowerCase() === 'closed') return 'closed';

  return fallbackStatus;
}

export function parsePositionPageFromSearch(search: string, fallbackPage = 1) {
  const pageParam = new URLSearchParams(search).get('page');
  const parsedPage = pageParam ? parseInt(pageParam, 10) : fallbackPage;

  return Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : fallbackPage;
}

export function parsePositionRecruiterFromSearch(
  search: string,
  fallbackRecruiterId: string | null = null
) {
  const recruiterParam = new URLSearchParams(search).get('recruiterId');
  if (!recruiterParam) return fallbackRecruiterId;
  if (recruiterParam === 'all') return null;

  return recruiterParam;
}

export function getPositionQueryFromSearch(search: string) {
  return new URLSearchParams(search).get('query') || '';
}

export function getPositionSearchSyncUpdate(
  search: string,
  currentStatusFilter: PositionStatusFilter,
  currentSearchTerm: string
) {
  const nextStatusFilter = parsePositionStatusFromSearch(search, currentStatusFilter);
  const queryParam = getPositionQueryFromSearch(search);

  return {
    statusFilter: nextStatusFilter !== currentStatusFilter ? nextStatusFilter : undefined,
    searchTerm: queryParam && queryParam !== currentSearchTerm ? queryParam : undefined,
  };
}

export function hasPositionStatusOrQueryInSearch(search: string) {
  const searchParams = new URLSearchParams(search);
  return Boolean(searchParams.get('status') || searchParams.get('query'));
}

export function getPositionPaginationUpdateFromSearch(
  search: string,
  currentPage: number,
  currentPageSize: number
) {
  const params = new URLSearchParams(search);
  const pageParam = params.get('page');
  const pageSizeParam = params.get('pageSize');
  const parsedPage = pageParam ? parseInt(pageParam, 10) : currentPage;
  const parsedPageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : currentPageSize;
  const nextPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : currentPage;
  const nextPageSize = Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : currentPageSize;

  return {
    page: nextPage,
    pageSize: nextPageSize,
    shouldUpdatePage: nextPage !== currentPage,
    shouldUpdatePageSize: nextPageSize !== currentPageSize,
  };
}

export function buildPositionPaginationSearch(
  search: string,
  page: number,
  pageSize?: number
) {
  const params = new URLSearchParams(search);
  params.set('page', page.toString());
  if (pageSize) {
    params.set('pageSize', pageSize.toString());
  }

  return params.toString();
}

export function buildPositionListQuery(filters: PositionListQueryInput, customPage?: number) {
  const query = new URLSearchParams();

  if (filters.searchTerm) query.append('title', filters.searchTerm);
  if (filters.statusFilter !== 'all') query.append('isOpen', filters.statusFilter === 'open' ? 'true' : 'false');
  if (filters.departmentFilter !== 'all') query.append('department', filters.departmentFilter);
  if (filters.selectedRecruiterId === 'unassigned') {
    query.append('recruiterId', 'null');
  } else if (filters.selectedRecruiterId) {
    query.append('recruiterId', filters.selectedRecruiterId);
  }
  if (filters.selectedHiringManagerId) query.append('hiringManagerId', filters.selectedHiringManagerId);
  if (filters.gradeFilter) query.append('gradeId', filters.gradeFilter);

  query.append('limit', String(filters.pageSize));
  query.append('offset', String(((customPage ?? filters.page) - 1) * filters.pageSize));
  query.append('includeStats', 'true');
  query.append('includeapplicantStats', 'true');
  query.append('includeHeadcount', 'true');

  return query;
}
