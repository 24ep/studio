"use client";

import type { ApplicantSettings } from "./applicant-settings-types";

import { ApplicantsPageMobileFitScoreFilter } from "./ApplicantsPageMobileFitScoreFilter";

interface ApplicantsPageMobileFitScoreFiltersProps {
  isMobile: boolean;
  applicantSettings: ApplicantSettings | null;
  selectedAppliedGrades: Set<string>;
  selectedMatchingGrades: Set<string>;
  onAppliedGradeToggle: (grade: string) => void;
  onMatchingGradeToggle: (grade: string) => void;
  onClearAll: () => void;
  applicantScoreCounts: {
    applied: Array<{ letter: string; count: number }>;
    matching: Array<{ letter: string; count: number }>;
  } | null;
  aiMatchedCount: number;
  isAiSearchActive: boolean;
}

export function ApplicantsPageMobileFitScoreFilters({
  isMobile,
  applicantSettings,
  selectedAppliedGrades,
  selectedMatchingGrades,
  onAppliedGradeToggle,
  onMatchingGradeToggle,
  onClearAll,
  applicantScoreCounts,
  aiMatchedCount,
  isAiSearchActive,
}: ApplicantsPageMobileFitScoreFiltersProps) {
  if (!isMobile || !applicantSettings?.showHorizontalFitScoreFilters) {
    return null;
  }

  if (applicantSettings.fitScoreType === "matching") {
    return (
      <ApplicantsPageMobileFitScoreFilter
        selectedGrades={selectedMatchingGrades}
        onGradeToggle={onMatchingGradeToggle}
        applicantCounts={applicantScoreCounts?.matching || []}
        filterMode={applicantSettings.fitScoreFilterMode}
        onClearAll={onClearAll}
        aiMatchedCount={aiMatchedCount}
        isAiSearchActive={isAiSearchActive}
        fitScoreType="matching"
      />
    );
  }

  return (
    <ApplicantsPageMobileFitScoreFilter
      selectedGrades={selectedAppliedGrades}
      onGradeToggle={onAppliedGradeToggle}
      applicantCounts={applicantScoreCounts?.applied || []}
      filterMode={applicantSettings.fitScoreFilterMode}
      onClearAll={onClearAll}
      aiMatchedCount={aiMatchedCount}
      isAiSearchActive={isAiSearchActive}
      fitScoreType="applied"
    />
  );
}
