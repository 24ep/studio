"use client";

import { TableCell } from '@/components/ui/table';
import type { Applicant, ApplicantSource } from '@/lib/types';
import { ApplicantRecruiterCell } from './ApplicantRecruiterCell';
import { ApplicantSourceCell } from './ApplicantSourceCell';

export function ApplicantRecruiterAssignmentCell({
  applicant,
  assigningRecruiter,
  availableRecruiter,
  canEditApplicants,
  onAssignRecruiter,
  onResetAssigning,
}: {
  applicant: Applicant;
  assigningRecruiter: string | null;
  availableRecruiter: { id: string; name: string }[];
  canEditApplicants: boolean;
  onAssignRecruiter: (applicantId: string, recruiterId: string | null) => void;
  onResetAssigning: () => void;
}) {
  return (
    <TableCell key={`${applicant.id}-recruiter`} className="min-w-[100px] max-w-[150px]">
      <ApplicantRecruiterCell
        applicant={applicant}
        availableRecruiter={availableRecruiter}
        canManageApplicants={canEditApplicants}
        isAssigning={assigningRecruiter === applicant.id}
        onAssignRecruiter={onAssignRecruiter}
        onResetAssigning={onResetAssigning}
      />
    </TableCell>
  );
}

export function ApplicantSourceAssignmentCell({
  applicant,
  assigningSource,
  availableSources,
  canAssignSource,
  onAssignSource,
  onResetAssigning,
}: {
  applicant: Applicant;
  assigningSource: string | null;
  availableSources: ApplicantSource[];
  canAssignSource: boolean;
  onAssignSource: (applicantId: string, sourceId: string | null, subSource?: string | null) => void;
  onResetAssigning: () => void;
}) {
  return (
    <TableCell key={`${applicant.id}-source`} className="min-w-[80px] max-w-[120px]">
      <ApplicantSourceCell
        applicant={applicant}
        availableSources={availableSources}
        canManageApplicants={canAssignSource}
        isAssigning={assigningSource === applicant.id}
        onAssignSource={onAssignSource}
        onResetAssigning={onResetAssigning}
      />
    </TableCell>
  );
}
