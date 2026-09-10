import type { ApplicantFilterValues } from "@/lib/types";

import type { ClearedApplicantAiSearchState, SearchParamsLike } from "./applicant-page-filter-types";

export function getClearedApplicantAiSearchState(): ClearedApplicantAiSearchState {
  return {
    aiMatchedApplicantIds: null,
    aiSearchReasoning: null,
    aiRecordCount: 0,
    isAiSearchActive: false,
  };
}

export function buildApplicantClearFiltersUrl(
  pathname: string,
  search: string | URLSearchParams,
  keysToRemove: string[] = ["query"]
) {
  const params = new URLSearchParams(search);
  for (const key of keysToRemove) {
    params.delete(key);
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function buildInitialApplicantFiltersFromSearchParams(
  initialFilters?: ApplicantFilterValues,
  searchParams?: SearchParamsLike | null
): ApplicantFilterValues {
  if (initialFilters) return initialFilters;

  const filters: ApplicantFilterValues = {
    selectedPositionIds: [],
    selectedStatuses: [],
    selectedRecruiterIds: [],
  };

  if (!searchParams) return filters;

  const statusParam = searchParams.get("status");
  if (statusParam) {
    filters.selectedStatuses = statusParam.split(",").filter(Boolean);
  }

  const positionParam = searchParams.get("positionId");
  if (positionParam) {
    filters.selectedPositionIds = positionParam.split(",").filter(Boolean);
  }

  const recruiterParam = searchParams.get("recruiterId");
  if (recruiterParam) {
    filters.selectedRecruiterIds = recruiterParam.split(",").filter(Boolean);
  }

  const queryParam = searchParams.get("query");
  if (queryParam) {
    filters.name = queryParam;
  }

  return filters;
}
