import type { ApplicantFilterValues } from "@/lib/types";

import {
  ARRAY_FILTER_KEYS,
  NUMERIC_FILTER_KEYS,
  TEXT_FILTER_KEYS,
} from "./applicant-page-filter-keys";

type ApplicantFilterPredicate = (filters: ApplicantFilterValues) => boolean;

const ACTIVE_FILTER_PREDICATES: ApplicantFilterPredicate[] = [
  ...TEXT_FILTER_KEYS.map<ApplicantFilterPredicate>(key => filters => Boolean(filters[key])),
  ...ARRAY_FILTER_KEYS.map<ApplicantFilterPredicate>(key => filters => hasArrayFilterValues(filters[key])),
  ...NUMERIC_FILTER_KEYS.map<ApplicantFilterPredicate>(key => filters => typeof filters[key] === "number"),
  filters => Boolean(filters.applicationDateStart || filters.applicationDateEnd),
  filters => hasScoreRange(filters.minAppliedJobFitScore, filters.maxAppliedJobFitScore),
  filters => hasScoreRange(filters.minMatchingJobFitScore, filters.maxMatchingJobFitScore),
  filters => Boolean(filters.aiSearchQuery),
  filters => Boolean(filters.customFieldFilters && Object.keys(filters.customFieldFilters).length > 0),
];

export function countActiveApplicantFilters(filters?: ApplicantFilterValues | null) {
  if (!filters) return 0;
  return ACTIVE_FILTER_PREDICATES.filter(predicate => predicate(filters)).length;
}

export function hasActiveApplicantFilterValues(filters?: ApplicantFilterValues | null) {
  if (!filters) return false;
  return Object.values(filters).some(isActiveApplicantFilterValue);
}

function hasArrayFilterValues(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function hasScoreRange(minScore: unknown, maxScore: unknown) {
  return typeof minScore === "number" || typeof maxScore === "number";
}

function isActiveApplicantFilterValue(value: unknown) {
  return value !== undefined &&
    value !== null &&
    (!Array.isArray(value) || value.length > 0);
}
