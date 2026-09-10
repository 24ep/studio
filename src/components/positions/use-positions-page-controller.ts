"use client";

import { useMemo } from "react";

import { usePositionBulkActions } from "./hooks/use-position-bulk-actions";
import { usePositionCrudActions } from "./hooks/use-position-crud-actions";
import { usePositionsPageActions } from "./hooks/use-positions-page-actions";
import { usePositionRecruiterAssignment } from "./hooks/use-position-recruiter-assignment";
import { usePositionReferenceData } from "./hooks/use-position-reference-data";
import { usePositionsPageFilters } from "./hooks/use-positions-page-filters";
import { usePositionsPageUiState } from "./hooks/use-positions-page-ui-state";
import { usePositionsPageControllerEffects } from "./use-positions-page-controller-effects";
import { usePositionsPageDataController } from "./use-positions-page-data-controller";
import { usePositionsPageRuntime } from "./use-positions-page-runtime";
import {
  buildPositionTotalPages,
  getRecruiterNameById,
} from "./position-page-utils";

export function usePositionsPageController() {
  const runtime = usePositionsPageRuntime();
  const {
    canAssignPositionRecruiter,
    canCreatePositions,
    isJobMatchEnabled,
    isMobile,
    isPreferencesLoaded,
    isUpdatingURLRef,
    preferences,
    session,
    updatePositionsPreferences,
  } = runtime;

  const filters = usePositionsPageFilters({
    preferences,
    isPreferencesLoaded,
    canCreatePositions,
    updatePositionsPreferences,
    isUpdatingURLRef,
  });

  const isLoadingHeadcount = false;

  const referenceData = usePositionReferenceData();
  const dataController = usePositionsPageDataController({
    filters,
    isMobile,
  });
  const {
    availableHiringManagers,
    fetchPositions,
    headcountData,
    isLoading,
    isTableLoading,
    positions,
    setPositions,
    total,
    vacantFromOpenPositions,
  } = dataController.dataState;
  const { searchControls } = dataController;
  const {
    elementRef: pullToRefreshRef,
    isRefreshing,
    pullProgress,
  } = dataController.pullToRefresh;

  const totalPages = useMemo(
    () => buildPositionTotalPages(total, filters.pageSize),
    [filters.pageSize, total],
  );

  const recruiterAssignment = usePositionRecruiterAssignment({
    positions,
    availableRecruiter: referenceData.availableRecruiter,
    setPositions,
    fetchRecruiterStats: referenceData.fetchRecruiterStats,
  });

  usePositionsPageControllerEffects({
    dataController,
    filters,
    referenceData,
    runtime,
  });

  const uiState = usePositionsPageUiState({
    positions,
    fetchPositions,
  });

  const bulkActions = usePositionBulkActions({
    filteredPositions: positions,
    setPositions,
    fetchRecruiterStats: referenceData.fetchRecruiterStats,
  });

  const selectedRecruiterName = useMemo(() => {
    if (filters.selectedRecruiterId === "unassigned") return null;
    return getRecruiterNameById(referenceData.availableRecruiter, filters.selectedRecruiterId);
  }, [filters.selectedRecruiterId, referenceData.availableRecruiter]);

  const crudActions = usePositionCrudActions({
    positionToDelete: uiState.positionToDelete,
    setPositionToDelete: uiState.setPositionToDelete,
    setPositions,
    setIsAddModalOpen: uiState.setIsAddModalOpen,
    fetchAllDepartments: referenceData.fetchAllDepartments,
    fetchRecruiterStats: referenceData.fetchRecruiterStats,
  });

  const pageActions = usePositionsPageActions({
    fetchPositions,
    filters,
    referenceData,
    uiState,
  });

  return {
    allSelected: bulkActions.allSelected,
    assigningRecruiter: recruiterAssignment.assigningRecruiter,
    availableHiringManagers,
    availableRecruiter: referenceData.availableRecruiter,
    canAssignPositionRecruiter,
    contentRef: dataController.contentRef,
    filters,
    headcountData,
    isImportModalOpen: uiState.isImportModalOpen,
    isJobMatchEnabled,
    isLoading,
    isLoadingHeadcount,
    isMobile,
    isRefreshing,
    isTableLoading,
    mobileDisplayCount: dataController.mobileDisplayCount,
    positionToDelete: uiState.positionToDelete,
    positions,
    pullProgress,
    pullToRefreshRef,
    referenceData,
    searchControls,
    selectedIds: bulkActions.selectedIds,
    selectedRecruiterName,
    showBulkDeleteConfirm: bulkActions.showBulkDeleteConfirm,
    sortedPositions: uiState.sortedPositions,
    total,
    totalPages,
    uiState,
    vacantFromOpenPositions,
    handleAddPosition: crudActions.handleAddPosition,
    handleAssignRecruiterToPosition: recruiterAssignment.handleAssignRecruiterToPosition,
    handleBulkDelete: bulkActions.handleBulkDelete,
    handleBulkMatchCriteriaUpdate: bulkActions.handleBulkMatchCriteriaUpdate,
    handleClearSearch: searchControls.handleClearSearch,
    handleDeletePosition: crudActions.handleDeletePosition,
    handleExportPositions: crudActions.handleExportPositions,
    handleImportSuccess: pageActions.handleImportSuccess,
    handleMobileDeleteClick: pageActions.handleMobileDeleteClick,
    handleMobileEditClick: pageActions.handleMobileEditClick,
    handlePageChange: pageActions.handlePageChange,
    handlePageSizeChange: pageActions.handlePageSizeChange,
    handleRowSelect: bulkActions.handleRowSelect,
    handleSelectAll: bulkActions.handleSelectAll,
    openPosition: pageActions.openPosition,
    editPosition: pageActions.editPosition,
    resetAssigningRecruiter: recruiterAssignment.resetAssigningRecruiter,
    setIsImportModalOpen: uiState.setIsImportModalOpen,
    setMobileDisplayCount: dataController.setMobileDisplayCount,
    setSelectedIds: bulkActions.setSelectedIds,
    setShowBulkDeleteConfirm: bulkActions.setShowBulkDeleteConfirm,
    setIsBulkMatchCriteriaModalOpen: bulkActions.setIsBulkMatchCriteriaModalOpen,
    isBulkMatchCriteriaModalOpen: bulkActions.isBulkMatchCriteriaModalOpen,
  };
}

export type PositionsPageController = ReturnType<typeof usePositionsPageController>;
