import { useEffect, useMemo, useState } from 'react';
import type { ApplicantSource, Position, RecruitmentStage, UserProfile } from '@/lib/types';
import { fetchFilterableCustomFields } from '@/lib/customFieldUtils';
import type { CustomFieldDefinition } from '@/lib/types';
import {
  toApplicantPositionOptions,
  toApplicantRecruiterOptions,
  toApplicantSourceOptions,
  toApplicantStageOptions,
} from '../applicant-filter-query-utils';

interface UseApplicantFilterOptionsInput {
  availablePositions: Position[];
  availableStages: RecruitmentStage[];
  availableRecruiter: Pick<UserProfile, 'id' | 'name'>[];
  availableSources: ApplicantSource[];
}

export function useApplicantFilterOptions({
  availablePositions,
  availableStages,
  availableRecruiter,
  availableSources,
}: UseApplicantFilterOptionsInput) {
  const [filterableCustomFields, setFilterableCustomFields] = useState<CustomFieldDefinition[]>([]);
  const [isLoadingCustomFields, setIsLoadingCustomFields] = useState(false);

  useEffect(() => {
    const loadCustomFields = async () => {
      setIsLoadingCustomFields(true);
      try {
        setFilterableCustomFields(await fetchFilterableCustomFields('Applicant'));
      } catch (error) {
        console.error('Error loading custom fields:', error);
      } finally {
        setIsLoadingCustomFields(false);
      }
    };

    loadCustomFields();
  }, []);

  const safeAvailablePositions = Array.isArray(availablePositions) ? availablePositions : [];
  const safeAvailableStages = Array.isArray(availableStages) ? availableStages : [];
  const safeAvailableRecruiter = Array.isArray(availableRecruiter) ? availableRecruiter : [];
  const safeAvailableSources = Array.isArray(availableSources) ? availableSources : [];

  const stageOptions = useMemo(() => toApplicantStageOptions(safeAvailableStages), [safeAvailableStages]);
  const positionOptions = useMemo(() => toApplicantPositionOptions(safeAvailablePositions), [safeAvailablePositions]);
  const recruiterOptions = useMemo(() => toApplicantRecruiterOptions(safeAvailableRecruiter), [safeAvailableRecruiter]);
  const sourceOptions = useMemo(() => toApplicantSourceOptions(safeAvailableSources), [safeAvailableSources]);

  return {
    filterableCustomFields,
    isLoadingCustomFields,
    positionOptions,
    recruiterOptions,
    safeAvailablePositions,
    safeAvailableRecruiter,
    safeAvailableSources,
    safeAvailableStages,
    sourceOptions,
    stageOptions,
  };
}
