"use client";

import React from "react";

import { PositionsDesktopToolbar } from "./PositionsDesktopToolbar";
import { PositionsListContent } from "./PositionsListContent";
import { PositionsMobileSearchBar } from "./PositionsMobileSearchBar";
import type { PositionsPageController } from "./use-positions-page-controller";

interface PositionsPageMainContentProps {
  page: PositionsPageController;
}

export function PositionsPageMainContent({ page }: PositionsPageMainContentProps) {
  const { filters, referenceData, searchControls, uiState } = page;

  return (
    <div className="flex h-full overflow-hidden">
      <section className="positions-content-area h-full min-w-0 flex-1 border-y border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div ref={page.contentRef} className="flex flex-col h-full overflow-hidden">
          {page.isMobile && (
            <>
              <div className="border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
                <h1 className="text-xl font-bold text-slate-950 dark:text-zinc-50">Positions</h1>
                <p className="text-sm text-slate-500 dark:text-zinc-400">
                  {page.total} {page.total === 1 ? "position" : "positions"}
                </p>
              </div>
              <PositionsMobileSearchBar
                searchTerm={filters.searchTerm}
                inputRef={searchControls.searchInputRef}
                onSearchChange={searchControls.handleSearchChange}
                onSearchFocus={searchControls.handleSearchFocus}
                onSearchKeyDown={searchControls.handleSearchKeyDown}
                onClearSearch={page.handleClearSearch}
              />
            </>
          )}

          <PositionsDesktopToolbar
            isLoading={page.isLoading}
            total={page.total}
            openPositionCount={page.vacantFromOpenPositions.totalOpen}
            searchTerm={filters.searchTerm}
            statusFilter={filters.statusFilter}
            departmentFilter={filters.departmentFilter}
            selectedHiringManagerId={filters.selectedHiringManagerId}
            selectedRecruiterId={filters.selectedRecruiterId}
            allDepartments={referenceData.allDepartments}
            availableHiringManagers={page.availableHiringManagers}
            availableRecruiters={page.availableRecruiter}
            isLoadingDepartments={referenceData.isLoadingDepartments}
            activeFilterCount={filters.activeFilterCount}
            gradeFilter={filters.gradeFilter}
            allGrades={referenceData.allGrades}
            onSearchChange={searchControls.handleSearchChange}
            onStatusChange={filters.handleStatusFilterChange}
            onDepartmentChange={filters.handleDepartmentSelect}
            onHiringManagerChange={filters.handleHiringManagerSelect}
            onRecruiterChange={filters.handleRecruiterSelect}
            onClearFilters={filters.clearVisibleFilters}
            onGradeChange={filters.handleGradeSelect}
            onAddPosition={() => uiState.setIsAddModalOpen(true)}
            onImportPositions={() => page.setIsImportModalOpen(true)}
            onExportPositions={page.handleExportPositions}
          />

          <PositionsListContent
            positions={page.positions}
            sortedPositions={page.sortedPositions}
            isMobile={page.isMobile}
            isLoading={page.isLoading}
            isTableLoading={page.isTableLoading}
            isJobMatchEnabled={page.isJobMatchEnabled}
            isLoadingHeadcount={page.isLoadingHeadcount}
            emptyStateMessage={filters.emptyStateMessage}
            showAddFirstPositionButton={filters.showAddFirstPositionButton}
            mobileDisplayCount={page.mobileDisplayCount}
            onMobileDisplayCountChange={page.setMobileDisplayCount}
            pullToRefreshRef={page.pullToRefreshRef as React.RefObject<HTMLDivElement>}
            pullProgress={page.pullProgress}
            isRefreshing={page.isRefreshing}
            headcountData={page.headcountData}
            page={filters.page}
            pageSize={filters.pageSize}
            totalPages={page.totalPages}
            total={page.total}
            selectedIds={page.selectedIds}
            allSelected={page.allSelected}
            sortColumn={uiState.sortColumn}
            sortDirection={uiState.sortDirection}
            openMenu={uiState.openMenu}
            availableRecruiter={page.availableRecruiter}
            canAssignPositionRecruiter={page.canAssignPositionRecruiter}
            assigningRecruiter={page.assigningRecruiter}
            onAddPosition={() => uiState.setIsAddModalOpen(true)}
            onMobilePositionClick={page.openPosition}
            onMobileEditClick={page.handleMobileEditClick}
            onMobileDeleteClick={page.handleMobileDeleteClick}
            onUpdateMatchCriteria={() => page.setIsBulkMatchCriteriaModalOpen(true)}
            onBulkDelete={() => page.setShowBulkDeleteConfirm(true)}
            onClearSelection={() => page.setSelectedIds([])}
            onSelectAll={page.handleSelectAll}
            onRowSelect={page.handleRowSelect}
            onOpenMenuChange={uiState.setOpenMenu}
            onSort={uiState.handleSort}
            onViewPosition={page.openPosition}
            onEditPosition={page.editPosition}
            onDeletePosition={uiState.setPositionToDelete}
            onAssignRecruiter={page.handleAssignRecruiterToPosition}
            onResetAssigning={page.resetAssigningRecruiter}
            onPageChange={page.handlePageChange}
            onPageSizeChange={page.handlePageSizeChange}
          />
        </div>
      </section>
    </div>
  );
}
