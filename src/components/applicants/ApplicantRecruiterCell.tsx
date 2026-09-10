"use client";

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  ApplicantRecruiterReadonly,
  ApplicantRecruiterTrigger,
} from './ApplicantRecruiterCellDisplay';
import { ApplicantRecruiterCellPopover } from './ApplicantRecruiterCellPopover';
import type {
  ApplicantRecruiterCellApplicant,
  ApplicantRecruiterOption,
} from './applicant-recruiter-cell-types';
import { useApplicantRecruiterCell } from './use-applicant-recruiter-cell';

interface ApplicantRecruiterCellProps {
  applicant: ApplicantRecruiterCellApplicant;
  availableRecruiter: ApplicantRecruiterOption[];
  canManageApplicants: boolean;
  isAssigning: boolean;
  onAssignRecruiter: (applicantId: string, recruiterId: string | null) => void;
  onResetAssigning?: () => void;
}

export function ApplicantRecruiterCell({
  applicant,
  availableRecruiter,
  canManageApplicants,
  isAssigning,
  onAssignRecruiter,
  onResetAssigning
}: ApplicantRecruiterCellProps) {
  const {
    displayRecruiter,
    filteredRecruiter,
    handleClearSearch,
    handleOpenChange,
    handleSearchChange,
    handleSelect,
    open,
    searchInputRef,
    searchTerm,
  } = useApplicantRecruiterCell({
    applicant,
    availableRecruiter,
    isAssigning,
    onAssignRecruiter,
    onResetAssigning,
  });

  if (!canManageApplicants) {
    return <ApplicantRecruiterReadonly displayRecruiter={displayRecruiter} />;
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open && !isAssigning} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <ApplicantRecruiterTrigger
            displayRecruiter={displayRecruiter}
            isAssigning={isAssigning}
            open={open}
          />
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <ApplicantRecruiterCellPopover
            applicant={applicant}
            filteredRecruiter={filteredRecruiter}
            onClearSearch={handleClearSearch}
            onSearchChange={handleSearchChange}
            onSelect={handleSelect}
            searchInputRef={searchInputRef}
            searchTerm={searchTerm}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
