import type { RefObject } from 'react';
import type { ApplicantsPageClientController } from './hooks/use-applicants-page-client-controller';

type Controller = ApplicantsPageClientController;

export function buildMobileFitScoreProps({ ai, filters, layout, scoring, settings }: Controller) {
  return {
    isMobile: layout.isMobile,
    applicantSettings: settings.applicantSettings,
    selectedAppliedGrades: filters.horizontalSelectedFitScoreGrades,
    selectedMatchingGrades: filters.horizontalSelectedMatchingFitScoreGrades,
    onAppliedGradeToggle: filters.onAppliedGradeToggle,
    onMatchingGradeToggle: filters.onMatchingGradeToggle,
    onClearAll: filters.onClearHorizontalFitScores,
    applicantScoreCounts: scoring.applicantScoreCounts,
    aiMatchedCount: ai.aiRecordCount,
    isAiSearchActive: ai.isAiSearchActive,
  };
}

export function buildPinnedFilterProps({ ai, available, filters, refs, scoring, table }: Controller) {
  return {
    sidebarRef: refs.sidebarFilterRef as RefObject<HTMLDivElement>,
    filters: filters.values,
    onFilterChange: filters.onFilterChange,
    onAiSearch: ai.handleAiSearch,
    onCancelAiSearch: ai.cancelAiSearch,
    onClearAllFilters: filters.onClearAll,
    availablePositions: available.positions,
    availableStages: available.stages,
    availableRecruiter: available.recruiters,
    availableSources: available.sources,
    isLoading: table.isLoading || scoring.isFilterDataLoading,
    isAiSearching: ai.isAiSearchActive,
    advancedQuery: filters.advancedQuery,
    onUnpin: () => filters.onTogglePinned(false),
  };
}

export function buildMobileFilterProps({ ai, available, filters, modals, scoring, table }: Controller) {
  return {
    isMobileFilterModalOpen: modals.isMobileFilterModalOpen,
    setIsMobileFilterModalOpen: modals.setIsMobileFilterModalOpen,
    activeFilterCount: filters.activeFilterCount,
    filters: filters.values,
    onFilterChange: filters.onFilterChange,
    onAiSearch: ai.handleAiSearch,
    onCancelAiSearch: ai.cancelAiSearch,
    availablePositions: available.positions,
    availableStages: available.stages,
    availableRecruiter: available.recruiters,
    availableSources: available.sources,
    onClearAllFilters: filters.onClearAll,
    isLoading: table.isLoading,
    isFilterDataLoading: scoring.isFilterDataLoading,
    isAiSearching: ai.isAiSearching,
    advancedQuery: filters.advancedQuery,
  };
}
