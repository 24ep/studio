import { describe, expect, it } from "vitest";

import {
  applyHorizontalApplicantFitScoreFilters,
  buildInitialApplicantHookFilters,
  DEFAULT_APPLICANT_HOOK_FILTERS,
  INITIAL_APPLICANT_HOOK_FILTERS,
  isApplicantFitScoreFilterChange,
  mergeApplicantHookFilters,
} from "./applicant-filter-hook-utils";

describe("applicant filter hook utilities", () => {
  it("builds initial filters from provided values or hook defaults", () => {
    expect(buildInitialApplicantHookFilters()).toBe(INITIAL_APPLICANT_HOOK_FILTERS);
    expect(buildInitialApplicantHookFilters({ name: "Ada" })).toEqual({ name: "Ada" });
  });

  it("merges updates while clearing active AI search query", () => {
    expect(mergeApplicantHookFilters({
      name: "Ada",
      aiSearchQuery: "senior react",
    }, {
      email: "ada@example.com",
    })).toEqual({
      name: "Ada",
      email: "ada@example.com",
      aiSearchQuery: undefined,
    });
  });

  it("applies selected grade ranges to applied and matching score filters", () => {
    const filters = applyHorizontalApplicantFitScoreFilters({
      filters: DEFAULT_APPLICANT_HOOK_FILTERS,
      selectedAppliedGrades: new Set(["A", "B"]),
      selectedMatchingGrades: new Set(["D"]),
    });

    expect(filters).toMatchObject({
      minAppliedJobFitScore: 0.61,
      maxAppliedJobFitScore: 1,
      includeNoScoreInApplied: false,
      minMatchingJobFitScore: 0.21,
      maxMatchingJobFitScore: 0.4,
      includeNoScoreInMatching: false,
    });
  });

  it("handles no-score only and clears unselected score filters", () => {
    const filters = applyHorizontalApplicantFitScoreFilters({
      filters: {
        minAppliedJobFitScore: 0.2,
        maxAppliedJobFitScore: 0.8,
        includeNoScoreInApplied: false,
        minMatchingJobFitScore: 0.4,
        maxMatchingJobFitScore: 0.7,
        includeNoScoreInMatching: true,
      },
      selectedAppliedGrades: new Set(["no-score"]),
      selectedMatchingGrades: new Set(),
    });

    expect(filters).toMatchObject({
      minAppliedJobFitScore: -1,
      maxAppliedJobFitScore: -1,
      includeNoScoreInApplied: true,
      minMatchingJobFitScore: undefined,
      maxMatchingJobFitScore: undefined,
      includeNoScoreInMatching: undefined,
    });
  });

  it("detects fit score filter changes", () => {
    expect(isApplicantFitScoreFilterChange({ minAppliedJobFitScore: 0.5 })).toBe(true);
    expect(isApplicantFitScoreFilterChange({ includeNoScoreInMatching: false })).toBe(true);
    expect(isApplicantFitScoreFilterChange({ name: "Ada" })).toBe(false);
  });
});
