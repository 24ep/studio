"use client";

import type { Position } from "@/lib/types";

import { type AddPositionFormValues } from "@/components/positions/AddPositionModal";
import type { PositionStatusFilter } from "@/components/positions/position-page-utils";
import {
  AddPositionResponsiveModal,
  PositionsPageDeleteDialogs,
  PositionsPageDetailDrawers,
  PositionsPageImportAndBulkModals,
  PositionsPageMobileControls,
} from "@/components/positions/PositionsPageModalParts";

interface PositionsPageModalsProps {
  isMobile: boolean;
  isAddModalOpen: boolean;
  onAddModalOpenChange: (open: boolean) => void;
  onAddPosition: (formData: AddPositionFormValues) => Promise<void>;
  isImportModalOpen: boolean;
  onImportModalOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
  positionToDelete: Position | null;
  onPositionToDeleteChange: (position: Position | null) => void;
  onDeletePosition: () => Promise<void>;
  showBulkDeleteConfirm: boolean;
  onShowBulkDeleteConfirmChange: (open: boolean) => void;
  selectedCount: number;
  onBulkDelete: () => Promise<void>;
  isBulkMatchCriteriaModalOpen: boolean;
  onBulkMatchCriteriaModalOpenChange: (open: boolean) => void;
  onBulkMatchCriteriaUpdate: (matchCriteria: string) => Promise<void>;
  isNewDrawerOpen: boolean;
  onNewDrawerOpenChange: (open: boolean) => void;
  selectedPositionId: string | null;
  isEditDrawerOpen: boolean;
  onEditDrawerOpenChange: (open: boolean) => void;
  editingPositionId: string | null;
  activeFilterCount: number;
  onOpenMobileFilters: () => void;
  isMobileFilterModalOpen: boolean;
  onMobileFilterModalOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  statusFilter: PositionStatusFilter;
  onStatusChange: (status: PositionStatusFilter) => void;
  departmentFilter: string;
  onDepartmentChange: (department: string) => void;
  allDepartments: string[];
  isLoadingDepartments: boolean;
  onRetryDepartments: () => void;
}

export function PositionsPageModals({
  isMobile,
  isAddModalOpen,
  onAddModalOpenChange,
  onAddPosition,
  isImportModalOpen,
  onImportModalOpenChange,
  onImportSuccess,
  positionToDelete,
  onPositionToDeleteChange,
  onDeletePosition,
  showBulkDeleteConfirm,
  onShowBulkDeleteConfirmChange,
  selectedCount,
  onBulkDelete,
  isBulkMatchCriteriaModalOpen,
  onBulkMatchCriteriaModalOpenChange,
  onBulkMatchCriteriaUpdate,
  isNewDrawerOpen,
  onNewDrawerOpenChange,
  selectedPositionId,
  isEditDrawerOpen,
  onEditDrawerOpenChange,
  editingPositionId,
  activeFilterCount,
  onOpenMobileFilters,
  isMobileFilterModalOpen,
  onMobileFilterModalOpenChange,
  searchTerm,
  onSearchChange,
  onClearSearch,
  statusFilter,
  onStatusChange,
  departmentFilter,
  onDepartmentChange,
  allDepartments,
  isLoadingDepartments,
  onRetryDepartments,
}: PositionsPageModalsProps) {
  return (
    <>
      <AddPositionResponsiveModal
        isAddModalOpen={isAddModalOpen}
        isMobile={isMobile}
        onAddModalOpenChange={onAddModalOpenChange}
        onAddPosition={onAddPosition}
      />

      <PositionsPageImportAndBulkModals
        isBulkMatchCriteriaModalOpen={isBulkMatchCriteriaModalOpen}
        isImportModalOpen={isImportModalOpen}
        onBulkMatchCriteriaModalOpenChange={onBulkMatchCriteriaModalOpenChange}
        onBulkMatchCriteriaUpdate={onBulkMatchCriteriaUpdate}
        onImportModalOpenChange={onImportModalOpenChange}
        onImportSuccess={onImportSuccess}
        selectedCount={selectedCount}
      />

      <PositionsPageDeleteDialogs
        onBulkDelete={onBulkDelete}
        onDeletePosition={onDeletePosition}
        onPositionToDeleteChange={onPositionToDeleteChange}
        onShowBulkDeleteConfirmChange={onShowBulkDeleteConfirmChange}
        positionToDelete={positionToDelete}
        selectedCount={selectedCount}
        showBulkDeleteConfirm={showBulkDeleteConfirm}
      />

      <PositionsPageDetailDrawers
        editingPositionId={editingPositionId}
        isEditDrawerOpen={isEditDrawerOpen}
        isNewDrawerOpen={isNewDrawerOpen}
        onEditDrawerOpenChange={onEditDrawerOpenChange}
        onNewDrawerOpenChange={onNewDrawerOpenChange}
        selectedPositionId={selectedPositionId}
      />

      <PositionsPageMobileControls
        activeFilterCount={activeFilterCount}
        allDepartments={allDepartments}
        departmentFilter={departmentFilter}
        isLoadingDepartments={isLoadingDepartments}
        isMobileFilterModalOpen={isMobileFilterModalOpen}
        onAddModalOpenChange={onAddModalOpenChange}
        onClearSearch={onClearSearch}
        onDepartmentChange={onDepartmentChange}
        onMobileFilterModalOpenChange={onMobileFilterModalOpenChange}
        onOpenMobileFilters={onOpenMobileFilters}
        onRetryDepartments={onRetryDepartments}
        onSearchChange={onSearchChange}
        onStatusChange={onStatusChange}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
      />
    </>
  );
}
