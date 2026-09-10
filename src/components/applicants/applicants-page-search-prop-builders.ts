import type { ApplicantsPageClientController } from './hooks/use-applicants-page-client-controller';

export function buildSearchExperienceProps({ ai, available, filters, searchExperience, table }: ApplicantsPageClientController) {
  return {
    open: ai.isSearchDrawerOpen,
    onOpenChange: ai.setIsSearchDrawerOpen,
    filters: filters.values,
    onFilterChange: filters.handleFilterChange,
    applicants: searchExperience.applicants,
    tableLoading: table.tableLoading,
    stageNames: searchExperience.stageNames,
    stageColors: searchExperience.stageColors,
    allDbPositions: available.positions,
  };
}
