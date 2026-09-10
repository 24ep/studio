"use client";

import { PositionsPageModals } from "./PositionsPageModals";
import type { PositionsPageController } from "./use-positions-page-controller";

interface PositionsPageLayoutModalsProps {
  page: PositionsPageController;
}

export function PositionsPageLayoutModals({ page }: PositionsPageLayoutModalsProps) {
  const { filters, referenceData, searchControls, uiState } = page;

  return (
    <PositionsPageModals
      isMobile={page.isMobile}
      isAddModalOpen={uiState.isAddModalOpen}
      onAddModalOpenChange={uiState.setIsAddModalOpen}
      onAddPosition={page.handleAddPosition}
      isImportModalOpen={page.isImportModalOpen}
      onImportModalOpenChange={page.setIsImportModalOpen}
      onImportSuccess={page.handleImportSuccess}
      positionToDelete={page.positionToDelete}
      onPositionToDeleteChange={uiState.setPositionToDelete}
      onDeletePosition={page.handleDeletePosition}
      showBulkDeleteConfirm={page.showBulkDeleteConfirm}
      onShowBulkDeleteConfirmChange={page.setShowBulkDeleteConfirm}
      selectedCount={page.selectedIds.length}
      onBulkDelete={page.handleBulkDelete}
      isBulkMatchCriteriaModalOpen={page.isBulkMatchCriteriaModalOpen}
      onBulkMatchCriteriaModalOpenChange={page.setIsBulkMatchCriteriaModalOpen}
      onBulkMatchCriteriaUpdate={page.handleBulkMatchCriteriaUpdate}
      isNewDrawerOpen={uiState.isNewDrawerOpen}
      onNewDrawerOpenChange={uiState.handleNewDrawerOpenChange}
      selectedPositionId={uiState.selectedPositionId}
      isEditDrawerOpen={uiState.isEditDrawerOpen}
      onEditDrawerOpenChange={uiState.handleEditDrawerOpenChange}
      editingPositionId={uiState.editingPositionId}
      activeFilterCount={filters.activeFilterCount}
      onOpenMobileFilters={() => uiState.setIsMobileFilterModalOpen(true)}
      isMobileFilterModalOpen={uiState.isMobileFilterModalOpen}
      onMobileFilterModalOpenChange={uiState.setIsMobileFilterModalOpen}
      searchTerm={filters.searchTerm}
      onSearchChange={searchControls.handleSearchChange}
      onClearSearch={page.handleClearSearch}
      statusFilter={filters.statusFilter}
      onStatusChange={filters.handleStatusFilterChange}
      departmentFilter={filters.departmentFilter}
      onDepartmentChange={filters.handleDepartmentSelect}
      allDepartments={referenceData.allDepartments}
      isLoadingDepartments={referenceData.isLoadingDepartments}
      onRetryDepartments={referenceData.fetchAllDepartments}
    />
  );
}
