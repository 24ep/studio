import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { Applicant } from '@/lib/types';
import { updateApplicantPinState } from '../position-detail-drawer-utils';

interface UsePositionApplicantPinActionsInput {
  setAppliedApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setPotentialApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setFilteredApplicants: Dispatch<SetStateAction<Applicant[]>>;
}

async function updateApplicantPinnedStatus(applicant: Applicant, isPinned: boolean) {
  await fetch(`/api/applicants/${applicant.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPinned }),
  });
}

export function usePositionApplicantPinActions({
  setAppliedApplicants,
  setPotentialApplicants,
  setFilteredApplicants,
}: UsePositionApplicantPinActionsInput) {
  const handleAppliedApplicantPinToggle = useCallback(async (applicant: Applicant) => {
    try {
      const nextPinnedState = !applicant.isPinned;
      await updateApplicantPinnedStatus(applicant, nextPinnedState);
      setAppliedApplicants(prev => updateApplicantPinState(prev, applicant.id, nextPinnedState));
      setFilteredApplicants(prev => updateApplicantPinState(prev, applicant.id, nextPinnedState));
    } catch {
      // Preserve the previous silent failure behavior for applied applicant pinning.
    }
  }, [setAppliedApplicants, setFilteredApplicants]);

  const handlePotentialApplicantPinToggle = useCallback(async (applicant: Applicant) => {
    try {
      const nextPinnedState = !applicant.isPinned;
      await updateApplicantPinnedStatus(applicant, nextPinnedState);
      setAppliedApplicants(prev => updateApplicantPinState(prev, applicant.id, nextPinnedState));
      setPotentialApplicants(prev => updateApplicantPinState(prev, applicant.id, nextPinnedState));
      setFilteredApplicants(prev => updateApplicantPinState(prev, applicant.id, nextPinnedState));
    } catch {
      // Preserve the previous silent failure behavior for potential applicant pinning.
    }
  }, [setAppliedApplicants, setFilteredApplicants, setPotentialApplicants]);

  return {
    handleAppliedApplicantPinToggle,
    handlePotentialApplicantPinToggle,
  };
}
