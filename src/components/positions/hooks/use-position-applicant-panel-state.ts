"use client";

import { useCallback, useMemo, useRef, useState } from 'react';

import type { Applicant, ApplicantFilterValues, RecruitmentStage } from '@/lib/types';
import {
  buildPositionStageNames,
  createDefaultPositionApplicantFilters,
} from '../position-detail-drawer-utils';

interface UsePositionApplicantPanelStateInput {
  recruitmentStages: RecruitmentStage[];
}

export function usePositionApplicantPanelState({
  recruitmentStages,
}: UsePositionApplicantPanelStateInput) {
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
  const [allApplicantsTotal, setFilteredApplicantsTotal] = useState(0);
  const [appliedApplicantsCount, setAppliedApplicantsCount] = useState(0);
  const [activeApplicantTab, setActiveApplicantTab] = useState('applied');
  const [applicantFilters, setApplicantFilters] = useState<ApplicantFilterValues>({});
  const hasInitializedDefaultApplicantFiltersRef = useRef(false);
  const stageNames = useMemo(() => buildPositionStageNames(recruitmentStages), [recruitmentStages]);

  const handleClearApplicantFilters = useCallback(() => {
    setApplicantFilters(createDefaultPositionApplicantFilters(recruitmentStages));
  }, [recruitmentStages]);

  return {
    activeApplicantTab,
    allApplicantsTotal,
    appliedApplicantsCount,
    applicantFilters,
    filteredApplicants,
    handleClearApplicantFilters,
    hasInitializedDefaultApplicantFiltersRef,
    setActiveApplicantTab,
    setAppliedApplicantsCount,
    setApplicantFilters,
    setFilteredApplicants,
    setFilteredApplicantsTotal,
    stageNames,
  };
}
