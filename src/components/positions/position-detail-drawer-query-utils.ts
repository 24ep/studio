import type { ApplicantFilterValues } from "@/lib/types";
import type {
  BuildPositionApplicantsQueryInput,
  BuildPotentialPositionApplicantsQueryInput,
} from "./position-detail-drawer-types";

export function buildPositionApplicantsQuery({
  page,
  pageSize,
  applicantType,
  searchTerm,
  sortColumn,
  sortDirection,
  filters,
}: BuildPositionApplicantsQueryInput) {
  const query = new URLSearchParams();
  query.append("page", String(page));
  query.append("limit", String(pageSize));
  query.append("type", applicantType);

  if (searchTerm) {
    query.append("searchTerm", searchTerm);
  }

  query.append("sortColumn", sortColumn || "fitScore");
  query.append("sortDirection", sortDirection || "desc");
  appendApplicantFilters(query, filters);
  query.append("showPinSection", "true");

  return query.toString();
}

export function buildPotentialPositionApplicantsQuery({
  page,
  pageSize,
  searchTerm,
  sortColumn,
  sortDirection,
  filters,
}: BuildPotentialPositionApplicantsQueryInput) {
  const query = new URLSearchParams();
  query.append("page", String(page));
  query.append("limit", String(pageSize));
  query.append("hasJobMatch", "true");
  query.append("notApplied", "true");

  if (searchTerm) {
    query.append("searchTerm", searchTerm);
  }

  query.append("sortColumn", sortColumn || "matchScore");
  query.append("sortDirection", sortDirection || "desc");
  appendStatusFilter(query, filters);
  query.append("showPinSection", "true");

  return query.toString();
}

function appendApplicantFilters(query: URLSearchParams, filters?: ApplicantFilterValues) {
  appendStatusFilter(query, filters);

  if (filters?.selectedRecruiterIds?.length) {
    query.append("recruiterId", filters.selectedRecruiterIds.join(","));
  }

  if (filters?.selectedSourceIds?.length) {
    query.append("sourceId", filters.selectedSourceIds.join(","));
  }
}

function appendStatusFilter(query: URLSearchParams, filters?: ApplicantFilterValues) {
  if (filters?.selectedStatuses?.length) {
    query.append("status", filters.selectedStatuses.join(","));
  }
}
