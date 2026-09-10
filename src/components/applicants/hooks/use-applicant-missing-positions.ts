import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Applicant, Position } from '@/lib/types';
import {
  getMissingApplicantPositionIds,
  mergePositionsById,
} from '../applicant-page-utils';
import { fetchApplicantPositionList } from '../position-list-api';

interface UseApplicantMissingPositionsInput {
  applicants: Applicant[];
  availablePositions: Position[];
  setAvailablePositions: Dispatch<SetStateAction<Position[]>>;
}

export function useApplicantMissingPositions({
  applicants,
  availablePositions,
  setAvailablePositions,
}: UseApplicantMissingPositionsInput) {
  useEffect(() => {
    const missing = getMissingApplicantPositionIds(applicants, availablePositions);

    if (missing.length === 0) {
      return;
    }

    const fetchMissingPositions = async () => {
      try {
        const positions = await fetchApplicantPositionList();
        setAvailablePositions(prev => mergePositionsById(prev, positions));
      } catch (error) {
        console.error('ApplicantsPageClient: Error fetching missing positions:', error);
      }
    };

    void fetchMissingPositions();
  }, [applicants, availablePositions, setAvailablePositions]);
}
