import { useCallback, useEffect, useState } from 'react';
import type { ApplicantSource, Position, RecruitmentStage, TransitionRecord, UserProfile } from '@/lib/types';
import {
  fetchApplicantDetailPositions,
  fetchApplicantDetailRecruiters,
  fetchApplicantDetailSources,
  fetchApplicantDetailStages,
  fetchApplicantDetailTransitionHistory,
} from './use-applicant-detail-data';

export function useApplicantDetailReferenceData(applicantId: string) {
  const [allDbPositions, setAllDbPositions] = useState<Position[]>([]);
  const [availableRecruiter, setAvailableRecruiter] = useState<UserProfile[]>([]);
  const [availableSources, setAvailableSources] = useState<ApplicantSource[]>([]);
  const [availableStages, setAvailableStages] = useState<RecruitmentStage[]>([]);
  const [transitionHistory, setTransitionHistory] = useState<TransitionRecord[]>([]);

  const fetchPositions = useCallback(async () => {
    setAllDbPositions(await fetchApplicantDetailPositions());
  }, []);

  const fetchRecruiter = useCallback(async () => {
    setAvailableRecruiter(await fetchApplicantDetailRecruiters());
  }, []);

  const fetchSources = useCallback(async () => {
    setAvailableSources(await fetchApplicantDetailSources());
  }, []);

  const fetchStages = useCallback(async () => {
    setAvailableStages(await fetchApplicantDetailStages());
  }, []);

  const fetchTransitionHistory = useCallback(async () => {
    setTransitionHistory(await fetchApplicantDetailTransitionHistory(applicantId));
  }, [applicantId]);

  useEffect(() => {
    Promise.all([
      fetchPositions(),
      fetchRecruiter(),
      fetchSources(),
      fetchStages(),
    ]).catch(error => {
      console.error('Error fetching static data:', error);
    });
  }, [fetchPositions, fetchRecruiter, fetchSources, fetchStages]);

  useEffect(() => {
    if (applicantId) {
      fetchTransitionHistory().catch(error => {
        console.error('Error fetching transition history:', error);
      });
    }
  }, [applicantId, fetchTransitionHistory]);

  return {
    allDbPositions,
    availableRecruiter,
    availableSources,
    availableStages,
    transitionHistory,
    setTransitionHistory,
    fetchTransitionHistory,
  };
}
