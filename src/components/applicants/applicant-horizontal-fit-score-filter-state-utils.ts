import type { ApplicantFilterValues } from "@/lib/types";

import type {
  ApplicantHorizontalFitScoreFilterAction,
  ApplicantHorizontalFitScoreFilterActionInput,
} from "./applicant-page-filter-types";

export function toggleApplicantGradeSelection(selectedGrades: ReadonlySet<string>, grade: string) {
  const nextSelectedGrades = new Set(selectedGrades);
  if (nextSelectedGrades.has(grade)) {
    nextSelectedGrades.delete(grade);
  } else {
    nextSelectedGrades.add(grade);
  }
  return nextSelectedGrades;
}

export function hasApplicantHorizontalFitScoreSelections(
  appliedGrades?: ReadonlySet<string> | null,
  matchingGrades?: ReadonlySet<string> | null
) {
  return Boolean((appliedGrades?.size || 0) > 0 || (matchingGrades?.size || 0) > 0);
}

export function hasDefinedApplicantFilterValues(filters?: ApplicantFilterValues | null) {
  if (!filters) return false;
  return Object.values(filters).some((value) => value !== undefined);
}

export function getApplicantHorizontalFitScoreFilterAction({
  appliedGrades,
  matchingGrades,
  horizontalFilters,
}: ApplicantHorizontalFitScoreFilterActionInput): ApplicantHorizontalFitScoreFilterAction {
  if (!hasApplicantHorizontalFitScoreSelections(appliedGrades, matchingGrades)) {
    return { type: "clear" };
  }

  if (hasDefinedApplicantFilterValues(horizontalFilters)) {
    return { type: "merge", filters: horizontalFilters || {} };
  }

  return { type: "skip" };
}

export function clearApplicantHorizontalFitScoreFilters(
  filters: ApplicantFilterValues
): ApplicantFilterValues {
  return {
    ...filters,
    minAppliedJobFitScore: undefined,
    maxAppliedJobFitScore: undefined,
    minMatchingJobFitScore: undefined,
    maxMatchingJobFitScore: undefined,
    includeNoScoreInApplied: undefined,
    includeNoScoreInMatching: undefined,
  };
}
