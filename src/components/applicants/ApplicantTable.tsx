"use client";

import {
  Table,
  TableBody,
  TableHeader,
} from '@/components/ui/table';

import {
  ApplicantDeleteDialog,
  ApplicantDesktopRows,
  ApplicantMobileSections,
  ApplicantTableEmptyState,
  ApplicantTableHeaderRow,
  ApplicantTableLoadingState,
} from './ApplicantTableSections';
import type { ApplicantTableProps } from './ApplicantTableTypes';
import { useApplicantTableController } from './use-applicant-table-controller';

export function ApplicantTable({
  applicants,
  allPinnedApplicants = [],
  availablePositions,
  availableStages,
  availableRecruiter,
  availableSources,
  onAssignRecruiter,
  onAssignSource,
  onDeleteApplicant,
  isLoading,
  onRefreshApplicantData,
  selectedApplicantIds,
  onToggleSelectApplicant,
  onToggleSelectAllApplicants,
  isAllApplicantsSelected,
  baseIndex = 0,
  sortColumn,
  sortDirection,
  groupBy = 'none',
  onSort,
  canEditApplicants = false,
  canDeleteApplicants = false,
  canViewDetailed = false,
  canAssignSource = false,
  settings,
}: ApplicantTableProps) {
  const table = useApplicantTableController({
    applicants,
    allPinnedApplicants,
    availableRecruiter,
    availableSources,
    availableStages,
    canAssignSource,
    canDeleteApplicants,
    canEditApplicants,
    canViewDetailed,
    onAssignRecruiter,
    onAssignSource,
    onDeleteApplicant,
    onRefreshApplicantData,
    onToggleSelectApplicant,
    selectedApplicantIds,
    settings,
  });

  if (isLoading) {
    return (
      <ApplicantTableLoadingState
        isJobMatchEnabled={table.isJobMatchEnabled}
        settings={settings}
        showSelectAll={false}
        sortColumn={sortColumn || null}
        sortDirection={sortDirection || null}
        onSort={onSort}
        visibleColumnCount={table.visibleColumnCount}
      />
    );
  }

  if (!Array.isArray(applicants) || applicants.length === 0) {
    return <ApplicantTableEmptyState />;
  }

  if (table.isMobile) {
    return (
      <>
        <ApplicantMobileSections
          allApplicants={applicants}
          allDbPositions={availablePositions}
          applicantsByPinStatus={table.applicantsByPinStatus}
          availableRecruiter={availableRecruiter}
          baseIndex={baseIndex}
          groupBy={groupBy}
          onApplicantClick={table.handleRowClick}
          onToggleSelectApplicant={onToggleSelectApplicant}
          selectedApplicantIds={table.safeSelectedApplicantIds}
          settings={settings}
          stageColors={table.stageColors}
          stageNames={table.stageNames}
        />

        <ApplicantTableDialogs
          applicantToDelete={table.applicantToDelete}
          onCancelDelete={table.cancelDelete}
          onConfirmDelete={table.executeDelete}
        />
      </>
    );
  }

  return (
    <>
      <div className="overflow-hidden table-container-responsive">
        <div className="h-full w-full overflow-auto table-scrollbar">
          <Table className="min-w-full table-content-expandable table-fixed [&_td]:overflow-hidden [&_th]:overflow-hidden">
            <TableHeader>
              <ApplicantTableHeaderRow
                isAllApplicantsSelected={isAllApplicantsSelected}
                isJobMatchEnabled={table.isJobMatchEnabled}
                onSort={onSort}
                onToggleSelectAllApplicants={onToggleSelectAllApplicants}
                settings={settings}
                showSelectAll
                sortColumn={sortColumn || null}
                sortDirection={sortDirection || null}
              />
            </TableHeader>
            <TableBody>
              <ApplicantDesktopRows
                applicants={applicants}
                applicantsByPinStatus={table.applicantsByPinStatus}
                availablePositions={availablePositions}
                availableRecruiter={availableRecruiter}
                baseIndex={baseIndex}
                groupBy={groupBy}
                renderApplicantRows={table.renderApplicantRows}
                settings={settings}
                stageNames={table.stageNames}
                visibleColumnCount={table.visibleColumnCount}
              />
            </TableBody>
          </Table>
        </div>
      </div>

      <ApplicantTableDialogs
        applicantToDelete={table.applicantToDelete}
        onCancelDelete={table.cancelDelete}
        onConfirmDelete={table.executeDelete}
      />
    </>
  );
}

function ApplicantTableDialogs({
  applicantToDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  applicantToDelete: ApplicantTableProps['applicants'][number] | null;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  return (
    <ApplicantDeleteDialog
      applicant={applicantToDelete}
      onCancel={onCancelDelete}
      onConfirm={onConfirmDelete}
    />
  );
}
