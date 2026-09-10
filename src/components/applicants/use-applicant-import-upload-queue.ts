"use client";

import { useCallback, useEffect, useState } from "react";

import {
  buildUploadQueueQueryParams,
} from "./applicant-import-queue-utils";
import {
  fetchUploadQueueData,
} from "./applicant-import-upload-queue-api";
import type { QueueResponse } from "./applicant-import-queue-types";
import { useApplicantImportQueueRealtime } from "./hooks/use-applicant-import-queue-realtime";
import { useApplicantImportUploadQueueActions } from "./use-applicant-import-upload-queue-actions";
import { useApplicantImportUploadQueueFilters } from "./use-applicant-import-upload-queue-filters";
import { useApplicantImportUploadQueueReferenceData } from "./use-applicant-import-upload-queue-reference-data";
import { useApplicantImportUploadQueueSelection } from "./use-applicant-import-upload-queue-selection";
import { useApplicantImportUploadQueueUiState } from "./use-applicant-import-upload-queue-ui-state";

export function useApplicantImportUploadQueue() {
  const [queueData, setQueueData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const filters = useApplicantImportUploadQueueFilters();
  const referenceData = useApplicantImportUploadQueueReferenceData();
  const selection = useApplicantImportUploadQueueSelection(queueData?.data);
  const uiState = useApplicantImportUploadQueueUiState();

  const fetchQueue = useCallback(async (
    currentPage = filters.page,
    currentPageSize = filters.pageSize,
  ) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const params = buildUploadQueueQueryParams({
        currentPage,
        currentPageSize,
        searchTerm: filters.searchTerm,
        statusFilter: filters.statusFilter,
        positionFilter: filters.positionFilter,
        sourceFilter: filters.sourceFilter,
        dateRange: filters.dateRange,
        dateFilterType: filters.dateFilterType,
        sortField: filters.sortField,
        sortDirection: filters.sortDirection,
      });

      const data = await fetchUploadQueueData(params);
      setQueueData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch queue:", error);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [
    filters.dateFilterType,
    filters.dateRange,
    filters.page,
    filters.pageSize,
    filters.positionFilter,
    filters.searchTerm,
    filters.sortDirection,
    filters.sortField,
    filters.sourceFilter,
    filters.statusFilter,
  ]);

  useEffect(() => {
    fetchQueue(filters.page, filters.pageSize);
  }, [fetchQueue, filters.page, filters.pageSize]);

  useApplicantImportQueueRealtime({
    loading,
    page: filters.page,
    pageSize: filters.pageSize,
    fetchQueue,
    setQueueData,
    setLastUpdate,
  });

  const actions = useApplicantImportUploadQueueActions({
    clearSelection: selection.clearSelection,
    fetchQueue,
    page: filters.page,
    pageSize: filters.pageSize,
    setQueueData,
  });

  const handleSearch = useCallback(() => {
    filters.resetToFirstPage();
    fetchQueue(1, filters.pageSize);
  }, [fetchQueue, filters]);

  return {
    availableSources: referenceData.availableSources,
    clearAllFilters: filters.clearAllFilters,
    clearDateRange: filters.clearDateRange,
    dateFilterType: filters.dateFilterType,
    dateRange: filters.dateRange,
    errorMessage,
    fetchQueue,
    handleBulkDelete: actions.handleBulkDelete,
    handleBulkRetry: actions.handleBulkRetry,
    handleDateFilterTypeChange: filters.handleDateFilterTypeChange,
    handleDateRangeChange: filters.handleDateRangeChange,
    handleDeleteItem: actions.handleDeleteItem,
    handleFilePreview: uiState.handleFilePreview,
    handleMenuClick: uiState.handleMenuClick,
    handleOpenChange: uiState.handleOpenChange,
    handlePositionFilterChange: filters.handlePositionFilterChange,
    handleRetryItem: actions.handleRetryItem,
    handleSearch,
    handleSelectAll: selection.handleSelectAll,
    handleSelectItem: selection.handleSelectItem,
    handleShowDetails: uiState.handleShowDetails,
    handleSort: filters.handleSort,
    handleSourceFilterChange: filters.handleSourceFilterChange,
    handleStatusFilterChange: filters.handleStatusFilterChange,
    isFileViewerOpen: uiState.isFileViewerOpen,
    loading,
    openMenu: uiState.openMenu,
    openSelect: uiState.openSelect,
    page: filters.page,
    pageSize: filters.pageSize,
    positionFilter: filters.positionFilter,
    positionSearchTerm: filters.positionSearchTerm,
    positions: referenceData.positions,
    queueData,
    searchTerm: filters.searchTerm,
    selectedFile: uiState.selectedFile,
    selectedItem: uiState.selectedItem,
    selectedItems: selection.selectedItems,
    selectionMode: selection.selectionMode,
    setDatePreset: filters.setDatePreset,
    setIsFileViewerOpen: uiState.setIsFileViewerOpen,
    setOpenMenu: uiState.setOpenMenu,
    setOpenSelect: uiState.setOpenSelect,
    setPage: filters.setPage,
    setPageSize: filters.setPageSize,
    setPositionSearchTerm: filters.setPositionSearchTerm,
    setSearchTerm: filters.setSearchTerm,
    setSelectedItems: selection.setSelectedItems,
    setShowDetails: uiState.setShowDetails,
    setSourceSearchTerm: filters.setSourceSearchTerm,
    showDetails: uiState.showDetails,
    sortDirection: filters.sortDirection,
    sortField: filters.sortField,
    sourceFilter: filters.sourceFilter,
    sourceSearchTerm: filters.sourceSearchTerm,
    statusFilter: filters.statusFilter,
  };
}
