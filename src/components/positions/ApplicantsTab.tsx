"use client";

import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import { AppliedApplicantsTable } from './AppliedApplicantsTable';
import {
  ApplicantFiltersToolbar,
  ApplicantSubTabs,
  ApplicantTabPagination,
  ApplicantTableSurface,
  ApplicantViewMenu,
} from './ApplicantsTabParts';
import type { ApplicantsTabProps, VisibleApplicantColumns } from './ApplicantsTabTypes';
import { PotentialApplicantsTable } from './PotentialApplicantsTable';

const DEFAULT_VISIBLE_COLUMNS: VisibleApplicantColumns = {
  name: true,
  fitScore: true,
  expectedSalary: true,
  status: true,
  applicationDate: true,
  actions: true,
};

export function ApplicantsTab({
  isMobile,
  isJobMatchEnabled,
  activeApplicantTab,
  onActiveApplicantTabChange,
  sortedAppliedApplicants,
  appliedApplicantsSearchTerm,
  appliedApplicantsSortColumn,
  appliedApplicantsSortDirection,
  appliedApplicantsOpenMenu,
  appliedApplicantsPage,
  appliedApplicantsPageSize,
  appliedApplicantsTotal,
  appliedApplicantsCount,
  onAppliedApplicantsSearchChange,
  onAppliedApplicantsSort,
  onAppliedApplicantsOpenMenuChange,
  onAppliedApplicantsPageChange,
  onAppliedApplicantsPageSizeChange,
  onAppliedApplicantPinToggle,
  sortedPotentialApplicants,
  potentialApplicantsSearchTerm,
  potentialApplicantsSortColumn,
  potentialApplicantsSortDirection,
  potentialApplicantsOpenMenu,
  potentialApplicantsPage,
  potentialApplicantsPageSize,
  potentialApplicantsTotal,
  onPotentialApplicantsSearchChange,
  onPotentialApplicantsSort,
  onPotentialApplicantsOpenMenuChange,
  onPotentialApplicantsPageChange,
  onPotentialApplicantsPageSizeChange,
  onPotentialApplicantPinToggle,
  stageNames,
  onApplicantClick,
  applicantFilters,
  onFilterChange,
  onAiSearch,
  onClearFilters,
  isAiSearching = false,
  availableRecruiters,
  availableStages,
  availableSources,
  availablePositions,
}: ApplicantsTabProps) {
  const [visibleColumns, setVisibleColumns] = useState<VisibleApplicantColumns>(DEFAULT_VISIBLE_COLUMNS);

  const filterToolbarProps = {
    applicantFilters,
    availablePositions,
    availableRecruiters,
    availableSources,
    availableStages,
    isAiSearching,
    onAiSearch,
    onClearFilters,
    onFilterChange,
  };

  return (
    <div className={cn('h-full flex flex-col', isMobile ? 'p-4 pb-0' : 'p-6')}>
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {isJobMatchEnabled && (
            <ApplicantSubTabs
              activeApplicantTab={activeApplicantTab}
              appliedApplicantsCount={appliedApplicantsCount}
              isMobile={isMobile}
              onActiveApplicantTabChange={onActiveApplicantTabChange}
              potentialApplicantsTotal={potentialApplicantsTotal}
            />
          )}

          {activeApplicantTab === 'applied' && (
            <div className="space-y-4 flex-1 min-h-0 flex flex-col">
              <ApplicantFiltersToolbar
                {...filterToolbarProps}
                onSearchChange={onAppliedApplicantsSearchChange}
                searchPlaceholder="Search applied Applicants..."
                searchTerm={appliedApplicantsSearchTerm}
                showSearchClear
              >
                <ApplicantViewMenu
                  onVisibleColumnsChange={setVisibleColumns}
                  visibleColumns={visibleColumns}
                />
              </ApplicantFiltersToolbar>

              <ApplicantTableSurface isMobile={isMobile}>
                <AppliedApplicantsTable
                  applicants={sortedAppliedApplicants}
                  sortColumn={appliedApplicantsSortColumn}
                  sortDirection={appliedApplicantsSortDirection}
                  openMenu={appliedApplicantsOpenMenu}
                  stageNames={stageNames}
                  onSort={onAppliedApplicantsSort}
                  onOpenMenuChange={onAppliedApplicantsOpenMenuChange}
                  onApplicantClick={onApplicantClick}
                  onPinToggle={onAppliedApplicantPinToggle}
                  visibleColumns={visibleColumns}
                />
              </ApplicantTableSurface>

              <ApplicantTabPagination
                currentPage={appliedApplicantsPage}
                pageSize={appliedApplicantsPageSize}
                total={appliedApplicantsTotal}
                onPageChange={onAppliedApplicantsPageChange}
                onPageSizeChange={onAppliedApplicantsPageSizeChange}
              />
            </div>
          )}

          {activeApplicantTab === 'potential' && isJobMatchEnabled && (
            <div className="space-y-4 flex-1 min-h-0 flex flex-col">
              <ApplicantFiltersToolbar
                {...filterToolbarProps}
                onSearchChange={onPotentialApplicantsSearchChange}
                searchPlaceholder="Search job matches..."
                searchTerm={potentialApplicantsSearchTerm}
              />

              <ApplicantTableSurface isMobile={isMobile}>
                <PotentialApplicantsTable
                  applicants={sortedPotentialApplicants}
                  sortColumn={potentialApplicantsSortColumn}
                  sortDirection={potentialApplicantsSortDirection}
                  openMenu={potentialApplicantsOpenMenu}
                  stageNames={stageNames}
                  onSort={onPotentialApplicantsSort}
                  onOpenMenuChange={onPotentialApplicantsOpenMenuChange}
                  onApplicantClick={onApplicantClick}
                  onPinToggle={onPotentialApplicantPinToggle}
                />
              </ApplicantTableSurface>

              <ApplicantTabPagination
                currentPage={potentialApplicantsPage}
                pageSize={potentialApplicantsPageSize}
                total={potentialApplicantsTotal}
                onPageChange={onPotentialApplicantsPageChange}
                onPageSizeChange={onPotentialApplicantsPageSizeChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
