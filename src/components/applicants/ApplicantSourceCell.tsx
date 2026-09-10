"use client";

import {
  ApplicantSourceEditableView,
  ApplicantSourceReadOnlyView,
} from './ApplicantSourceCellParts';
import type { ApplicantSourceCellProps } from './ApplicantSourceCellTypes';
import { useApplicantSourceCell } from './use-applicant-source-cell';

export function ApplicantSourceCell({
  applicant,
  availableSources,
  canManageApplicants,
  isAssigning,
  onAssignSource,
  onResetAssigning,
}: ApplicantSourceCellProps) {
  const sourceCell = useApplicantSourceCell({
    applicant,
    availableSources,
    isAssigning,
    onAssignSource,
    onResetAssigning,
  });

  if (!canManageApplicants) {
    return <ApplicantSourceReadOnlyView applicant={applicant} />;
  }

  return (
    <ApplicantSourceEditableView
      applicant={applicant}
      currentSource={sourceCell.currentSource}
      filteredSources={sourceCell.filteredSources}
      isAssigning={isAssigning}
      open={sourceCell.open}
      searchInputRef={sourceCell.searchInputRef}
      searchTerm={sourceCell.searchTerm}
      subSource={sourceCell.subSource}
      clearSearch={sourceCell.clearSearch}
      handleSearchChange={sourceCell.handleSearchChange}
      handleSelect={sourceCell.handleSelect}
      handleSubSourceBlur={sourceCell.handleSubSourceBlur}
      handleSubSourceChange={sourceCell.handleSubSourceChange}
      setOpen={sourceCell.setOpen}
    />
  );
}
