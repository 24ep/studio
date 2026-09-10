import type { ApplicantFilterValues } from "../ApplicantFilters";
import { getScoreRangesForChart } from "../../../lib/scoreUtils";

export const DEFAULT_APPLICANT_HOOK_FILTERS: ApplicantFilterValues = {
  name: "",
  email: "",
  phone: "",
  education: "",
  skills: "",
  location: "",
  cvLanguage: "",
  jobSuitableCareer: "",
  jobSuitableLevel: "",
  jobSuitablePosition: "",
  minExperienceYears: undefined,
  maxExperienceYears: undefined,
  selectedPositionIds: [],
  selectedStatuses: [],
  selectedRecruiterIds: [],
  selectedSourceIds: [],
  minAppliedJobFitScore: undefined,
  maxAppliedJobFitScore: undefined,
  minMatchingJobFitScore: undefined,
  maxMatchingJobFitScore: undefined,
  includeNoScoreInApplied: false,
  includeNoScoreInMatching: false,
  applicationDateStart: undefined,
  applicationDateEnd: undefined,
  nameOperator: "contains",
  emailOperator: "contains",
  phoneOperator: "contains",
  locationOperator: "contains",
  aiSearchQuery: undefined,
  aiSearchType: "hybrid",
  aiSearchFilters: {},
  customFieldFilters: {},
};

export const INITIAL_APPLICANT_HOOK_FILTERS: ApplicantFilterValues = {
  minAppliedJobFitScore: undefined,
  maxAppliedJobFitScore: undefined,
  minMatchingJobFitScore: undefined,
  maxMatchingJobFitScore: undefined,
  minExperienceYears: 0,
  maxExperienceYears: 50,
  selectedPositionIds: [],
  selectedStatuses: [],
  selectedRecruiterIds: [],
};

export function buildInitialApplicantHookFilters(initialFilters?: ApplicantFilterValues) {
  return initialFilters || INITIAL_APPLICANT_HOOK_FILTERS;
}

export function mergeApplicantHookFilters(
  currentFilters: ApplicantFilterValues,
  newFilters: ApplicantFilterValues,
) {
  return { ...currentFilters, ...newFilters, aiSearchQuery: undefined };
}

export function areApplicantHookFiltersEqual(
  currentFilters: ApplicantFilterValues,
  nextFilters: ApplicantFilterValues,
) {
  return JSON.stringify(currentFilters) === JSON.stringify(nextFilters);
}

export function isApplicantFitScoreFilterChange(filters: ApplicantFilterValues) {
  return filters.minAppliedJobFitScore !== undefined ||
    filters.maxAppliedJobFitScore !== undefined ||
    filters.minMatchingJobFitScore !== undefined ||
    filters.maxMatchingJobFitScore !== undefined ||
    filters.includeNoScoreInApplied !== undefined ||
    filters.includeNoScoreInMatching !== undefined;
}

export function applyHorizontalApplicantFitScoreFilters({
  filters,
  selectedAppliedGrades,
  selectedMatchingGrades,
}: {
  filters: ApplicantFilterValues;
  selectedAppliedGrades: Set<string>;
  selectedMatchingGrades: Set<string>;
}) {
  const nextFilters = { ...filters };
  applyGradeSelectionToScoreFields({
    filters: nextFilters,
    selectedGrades: selectedAppliedGrades,
    minKey: "minAppliedJobFitScore",
    maxKey: "maxAppliedJobFitScore",
    includeNoScoreKey: "includeNoScoreInApplied",
  });
  applyGradeSelectionToScoreFields({
    filters: nextFilters,
    selectedGrades: selectedMatchingGrades,
    minKey: "minMatchingJobFitScore",
    maxKey: "maxMatchingJobFitScore",
    includeNoScoreKey: "includeNoScoreInMatching",
  });

  return nextFilters;
}

function applyGradeSelectionToScoreFields({
  filters,
  selectedGrades,
  minKey,
  maxKey,
  includeNoScoreKey,
}: {
  filters: ApplicantFilterValues;
  selectedGrades: Set<string>;
  minKey: "minAppliedJobFitScore" | "minMatchingJobFitScore";
  maxKey: "maxAppliedJobFitScore" | "maxMatchingJobFitScore";
  includeNoScoreKey: "includeNoScoreInApplied" | "includeNoScoreInMatching";
}) {
  if (selectedGrades.size === 0) {
    filters[minKey] = undefined;
    filters[maxKey] = undefined;
    filters[includeNoScoreKey] = undefined;
    return;
  }

  const scoreRanges = getScoreRangesForChart();
  const selectedRanges = scoreRanges.filter((range) => selectedGrades.has(range.letter));
  const hasNoScore = selectedGrades.has("no-score");

  if (selectedRanges.length > 0) {
    filters[minKey] = Math.min(...selectedRanges.map((range) => range.min)) / 100;
    filters[maxKey] = Math.max(...selectedRanges.map((range) => range.max)) / 100;
    filters[includeNoScoreKey] = hasNoScore;
    return;
  }

  if (hasNoScore) {
    filters[minKey] = -1;
    filters[maxKey] = -1;
    filters[includeNoScoreKey] = true;
  }
}
