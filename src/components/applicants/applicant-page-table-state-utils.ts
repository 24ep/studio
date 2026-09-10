export function buildApplicantTotalPages({
  isAiSearchActive,
  aiMatchedApplicantIds,
  aiRecordCount,
  total,
  pageSize,
}: {
  isAiSearchActive: boolean;
  aiMatchedApplicantIds?: string[] | null;
  aiRecordCount: number;
  total: number;
  pageSize: number;
}) {
  const safePageSize = pageSize > 0 ? pageSize : 20;
  const recordCount = isAiSearchActive && aiMatchedApplicantIds
    ? aiRecordCount
    : total;

  return Math.max(1, Math.ceil(recordCount / safePageSize));
}

export function getApplicantAiSearchTotalUpdate({
  isLoading,
  tableLoading,
  isClearingFilters,
  isAiSearchActive,
  aiMatchedApplicantIds,
  aiRecordCount,
}: {
  isLoading: boolean;
  tableLoading: boolean;
  isClearingFilters: boolean;
  isAiSearchActive: boolean;
  aiMatchedApplicantIds?: string[] | null;
  aiRecordCount: number;
}) {
  if (isLoading || tableLoading || isClearingFilters) {
    return null;
  }

  return isAiSearchActive && aiMatchedApplicantIds ? aiRecordCount : null;
}

export type ApplicantTableSortDirection = 'asc' | 'desc' | null;

export function getNextApplicantTableSort({
  column,
  direction,
  currentSortColumn,
  currentSortDirection,
}: {
  column: string | null;
  direction?: ApplicantTableSortDirection;
  currentSortColumn: string;
  currentSortDirection: ApplicantTableSortDirection;
}) {
  if (direction !== undefined && direction !== null) {
    return {
      column: column || 'applicationDate',
      direction,
    };
  }

  if (column === currentSortColumn) {
    if (currentSortDirection === 'asc') {
      return { column, direction: 'desc' as const };
    }

    if (currentSortDirection === 'desc') {
      return { column, direction: null };
    }

    return { column, direction: 'asc' as const };
  }

  return { column, direction: 'asc' as const };
}

export function toggleApplicantTableSelection(selectedApplicantIds: Set<string>, applicantId: string) {
  const nextSelectedApplicantIds = new Set(selectedApplicantIds);

  if (nextSelectedApplicantIds.has(applicantId)) {
    nextSelectedApplicantIds.delete(applicantId);
  } else {
    nextSelectedApplicantIds.add(applicantId);
  }

  return nextSelectedApplicantIds;
}

export function toggleAllApplicantTableSelection(
  selectedApplicantIds: Set<string>,
  displayedApplicants: Array<{ id: string }> | null | undefined
) {
  const safeDisplayedApplicants = Array.isArray(displayedApplicants) ? displayedApplicants : [];

  if (selectedApplicantIds.size === safeDisplayedApplicants.length) {
    return new Set<string>();
  }

  return new Set(safeDisplayedApplicants.map(applicant => applicant.id));
}

export function getApplicantTablePaginationState({
  isAiSearchActive,
  aiMatchedApplicantIds,
  aiRecordCount,
  total,
  page,
  pageSize,
  totalPages,
}: {
  isAiSearchActive: boolean;
  aiMatchedApplicantIds?: string[] | null;
  aiRecordCount: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const currentTotal = isAiSearchActive && aiMatchedApplicantIds ? aiRecordCount : total;
  const isAiResultMode = isAiSearchActive && Boolean(aiMatchedApplicantIds);
  const safePageSize = pageSize > 0 ? pageSize : 20;
  const safePage = page > 0 ? page : 1;
  const startItem = currentTotal === 0 ? 0 : ((safePage - 1) * safePageSize) + 1;
  const endItem = Math.min(safePage * safePageSize, currentTotal);
  const subject = isAiResultMode ? 'AI-matched applicants' : 'applicants';

  return {
    currentTotal,
    hasMore: safePage < totalPages,
    startItem,
    endItem,
    emptyLabel: isAiSearchActive ? 'No AI-matched applicants found' : 'No applicants found',
    allItemsLabel: `Showing all ${currentTotal} ${subject}`,
    rangeLabel: `Showing ${startItem} to ${endItem} of ${currentTotal} ${subject}`,
    pageLabel: currentTotal === 0 ? 'No pages' : `Page ${safePage} of ${totalPages}`,
    isPreviousPageDisabled: safePage <= 1 || currentTotal === 0,
    isNextPageDisabled: safePage >= totalPages || currentTotal === 0,
  };
}
