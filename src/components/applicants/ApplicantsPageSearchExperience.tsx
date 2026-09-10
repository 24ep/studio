"use client";

import { useRouter } from 'next/navigation';
import type { Applicant, ApplicantFilterValues, Position } from '@/lib/types';
import { ApplicantsPageSearchDrawer } from './ApplicantsPageSearchDrawer';

interface ApplicantsPageSearchExperienceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ApplicantFilterValues;
  onFilterChange: (filters: ApplicantFilterValues) => void;
  applicants: Applicant[];
  tableLoading: boolean;
  stageNames: Record<string, string>;
  stageColors: Record<string, string>;
  allDbPositions: Position[];
}

export function ApplicantsPageSearchExperience({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  applicants,
  tableLoading,
  stageNames,
  stageColors,
  allDbPositions,
}: ApplicantsPageSearchExperienceProps) {
  const router = useRouter();

  return (
    <>
      <ApplicantsPageSearchDrawer
        open={open}
        onOpenChange={onOpenChange}
        filters={filters}
        onFilterChange={onFilterChange}
        applicants={applicants}
        tableLoading={tableLoading}
        stageNames={stageNames}
        stageColors={stageColors}
        allDbPositions={allDbPositions}
        onApplicantClick={(applicant) => {
          onOpenChange(false);
          router.push(`/applicants/${applicant.id}`);
        }}
      />
    </>
  );
}
