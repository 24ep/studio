"use client";

import { PositionsMobileFilterDialog } from "@/components/positions/PositionsMobileFilterDialog";
import { PositionsMobileFloatingActions } from "@/components/positions/PositionsMobileFloatingActions";
import type { PositionStatusFilter } from "@/components/positions/position-page-utils";

export function PositionsPageMobileControls({
  activeFilterCount,
  allDepartments,
  departmentFilter,
  isLoadingDepartments,
  isMobileFilterModalOpen,
  onAddModalOpenChange,
  onClearSearch,
  onDepartmentChange,
  onMobileFilterModalOpenChange,
  onOpenMobileFilters,
  onRetryDepartments,
  onSearchChange,
  onStatusChange,
  searchTerm,
  statusFilter,
}: {
  activeFilterCount: number;
  allDepartments: string[];
  departmentFilter: string;
  isLoadingDepartments: boolean;
  isMobileFilterModalOpen: boolean;
  onAddModalOpenChange: (open: boolean) => void;
  onClearSearch: () => void;
  onDepartmentChange: (department: string) => void;
  onMobileFilterModalOpenChange: (open: boolean) => void;
  onOpenMobileFilters: () => void;
  onRetryDepartments: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: PositionStatusFilter) => void;
  searchTerm: string;
  statusFilter: PositionStatusFilter;
}) {
  return (
    <>
      <PositionsMobileFloatingActions
        activeFilterCount={activeFilterCount}
        onOpenFilters={onOpenMobileFilters}
        onAddPosition={() => onAddModalOpenChange(true)}
      />

      <PositionsMobileFilterDialog
        isOpen={isMobileFilterModalOpen}
        onOpenChange={onMobileFilterModalOpenChange}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onClearSearch={onClearSearch}
        statusFilter={statusFilter}
        onStatusChange={onStatusChange}
        departmentFilter={departmentFilter}
        onDepartmentChange={onDepartmentChange}
        allDepartments={allDepartments}
        isLoadingDepartments={isLoadingDepartments}
        onRetryDepartments={onRetryDepartments}
      />
    </>
  );
}
