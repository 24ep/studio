"use client";

import {
  ApplicantRecruiterAssignmentCell,
  ApplicantSourceAssignmentCell,
} from './ApplicantTableAssignmentCells';
import {
  ApplicantDateCell,
  ApplicantFitScoreCell,
  ApplicantJobMatchesCell,
  ApplicantPinCell,
  ApplicantStatusCell,
} from './ApplicantTableDisplayCells';
import { AppliedJobCell, ApplicantIdentityCell } from './ApplicantTableIdentityCells';
import type { ApplicantTableRowColumnCellProps } from './ApplicantTableRowCellTypes';
import { shouldShowApplicantTableColumn } from './applicant-table-column-utils';

export function ApplicantTableRowColumnCell({
  applicant,
  availableRecruiter,
  availableSources,
  assigningRecruiter,
  assigningSource,
  canAssignSource,
  canEditApplicants,
  columnKey,
  isJobMatchEnabled,
  isUnread,
  onAssignRecruiter,
  onAssignSource,
  onOpenDetail,
  onResetAssigning,
  onTogglePin,
  settings,
  stageColors,
  stageNames,
  togglePin,
}: ApplicantTableRowColumnCellProps) {
  switch (columnKey) {
    case 'pin':
      return <ApplicantPinCell applicant={applicant} onTogglePin={onTogglePin} />;
    case 'applicant':
      return settings?.showApplicantColumn === false ? null : (
        <ApplicantIdentityCell
          applicant={applicant}
          isUnread={isUnread}
          onOpenDetail={onOpenDetail}
          togglePin={togglePin}
        />
      );
    case 'appliedJob':
      return settings?.showAppliedJobColumn === false ? null : (
        <AppliedJobCell applicant={applicant} />
      );
    case 'jobMatches':
      return !isJobMatchEnabled || settings?.showJobMatchesColumn === false
        ? null
        : <ApplicantJobMatchesCell applicant={applicant} />;
    case 'fitScore':
      return settings?.showFitScoreColumn === false ? null : (
        <ApplicantFitScoreCell applicant={applicant} />
      );
    case 'recruiter':
      return settings?.showRecruiterColumn === false ? null : (
        <ApplicantRecruiterAssignmentCell
          applicant={applicant}
          assigningRecruiter={assigningRecruiter}
          availableRecruiter={availableRecruiter}
          canEditApplicants={canEditApplicants}
          onAssignRecruiter={onAssignRecruiter}
          onResetAssigning={onResetAssigning}
        />
      );
    case 'source':
      return settings?.showSourceColumn === false ? null : (
        <ApplicantSourceAssignmentCell
          applicant={applicant}
          assigningSource={assigningSource}
          availableSources={availableSources}
          canAssignSource={canAssignSource}
          onAssignSource={onAssignSource}
          onResetAssigning={onResetAssigning}
        />
      );
    case 'status':
      return settings?.showStatusColumn === false ? null : (
        <ApplicantStatusCell
          applicant={applicant}
          stageColors={stageColors}
          stageNames={stageNames}
        />
      );
    case 'appliedDate':
      return settings?.showAppliedDateColumn === false ? null : (
        <ApplicantDateCell
          applicant={applicant}
          className="hidden sm:table-cell min-w-[100px] max-w-[140px] whitespace-nowrap"
          dateValue={applicant.applicationDate}
          idSuffix="applied-date"
        />
      );
    case 'lastUpdate':
      return settings?.showLastUpdateColumn === false ? null : (
        <ApplicantDateCell
          applicant={applicant}
          className="hidden lg:table-cell min-w-[100px] max-w-[140px] whitespace-nowrap"
          dateValue={applicant.updatedAt}
          idSuffix="last-update"
        />
      );
    case 'createdAt':
      return !shouldShowApplicantTableColumn(settings, 'createdAt') ? null : (
        <ApplicantDateCell
          applicant={applicant}
          className="hidden lg:table-cell min-w-[100px] max-w-[140px] whitespace-nowrap"
          dateValue={applicant.createdAt}
          idSuffix="created-date"
        />
      );
    default:
      return null;
  }
}
