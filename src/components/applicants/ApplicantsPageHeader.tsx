"use client";

import type React from 'react';

import type { ApplicantSettings } from './applicant-settings-types';
import type { ApplicantGroupBy } from './applicant-settings-types';
import type { ApplicantFilterValues, Position, RecruitmentStage, UserProfile, ApplicantSource } from '@/lib/types';
import {
  AiSearchResultBanner,
  ApplicantsFitScoreTabs,
  ApplicantsHeaderActions,
} from './ApplicantsPageHeaderParts';
import { ApplicantsRecruitmentViewSwitch } from './ApplicantsRecruitmentViewSwitch';

interface ApplicantsPageHeaderProps {
  applicantSettings: ApplicantSettings | null;
  isMobile: boolean;
  isLoading: boolean;
  tableLoading: boolean;
  horizontalSelectedFitScoreGrades: Set<string>;
  horizontalSelectedMatchingFitScoreGrades: Set<string>;
  onGradeToggle: (grade: string) => void;
  onMatchingGradeToggle: (grade: string) => void;
  onClearAllHorizontalFitScoreFilters: () => void;
  applicantScoreCounts: {
    applied: Array<{ letter: string; count: number }>;
    matching: Array<{ letter: string; count: number }>;
  } | null;
  aiSearchReasoning: string | null;
  aiRecordCount: number;
  isAiSearchActive: boolean;
  exportImportFeatureEnabled: boolean;
  onAddApplicant: () => void;
  onBulkUpload: () => void;
  onExport: () => void;
  onImport: () => void;
  onSettings: () => void;
  // Filter Props
  filters: ApplicantFilterValues;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  onAiSearch: (query: string) => void;
  onCancelAiSearch?: () => void;
  onClearAllFilters: () => void;
  availablePositions: Position[];
  availableStages: RecruitmentStage[];
  availableRecruiter: Pick<UserProfile, 'id' | 'name'>[];
  availableSources: ApplicantSource[];
  isFilterDataLoading?: boolean;
  advancedQuery?: string;
  activeFilterCount: number;
  isFilterPinned?: boolean;
  onToggleFilterPin?: (pinned: boolean) => void;
  groupBy: ApplicantGroupBy;
  onGroupByChange: (groupBy: ApplicantGroupBy) => Promise<void>;
  viewSwitcherProps?: React.ComponentProps<typeof ApplicantsRecruitmentViewSwitch>;
}

export function ApplicantsPageHeader({
  applicantSettings,
  isMobile,
  isLoading,
  tableLoading,
  horizontalSelectedFitScoreGrades,
  horizontalSelectedMatchingFitScoreGrades,
  onGradeToggle,
  onMatchingGradeToggle,
  onClearAllHorizontalFitScoreFilters,
  applicantScoreCounts,
  aiSearchReasoning,
  aiRecordCount,
  isAiSearchActive,
  exportImportFeatureEnabled,
  onAddApplicant,
  onBulkUpload,
  onExport,
  onImport,
  onSettings,
  // Filter props
  filters,
  onFilterChange,
  onAiSearch,
  onCancelAiSearch,
  onClearAllFilters,
  availablePositions,
  availableStages,
  availableRecruiter,
  availableSources,
  isFilterDataLoading,
  advancedQuery,
  activeFilterCount,
  isFilterPinned,
  onToggleFilterPin,
  groupBy,
  onGroupByChange,
  viewSwitcherProps,
}: ApplicantsPageHeaderProps) {
  if (isMobile) {
    return null;
  }

  return (
    <div className="border-b border-border/60 px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ApplicantsFitScoreTabs
            applicantSettings={applicantSettings}
            applicantScoreCounts={applicantScoreCounts}
            aiRecordCount={aiRecordCount}
            horizontalSelectedFitScoreGrades={horizontalSelectedFitScoreGrades}
            horizontalSelectedMatchingFitScoreGrades={horizontalSelectedMatchingFitScoreGrades}
            isAiSearchActive={isAiSearchActive}
            onClearAllHorizontalFitScoreFilters={onClearAllHorizontalFitScoreFilters}
            onGradeToggle={onGradeToggle}
            onMatchingGradeToggle={onMatchingGradeToggle}
          />
        </div>

        <ApplicantsHeaderActions
          activeFilterCount={activeFilterCount}
          advancedQuery={advancedQuery}
          availablePositions={availablePositions}
          availableRecruiter={availableRecruiter}
          availableSources={availableSources}
          availableStages={availableStages}
          exportImportFeatureEnabled={exportImportFeatureEnabled}
          filters={filters}
          groupBy={groupBy}
          isAiSearchActive={isAiSearchActive}
          isFilterDataLoading={isFilterDataLoading}
          isFilterPinned={isFilterPinned}
          isLoading={isLoading}
          onAddApplicant={onAddApplicant}
          onAiSearch={onAiSearch}
          onBulkUpload={onBulkUpload}
          onCancelAiSearch={onCancelAiSearch}
          onClearAllFilters={onClearAllFilters}
          onExport={onExport}
          onFilterChange={onFilterChange}
          onGroupByChange={onGroupByChange}
          onImport={onImport}
          onSettings={onSettings}
          onToggleFilterPin={onToggleFilterPin}
          tableLoading={tableLoading}
          viewSwitcherProps={viewSwitcherProps}
        />
      </div>

      <AiSearchResultBanner aiRecordCount={aiRecordCount} aiSearchReasoning={aiSearchReasoning} />
    </div>
  );
}
