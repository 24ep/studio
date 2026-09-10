"use client";

import { ApplicantsPageBulkFooter } from './ApplicantsPageBulkFooter';
import { ApplicantsPagePaginationFooter } from './ApplicantsPagePaginationFooter';
import type { ApplicantsPageTableAreaProps } from './ApplicantsPageTableAreaTypes';
import type { getApplicantTablePaginationState } from './applicant-page-utils';

type PaginationState = ReturnType<typeof getApplicantTablePaginationState>;

type ApplicantsPageTableAreaFootersProps = ApplicantsPageTableAreaProps & {
  isMobile: boolean;
  paginationState: PaginationState;
};

export function ApplicantsPageTableAreaFooters({
  canBulkChangeStatus,
  canDeleteApplicants,
  canEditApplicants,
  fetchTableData,
  filters,
  handleBulkDelete,
  handleBulkReprocess,
  handlePageSizeChange,
  isMobile,
  page,
  pageSize,
  paginationState,
  selectedApplicantIds,
  setBulkNewRecruiterId,
  setBulkNewStatus,
  setBulkTransitionNotes,
  setIsBulkRecruiterModalOpen,
  setIsBulkStatusModalOpen,
  setPage,
  setSelectedApplicantIds,
  totalPages,
}: ApplicantsPageTableAreaFootersProps) {
  return (
    <>
      <ApplicantsPageBulkFooter
        selectedApplicantIds={selectedApplicantIds}
        canDeleteApplicants={canDeleteApplicants}
        canBulkChangeStatus={canBulkChangeStatus}
        canEditApplicants={canEditApplicants}
        onBulkDelete={handleBulkDelete}
        onBulkReprocess={handleBulkReprocess}
        setSelectedApplicantIds={setSelectedApplicantIds}
        setBulkNewStatus={setBulkNewStatus}
        setBulkTransitionNotes={setBulkTransitionNotes}
        setIsBulkStatusModalOpen={setIsBulkStatusModalOpen}
        setBulkNewRecruiterId={setBulkNewRecruiterId}
        setIsBulkRecruiterModalOpen={setIsBulkRecruiterModalOpen}
      />
      <ApplicantsPagePaginationFooter
        isMobile={isMobile}
        paginationState={paginationState}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        filters={filters}
        setPage={setPage}
        fetchTableData={fetchTableData}
        handlePageSizeChange={handlePageSizeChange}
      />
    </>
  );
}
