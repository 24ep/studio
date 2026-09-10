import { useMemo } from 'react';
import type { Applicant, ApplicantFilterValues } from '@/lib/types';
import { useStageColors } from '@/hooks/use-stage-colors';
import {
  buildApplicantPagePermissions,
  buildApplicantStageNames,
  buildEffectiveApplicantFilterData,
  countActiveApplicantFilters,
  getUniqueApplicantStageIds,
} from '../applicant-page-utils';

type ApplicantFilterApiData = Parameters<typeof buildEffectiveApplicantFilterData>[0];
type ApplicantFilterFallbackData = Parameters<typeof buildEffectiveApplicantFilterData>[1];

interface UseApplicantsPageDerivedStateInput {
  filterData: ApplicantFilterApiData;
  fallbackData: ApplicantFilterFallbackData;
  filteredApplicants: Applicant[];
  filters: ApplicantFilterValues;
  modulePermissions?: unknown;
}

export function useApplicantsPageDerivedState({
  filterData,
  fallbackData,
  filteredApplicants,
  filters,
  modulePermissions,
}: UseApplicantsPageDerivedStateInput) {
  const effectiveFilterData = useMemo(
    () => buildEffectiveApplicantFilterData(filterData, fallbackData),
    [filterData, fallbackData]
  );
  const stageNames = useMemo(
    () => buildApplicantStageNames(effectiveFilterData.stages),
    [effectiveFilterData.stages]
  );
  const uniqueStageIds = useMemo(
    () => getUniqueApplicantStageIds(filteredApplicants),
    [filteredApplicants]
  );
  const { stageColors } = useStageColors(uniqueStageIds);
  const activeFilterCount = useMemo(
    () => countActiveApplicantFilters(filters),
    [filters]
  );
  const permissions = useMemo(
    () => buildApplicantPagePermissions(modulePermissions),
    [modulePermissions]
  );

  return {
    effectivePositions: effectiveFilterData.positions,
    effectiveStages: effectiveFilterData.stages,
    effectiveRecruiter: effectiveFilterData.recruiters,
    effectiveSources: effectiveFilterData.sources,
    stageNames,
    stageColors,
    activeFilterCount,
    ...permissions,
  };
}
