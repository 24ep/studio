"use client";

import { Badge } from '@/components/ui/badge';
import { CpuChipIcon as Brain } from '@heroicons/react/24/outline';

import { ApplicantFilterPopover } from './ApplicantFilterPopover';
import { ApplicantsRecruitmentViewSwitch } from './ApplicantsRecruitmentViewSwitch';
import {
  ApplicantsHeaderActionsMenu,
  ApplicantsHeaderUploadButton,
} from './ApplicantsPageHeaderActionsMenu';
import { FitScoreFilterTabs } from './FitScoreFilterTabs';
import type {
  AiSearchResultBannerProps,
  ApplicantsFitScoreTabsProps,
  ApplicantsHeaderActionsProps,
} from './ApplicantsPageHeaderPartsTypes';

export function ApplicantsFitScoreTabs({
  applicantSettings,
  applicantScoreCounts,
  aiRecordCount,
  horizontalSelectedFitScoreGrades,
  horizontalSelectedMatchingFitScoreGrades,
  isAiSearchActive,
  onClearAllHorizontalFitScoreFilters,
  onGradeToggle,
  onMatchingGradeToggle,
}: ApplicantsFitScoreTabsProps) {
  if (applicantSettings?.fitScoreType === 'applied') {
    return (
      <FitScoreFilterTabs
        selectedGrades={horizontalSelectedFitScoreGrades}
        onGradeToggle={onGradeToggle}
        onClearAll={onClearAllHorizontalFitScoreFilters}
        applicantCounts={applicantScoreCounts?.applied || []}
        className=""
        filterMode={applicantSettings.fitScoreFilterMode}
        aiMatchedCount={aiRecordCount}
        isAiSearchActive={isAiSearchActive}
      />
    );
  }

  if (applicantSettings?.fitScoreType === 'matching') {
    return (
      <FitScoreFilterTabs
        selectedGrades={horizontalSelectedMatchingFitScoreGrades}
        onGradeToggle={onMatchingGradeToggle}
        onClearAll={onClearAllHorizontalFitScoreFilters}
        applicantCounts={applicantScoreCounts?.matching || []}
        className=""
        filterMode={applicantSettings.fitScoreFilterMode}
        aiMatchedCount={aiRecordCount}
        isAiSearchActive={isAiSearchActive}
      />
    );
  }

  return null;
}

export function ApplicantsHeaderActions({
  activeFilterCount,
  advancedQuery,
  availablePositions,
  availableRecruiter,
  availableSources,
  availableStages,
  exportImportFeatureEnabled,
  filters,
  groupBy,
  isAiSearchActive,
  isFilterDataLoading,
  isFilterPinned,
  isLoading,
  onAddApplicant,
  onAiSearch,
  onBulkUpload,
  onCancelAiSearch,
  onClearAllFilters,
  onExport,
  onFilterChange,
  onGroupByChange,
  onImport,
  onSettings,
  onToggleFilterPin,
  tableLoading,
  viewSwitcherProps,
}: ApplicantsHeaderActionsProps) {
  const actionsDisabled = isLoading || tableLoading;

  return (
    <div className="flex flex-wrap items-center gap-2 xl:ml-3 xl:flex-nowrap xl:justify-end">
      {viewSwitcherProps ? <ApplicantsRecruitmentViewSwitch {...viewSwitcherProps} /> : null}

      <ApplicantFilterPopover
        filters={filters}
        onFilterChange={onFilterChange}
        onAiSearch={onAiSearch}
        onCancelAiSearch={onCancelAiSearch}
        onClearAllFilters={onClearAllFilters}
        availablePositions={availablePositions}
        availableStages={availableStages}
        availableRecruiter={availableRecruiter}
        availableSources={availableSources}
        isLoading={isLoading || isFilterDataLoading}
        isAiSearching={isAiSearchActive}
        advancedQuery={advancedQuery}
        activeFilterCount={activeFilterCount}
        isFilterPinned={isFilterPinned}
        onTogglePin={onToggleFilterPin}
      />

      <ApplicantsHeaderUploadButton
        disabled={actionsDisabled}
        onBulkUpload={onBulkUpload}
      />

      <ApplicantsHeaderActionsMenu
        disabled={actionsDisabled}
        exportImportFeatureEnabled={exportImportFeatureEnabled}
        groupBy={groupBy}
        onAddApplicant={onAddApplicant}
        onExport={onExport}
        onGroupByChange={onGroupByChange}
        onImport={onImport}
        onSettings={onSettings}
      />
    </div>
  );
}

export function AiSearchResultBanner({
  aiRecordCount,
  aiSearchReasoning,
}: AiSearchResultBannerProps) {
  if (!aiSearchReasoning) return null;

  return (
    <div className="mt-3 rounded-lg bg-primary/5 p-3 dark:bg-primary/10">
      <div className="flex items-start gap-2">
        <Brain className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-primary">
              AI search results
            </span>
            <Badge className="bg-primary/20 text-xs text-primary dark:bg-primary/30 dark:text-primary-foreground">
              {aiRecordCount} matched
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {aiSearchReasoning}
          </p>
        </div>
      </div>
    </div>
  );
}
