"use client";

import type React from "react";

import type {
  MyTasksFilters,
  MyTasksRecruiter,
  MyTasksStage,
  TaskboardApplicant,
} from "@/components/tasks/my-tasks-page-utils";
import {
  ApplicantCountBadge,
  ApplicantSearchInput,
  BoardHeaderActions,
  PositionFilter,
  RecruiterFilter,
  StageFilter,
} from "./MyTasksBoardHeaderParts";
import { MyTasksFitScoreFilterTabs } from "./MyTasksFitScoreFilterTabs";
import { MyTasksBoardFilterPopover } from "./MyTasksBoardFilterPopover";

interface MyTasksBoardHeaderProps {
  applicants: TaskboardApplicant[];
  loading: boolean;
  filters: MyTasksFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<MyTasksFilters>>;
  searchInputRef: React.Ref<HTMLInputElement>;
  recruiters: MyTasksRecruiter[];
  canSeeAllRecruiter: boolean;
  isRecruiter: boolean;
  totalApplicants: number;
  displayedApplicantsCount: number;
  stages: MyTasksStage[];
  selectedStages: string[];
  isStageFilterOpen: boolean;
  onStageFilterOpenChange: (open: boolean) => void;
  onToggleStageSelection: (stageId: string) => void;
  viewMode: "kanban" | "table";
  onViewModeChange: (viewMode: string) => void;
  onOpenCardSettings: () => void;
  hasNetworkError: boolean;
  onOpenNetworkDiagnostics: () => void;
  embedded?: boolean;
  leadingControls?: React.ReactNode;
  trailingControls?: React.ReactNode;
  onClearFilters: () => void;
}

export function MyTasksBoardHeader({
  applicants,
  loading,
  filters,
  onFiltersChange,
  searchInputRef,
  recruiters,
  canSeeAllRecruiter,
  isRecruiter,
  totalApplicants,
  displayedApplicantsCount,
  stages,
  selectedStages,
  isStageFilterOpen,
  onStageFilterOpenChange,
  onToggleStageSelection,
  viewMode,
  onViewModeChange,
  onOpenCardSettings,
  hasNetworkError,
  onOpenNetworkDiagnostics,
  embedded = false,
  leadingControls,
  trailingControls,
  onClearFilters,
}: MyTasksBoardHeaderProps) {
  if (embedded) {
    return (
      <div className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background px-4 py-2">
        <div className="min-w-0 flex-1">
          <MyTasksFitScoreFilterTabs
            applicants={applicants}
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2">
          {leadingControls}
          <MyTasksBoardFilterPopover
            canSeeAllRecruiter={canSeeAllRecruiter}
            filters={filters}
            isStageFilterOpen={isStageFilterOpen}
            onClearFilters={onClearFilters}
            onFiltersChange={onFiltersChange}
            onStageFilterOpenChange={onStageFilterOpenChange}
            onToggleStageSelection={onToggleStageSelection}
            recruiters={recruiters}
            selectedStages={selectedStages}
            stages={stages}
          />
          {trailingControls}
          <BoardHeaderActions
            hasNetworkError={hasNetworkError}
            onOpenCardSettings={onOpenCardSettings}
            onOpenNetworkDiagnostics={onOpenNetworkDiagnostics}
            onViewModeChange={onViewModeChange}
            showViewSwitcher={false}
            viewMode="kanban"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-b border-border shadow-sm sticky top-0 z-20 backdrop-blur-sm bg-card/95">
      <div className="px-6 py-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <ApplicantCountBadge
              displayedApplicantsCount={displayedApplicantsCount}
              filters={filters}
              isRecruiter={isRecruiter}
              loading={loading}
              totalApplicants={totalApplicants}
            />
            <ApplicantSearchInput
              filters={filters}
              loading={loading}
              onFiltersChange={onFiltersChange}
              searchInputRef={searchInputRef}
            />
            <PositionFilter filters={filters} onFiltersChange={onFiltersChange} />
            <RecruiterFilter
              canSeeAllRecruiter={canSeeAllRecruiter}
              filters={filters}
              onFiltersChange={onFiltersChange}
              recruiters={recruiters}
            />
            <StageFilter
              isStageFilterOpen={isStageFilterOpen}
              onStageFilterOpenChange={onStageFilterOpenChange}
              onToggleStageSelection={onToggleStageSelection}
              selectedStages={selectedStages}
              stages={stages}
            />
          </div>

          <BoardHeaderActions
            hasNetworkError={hasNetworkError}
            onOpenCardSettings={onOpenCardSettings}
            onOpenNetworkDiagnostics={onOpenNetworkDiagnostics}
            onViewModeChange={onViewModeChange}
            viewMode={viewMode}
          />
        </div>
        <MyTasksFitScoreFilterTabs
          applicants={applicants}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </div>
    </div>
  );
}
