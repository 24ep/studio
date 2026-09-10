import type { ApplicantTableFetchDecisionInput } from "./applicant-page-filter-types";
import { hasActiveApplicantFilterValues } from "./applicant-page-filter-state-utils";

export function buildApplicantTableFetchRequestId({
  filters,
  page,
  pageSize,
  sortColumn,
  sortDirection,
}: Pick<ApplicantTableFetchDecisionInput, "filters" | "page" | "pageSize" | "sortColumn" | "sortDirection">) {
  return JSON.stringify({ filters, page, pageSize, sortColumn, sortDirection });
}

export function shouldSkipApplicantTableFetch(input: ApplicantTableFetchDecisionInput) {
  if (input.sessionStatus !== "authenticated" || input.serverAuthError || input.serverPermissionError) {
    return true;
  }

  if (input.isClearingFilters || !input.hasInitialDataFetch || !input.filters) {
    return true;
  }

  const hasActiveFilters = hasActiveApplicantFilterValues(input.filters);
  if (
    !input.hasAdvancedQuery &&
    input.initialApplicantsCount > 0 &&
    !hasActiveFilters &&
    input.page === 1 &&
    input.sortColumn === "applicationDate" &&
    input.sortDirection === "desc"
  ) {
    return true;
  }

  const requestId = buildApplicantTableFetchRequestId(input);
  return input.currentRequestId === requestId;
}
