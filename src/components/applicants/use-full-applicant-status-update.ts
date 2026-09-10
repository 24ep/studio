"use client";

import { useCallback, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { updateApplicantStatusWithNotes } from '@/lib/applicantTransitionUtils';
import type { Applicant, Position, RecruitmentStage, TransitionRecord } from '@/lib/types';
import { getJsonString, readJsonObject } from '@/lib/response-json';
import { isApplicantHiringStage } from './full-applicant-detail-utils';

export interface FullApplicantHeadcountWarningData {
  applicantName: string;
  positionTitle?: string;
  errorMessage: string;
}

interface UseFullApplicantStatusUpdateOptions {
  applicantId: string;
  applicant: Applicant | null;
  allDbPositions: Position[];
  availableStages: RecruitmentStage[];
  transitionHistory: TransitionRecord[];
  sessionUserId?: string | null;
  headcountModalOpenTimeRef: MutableRefObject<number | null>;
  setApplicant: Dispatch<SetStateAction<Applicant | null>>;
  setTransitionHistory: Dispatch<SetStateAction<TransitionRecord[]>>;
  setIsTransitionsModalOpen: Dispatch<SetStateAction<boolean>>;
  setPreselectedStage: Dispatch<SetStateAction<string | null>>;
  setHeadcountWarningData: Dispatch<SetStateAction<FullApplicantHeadcountWarningData | null>>;
  setHeadcountWarningShownTime: Dispatch<SetStateAction<number | null>>;
  setIsHeadcountWarningModalOpen: Dispatch<SetStateAction<boolean>>;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
}

function getFullApplicantStatusUpdateErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Failed to update status.';
}

function normalizeHeadcountValidationResult(value: Awaited<ReturnType<typeof readJsonObject>>) {
  return {
    canHire: value.canHire === true,
    message: getJsonString(value, 'message') || 'Headcount is not available for this position.',
  };
}

export function useFullApplicantStatusUpdate({
  applicantId,
  applicant,
  allDbPositions,
  availableStages,
  transitionHistory,
  sessionUserId,
  headcountModalOpenTimeRef,
  setApplicant,
  setTransitionHistory,
  setIsTransitionsModalOpen,
  setPreselectedStage,
  setHeadcountWarningData,
  setHeadcountWarningShownTime,
  setIsHeadcountWarningModalOpen,
  toastSuccess,
  toastError,
}: UseFullApplicantStatusUpdateOptions) {
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  const handleStatusUpdate = useCallback(async (
    status: string,
    notes?: string,
    suppressToast?: boolean
  ): Promise<boolean | undefined> => {
    if (!applicantId) return;
    if (!applicant) return false;

    setIsStatusUpdating(true);
    const originalApplicant = applicant;
    const originalTransitionHistory = transitionHistory;

    try {
      const selectedStage = availableStages.find(stage => stage.id === status);
      const stageName = selectedStage?.name || status;

      if (isApplicantHiringStage(stageName) && applicant.positionId) {
        try {
          const response = await fetch(`/api/headcount/validate-hiring?applicantId=${applicantId}&positionId=${applicant.positionId}`);
          const validationResult = normalizeHeadcountValidationResult(await readJsonObject(response));

          if (!validationResult.canHire) {
            setIsTransitionsModalOpen(false);
            setPreselectedStage(null);

            const positionTitle = allDbPositions.find(position => position.id === applicant.positionId)?.title;
            setHeadcountWarningData({
              applicantName: applicant.name || 'Unknown applicant',
              positionTitle,
              errorMessage: validationResult.message,
            });

            headcountModalOpenTimeRef.current = Date.now();
            setHeadcountWarningShownTime(Date.now());
            setIsHeadcountWarningModalOpen(true);
            return;
          }
        } catch (validationError) {
          console.error('Error validating headcount availability:', validationError);
          toastError('Failed to validate headcount availability. Please try again.');
          return false;
        }
      }

      setApplicant(prev => prev ? {
        ...prev,
        statusId: status,
        status: selectedStage?.name || prev.status,
        updatedAt: new Date().toISOString(),
      } : null);

      const optimisticTransition: TransitionRecord = {
        id: `temp-${Date.now()}`,
        applicantId,
        stage: status,
        notes: notes || undefined,
        actingUserId: sessionUserId || null,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTransitionHistory(prev => [optimisticTransition, ...(Array.isArray(prev) ? prev : [])]);

      await updateApplicantStatusWithNotes(applicantId, status, notes, suppressToast, {
        success: toastSuccess,
        error: toastError,
      });

      return true;
    } catch (error: unknown) {
      console.error('FullApplicantDetail - Error updating Applicant status:', error);
      setApplicant(originalApplicant);
      setTransitionHistory(originalTransitionHistory);

      if (!suppressToast) {
        toastError(getFullApplicantStatusUpdateErrorMessage(error));
      } else {
        throw error;
      }

      return false;
    } finally {
      setIsStatusUpdating(false);
    }
  }, [
    applicant,
    applicantId,
    allDbPositions,
    availableStages,
    headcountModalOpenTimeRef,
    sessionUserId,
    setApplicant,
    setHeadcountWarningData,
    setHeadcountWarningShownTime,
    setIsHeadcountWarningModalOpen,
    setIsTransitionsModalOpen,
    setPreselectedStage,
    setTransitionHistory,
    toastError,
    toastSuccess,
    transitionHistory,
  ]);

  return {
    handleStatusUpdate,
    isStatusUpdating,
  };
}
