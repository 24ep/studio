"use client";

import { ApplicantTable } from './ApplicantTable';
import {
  getNextApplicantTableSort,
  toggleAllApplicantTableSelection,
  toggleApplicantTableSelection,
} from './applicant-page-utils';
import type { ApplicantsPageTableSurfaceProps } from './ApplicantsPageTableSurfaceTypes';

export function ApplicantsPageTableSurfaceContent({
  applicantsToRender,
  allPinnedApplicants,
  displayedApplicants,
  isLoading,
  tableLoading,
  updateApplicantStatus,
  handleDeleteApplicant,
  handleAssignRecruiter,
  handleAssignSource,
  availablePositions,
  availableStages,
  availableRecruiter,
  availableSources,
  canEditApplicants,
  canDeleteApplicants,
  canChangeStatus,
  canViewDetailed,
  canAssignSource,
  canAssignRecruiter,
  sortColumn,
  sortDirection,
  groupBy,
  handleSortChange,
  setSelectedPositionForEdit,
  refreshApplicantInList,
  fetchAllPinnedApplicants,
  selectedApplicantIds,
  setSelectedApplicantIds,
  handleBulkDelete,
  handleBulkChangeStatus,
  handleBulkAssignRecruiter,
  handleBulkReprocess,
  applicantSettings,
  tableHeight,
  page,
  pageSize,
  filters,
  fetchTableData,
  aiMatchedApplicantIdsForRefresh,
}: ApplicantsPageTableSurfaceProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <ApplicantTable
        applicants={Array.isArray(applicantsToRender) ? applicantsToRender : []}
        allPinnedApplicants={Array.isArray(allPinnedApplicants) ? allPinnedApplicants : []}
        isLoading={(isLoading || tableLoading) && displayedApplicants.length === 0}
        onUpdateApplicant={updateApplicantStatus}
        onDeleteApplicant={handleDeleteApplicant}
        onAssignRecruiter={handleAssignRecruiter}
        onAssignSource={handleAssignSource}
        availablePositions={availablePositions}
        availableStages={availableStages}
        availableRecruiter={availableRecruiter}
        availableSources={availableSources}
        canManageApplicants={canEditApplicants}
        canEditApplicants={canEditApplicants}
        canDeleteApplicants={canDeleteApplicants}
        canChangeStatus={canChangeStatus}
        canViewDetailed={canViewDetailed}
        canAssignSource={canAssignSource}
        canAssignRecruiter={canAssignRecruiter}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        groupBy={groupBy}
        onSort={(column, direction) => {
          const nextSort = getNextApplicantTableSort({
            column,
            direction,
            currentSortColumn: sortColumn,
            currentSortDirection: sortDirection,
          });
          handleSortChange(nextSort.column, nextSort.direction);
        }}
        onEditPosition={setSelectedPositionForEdit}
        onRefreshApplicantData={async (applicantId) => {
          await refreshApplicantInList(applicantId, fetchTableData, filters, page, pageSize, aiMatchedApplicantIdsForRefresh);
          await fetchAllPinnedApplicants();
        }}
        selectedApplicantIds={selectedApplicantIds}
        onToggleSelectApplicant={(applicantId: string) => {
          setSelectedApplicantIds(toggleApplicantTableSelection(selectedApplicantIds, applicantId));
        }}
        onToggleSelectAllApplicants={() => {
          setSelectedApplicantIds(toggleAllApplicantTableSelection(selectedApplicantIds, displayedApplicants));
        }}
        isAllApplicantsSelected={selectedApplicantIds.size === displayedApplicants.length && displayedApplicants.length > 0}
        page={page}
        pageSize={pageSize}
        baseIndex={(page - 1) * pageSize}
        onBulkDelete={handleBulkDelete}
        onBulkChangeStatus={handleBulkChangeStatus}
        onBulkAssignRecruiter={handleBulkAssignRecruiter}
        onBulkReprocess={handleBulkReprocess}
        settings={applicantSettings ?? undefined}
        tableHeight={tableHeight}
      />
    </div>
  );
}
