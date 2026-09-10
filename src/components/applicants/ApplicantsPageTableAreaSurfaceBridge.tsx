"use client";

import React from 'react';
import { ApplicantsPageTableSurface } from './ApplicantsPageTableSurface';
import type { ApplicantsPageTableAreaProps } from './ApplicantsPageTableAreaTypes';

type ApplicantsPageTableAreaSurfaceBridgeProps = ApplicantsPageTableAreaProps & {
  isMobile: boolean;
  isRefreshing: boolean;
  pullProgress: number;
  pullToRefreshRef: React.RefObject<HTMLDivElement>;
};

export function ApplicantsPageTableAreaSurfaceBridge({
  aiMatchedApplicantIdsForRefresh,
  allPinnedApplicants,
  applicantSettings,
  applicantsToRender,
  availablePositions,
  availableRecruiter,
  availableSources,
  availableStages,
  canAssignRecruiter,
  canAssignSource,
  canChangeStatus,
  canDeleteApplicants,
  canEditApplicants,
  canViewDetailed,
  displayedApplicants,
  fetchAllPinnedApplicants,
  fetchTableData,
  filters,
  handleAssignRecruiter,
  handleAssignSource,
  handleBulkAssignRecruiter,
  handleBulkChangeStatus,
  handleBulkDelete,
  handleBulkReprocess,
  handleDeleteApplicant,
  handleGroupByChange,
  handleSortChange,
  groupBy,
  isLoading,
  isMobile,
  isRefreshing,
  page,
  pageSize,
  pullProgress,
  pullToRefreshRef,
  refreshApplicantInList,
  selectedApplicantIds,
  setSelectedApplicantIds,
  setSelectedPositionForEdit,
  sortColumn,
  sortDirection,
  tableHeight,
  tableLoading,
  updateApplicantStatus,
}: ApplicantsPageTableAreaSurfaceBridgeProps) {
  return (
    <ApplicantsPageTableSurface
      applicantsToRender={applicantsToRender}
      allPinnedApplicants={allPinnedApplicants}
      displayedApplicants={displayedApplicants}
      isLoading={isLoading}
      tableLoading={tableLoading}
      updateApplicantStatus={updateApplicantStatus}
      handleDeleteApplicant={handleDeleteApplicant}
      handleAssignRecruiter={handleAssignRecruiter}
      handleAssignSource={handleAssignSource}
      availablePositions={availablePositions}
      availableStages={availableStages}
      availableRecruiter={availableRecruiter}
      availableSources={availableSources}
      canEditApplicants={canEditApplicants}
      canDeleteApplicants={canDeleteApplicants}
      canChangeStatus={canChangeStatus}
      canViewDetailed={canViewDetailed}
      canAssignSource={canAssignSource}
      canAssignRecruiter={canAssignRecruiter}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      groupBy={groupBy}
      handleSortChange={handleSortChange}
      handleGroupByChange={handleGroupByChange}
      setSelectedPositionForEdit={setSelectedPositionForEdit}
      refreshApplicantInList={refreshApplicantInList}
      fetchAllPinnedApplicants={fetchAllPinnedApplicants}
      selectedApplicantIds={selectedApplicantIds}
      setSelectedApplicantIds={setSelectedApplicantIds}
      handleBulkDelete={handleBulkDelete}
      handleBulkChangeStatus={handleBulkChangeStatus}
      handleBulkAssignRecruiter={handleBulkAssignRecruiter}
      handleBulkReprocess={handleBulkReprocess}
      applicantSettings={applicantSettings}
      tableHeight={tableHeight}
      page={page}
      pageSize={pageSize}
      filters={filters}
      fetchTableData={fetchTableData}
      aiMatchedApplicantIdsForRefresh={aiMatchedApplicantIdsForRefresh}
      isMobile={isMobile}
      pullProgress={pullProgress}
      isRefreshing={isRefreshing}
      pullToRefreshRef={pullToRefreshRef}
    />
  );
}
