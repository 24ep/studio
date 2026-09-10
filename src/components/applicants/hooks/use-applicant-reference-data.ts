import { useCallback, useEffect, useState } from 'react';

import type { ApplicantSource, Position, RecruitmentStage, UserProfile } from '@/lib/types';

import {
  fetchApplicantPositionsAndStages,
  fetchApplicantRecruiters,
  fetchApplicantSources,
} from './applicant-data-utils';

type RecruiterOption = Pick<UserProfile, 'id' | 'name' | 'email' | 'avatarUrl'>;

interface UseApplicantReferenceDataProps {
  initialAvailablePositions: Position[];
  initialAvailableStages: RecruitmentStage[];
  sessionStatus: string;
}

export function useApplicantReferenceData({
  initialAvailablePositions,
  initialAvailableStages,
  sessionStatus,
}: UseApplicantReferenceDataProps) {
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [availableStages, setAvailableStages] = useState<RecruitmentStage[]>([]);
  const [availableRecruiter, setAvailableRecruiter] = useState<RecruiterOption[]>([]);
  const [availableSources, setAvailableSources] = useState<ApplicantSource[]>([]);

  const fetchSources = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;

    try {
      setAvailableSources(await fetchApplicantSources());
    } catch {
      // Keep the current source options when the reference endpoint is unavailable.
    }
  }, [sessionStatus]);

  const fetchRecruiter = useCallback(async () => {
    if (sessionStatus !== 'authenticated') return;

    try {
      setAvailableRecruiter(await fetchApplicantRecruiters());
    } catch {
      // Keep the current recruiter options when the reference endpoint is unavailable.
    }
  }, [sessionStatus]);

  useEffect(() => {
    const safeInitialAvailablePositions = Array.isArray(initialAvailablePositions) ? initialAvailablePositions : [];
    const safeInitialAvailableStages = Array.isArray(initialAvailableStages) ? initialAvailableStages : [];

    if (safeInitialAvailablePositions.length > 0) {
      setAvailablePositions(safeInitialAvailablePositions);
    }

    if (safeInitialAvailableStages.length > 0) {
      setAvailableStages(safeInitialAvailableStages);
    }
  }, [initialAvailablePositions, initialAvailableStages]);

  useEffect(() => {
    const safeInitialAvailablePositions = Array.isArray(initialAvailablePositions) ? initialAvailablePositions : [];
    if (sessionStatus !== 'authenticated' || safeInitialAvailablePositions.length > 0) return;

    const fetchPositionsAndStages = async () => {
      try {
        const { positions, stages } = await fetchApplicantPositionsAndStages();
        if (positions.length > 0) {
          setAvailablePositions(positions);
        }
        if (stages.length > 0) {
          setAvailableStages(stages);
        }
      } catch {
        // Keep existing reference data on failure.
      }
    };

    fetchPositionsAndStages();
  }, [sessionStatus, initialAvailablePositions]);

  useEffect(() => {
    const safeInitialAvailableStages = Array.isArray(initialAvailableStages) ? initialAvailableStages : [];
    if (sessionStatus !== 'authenticated' || safeInitialAvailableStages.length > 0) return;

    const fetchStages = async () => {
      try {
        const stagesResponse = await fetch('/api/recruitment-stages');

        if (stagesResponse.ok) {
          const stagesData = await stagesResponse.json();
          setAvailableStages(Array.isArray(stagesData) ? stagesData : (stagesData.stages || []));
        }
      } catch {
        // Keep existing stage options on network failure.
      }
    };

    fetchStages();
  }, [sessionStatus, initialAvailableStages]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    fetchSources();
    fetchRecruiter();
  }, [sessionStatus, fetchSources, fetchRecruiter]);

  return {
    availablePositions,
    setAvailablePositions,
    availableStages,
    setAvailableStages,
    availableRecruiter,
    setAvailableRecruiter,
    availableSources,
    setAvailableSources,
    fetchRecruiter,
    fetchSources,
  };
}
