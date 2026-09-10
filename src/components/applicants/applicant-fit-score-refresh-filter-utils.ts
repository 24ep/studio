import type { ApplicantFilterValues } from "@/lib/types";

import { areStringArraysEquivalent } from "./applicant-filter-array-utils";
import {
  ARRAY_FILTER_KEYS,
  SIGNIFICANT_SCALAR_FILTER_KEYS,
} from "./applicant-page-filter-keys";

export function hasSignificantApplicantFilterChange(
  currentFilters?: ApplicantFilterValues | null,
  nextFilters?: ApplicantFilterValues | null
) {
  const current = currentFilters || {};
  const next = nextFilters || {};

  return hasSignificantScalarFilterChange(current, next) ||
    hasSignificantArrayFilterChange(current, next);
}

export function shouldRefreshApplicantFitScoreCountsForFilterChange(
  currentFilters?: ApplicantFilterValues | null,
  nextFilters?: ApplicantFilterValues | null
) {
  return hasSignificantApplicantFilterChange(currentFilters, nextFilters);
}

function hasSignificantScalarFilterChange(
  current: Partial<ApplicantFilterValues>,
  next: Partial<ApplicantFilterValues>
) {
  return SIGNIFICANT_SCALAR_FILTER_KEYS.some(key => current[key] !== next[key]);
}

function hasSignificantArrayFilterChange(
  current: Partial<ApplicantFilterValues>,
  next: Partial<ApplicantFilterValues>
) {
  return ARRAY_FILTER_KEYS.some(key => !areStringArraysEquivalent(current[key], next[key]));
}
