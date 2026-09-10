"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { Applicant, CustomFieldValue, Position, RecruitmentStage } from '@/lib/types';
import {
  type ApplicantJobMatchLike,
  buildApplicantJobMatchModalData,
  canOpenApplicantTransitionsModal,
  createApplicantDetailsUpdatePayload,
  resolveApplicantTransitionStageId,
} from './full-applicant-detail-utils';
import {
  createEmployeeFromApplicant,
  deleteFullApplicantDetailApplicant,
  updateFullApplicantDetailApplicant,
} from './full-applicant-detail-api';

interface UseFullApplicantDetailActionsOptions {
  allDbPositions: Position[];
  applicant: Applicant | null;
  availableStages: RecruitmentStage[];
  headcountWarningShownTime: number | null;
  isJobMatchEnabled: boolean;
  isSaving: boolean;
  onClose?: () => void;
  onRefresh?: () => void;
  refreshCustomFields: () => void;
  setApplicant: Dispatch<SetStateAction<Applicant | null>>;
  setIsDeleteModalOpen: (open: boolean) => void;
  setIsDeleting: (isDeleting: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
  setIsJobMatchModalOpen: (open: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  setIsTransitionsModalOpen: (open: boolean) => void;
  setPreselectedStage: (stageId: string | null) => void;
  setSelectedJobMatch: (jobMatch: ReturnType<typeof buildApplicantJobMatchModalData>) => void;
  toastError: (message: string) => void;
  toastSuccess: (message: string) => void;
}

type ApplicantDetailsSaveData = Parameters<typeof createApplicantDetailsUpdatePayload>[0];

function getFullApplicantDetailActionErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message ? error.message : fallbackMessage;
}

export function useFullApplicantDetailActions({
  allDbPositions,
  applicant,
  availableStages,
  headcountWarningShownTime,
  isJobMatchEnabled,
  isSaving,
  onClose,
  onRefresh,
  refreshCustomFields,
  setApplicant,
  setIsDeleteModalOpen,
  setIsDeleting,
  setIsEditing,
  setIsJobMatchModalOpen,
  setIsSaving,
  setIsTransitionsModalOpen,
  setPreselectedStage,
  setSelectedJobMatch,
  toastError,
  toastSuccess,
}: UseFullApplicantDetailActionsOptions) {
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);

  const handleDeleteApplicant = useCallback(async () => {
    if (!applicant?.id) return;

    setIsDeleting(true);
    try {
      await deleteFullApplicantDetailApplicant(applicant.id);
      toastSuccess('Applicant deleted successfully');

      if (onClose) {
        onClose();
      } else {
        window.location.href = '/applicants';
      }
    } catch (error) {
      console.error('Error deleting applicant:', error);
      toastError(getFullApplicantDetailActionErrorMessage(error, 'Failed to delete Applicant'));
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  }, [applicant?.id, onClose, setIsDeleteModalOpen, setIsDeleting, toastError, toastSuccess]);

  const handleCustomFieldChange = useCallback((fieldCode: string, value: CustomFieldValue) => {
    setApplicant((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        customFields: {
          ...prev.customFields,
          [fieldCode]: value,
        },
      };
    });
  }, [setApplicant]);

  const openManageTransitionsModal = useCallback((stageIdOrName?: string) => {
    if (!canOpenApplicantTransitionsModal(headcountWarningShownTime)) {
      toastError('Please resolve the headcount constraint before changing Applicant status.');
      return;
    }

    const resolvedStageId = resolveApplicantTransitionStageId(stageIdOrName, applicant, availableStages);
    setPreselectedStage(resolvedStageId);
    setIsTransitionsModalOpen(true);
  }, [
    applicant,
    availableStages,
    headcountWarningShownTime,
    setIsTransitionsModalOpen,
    setPreselectedStage,
    toastError,
  ]);

  const handleJobMatchClick = useCallback((jobMatch: ApplicantJobMatchLike) => {
    if (!isJobMatchEnabled) return;

    setSelectedJobMatch(buildApplicantJobMatchModalData(jobMatch, allDbPositions));
    setIsJobMatchModalOpen(true);
  }, [allDbPositions, isJobMatchEnabled, setIsJobMatchModalOpen, setSelectedJobMatch]);

  const handleCreateEmployee = useCallback(async () => {
    if (!applicant?.id || isCreatingEmployee) return;

    setIsCreatingEmployee(true);
    try {
      const result = await createEmployeeFromApplicant(applicant.id);
      const employeeNumber = result.employee?.employeeNumber;
      toastSuccess(result.created === false
        ? result.message || 'Applicant is already linked to an employee'
        : employeeNumber
        ? `Employee ${employeeNumber} created with login ${result.account?.loginEmail || ''}`.trim()
        : result.message || 'Employee created');
      if (result.account?.setupEmail?.sent === false) {
        toastError(
          `Account created, but the password setup email was not sent: ${result.account.setupEmail.error || 'email delivery failed'}`,
        );
      }
      onRefresh?.();
    } catch (error) {
      console.error('Error creating employee from applicant:', error);
      toastError(getFullApplicantDetailActionErrorMessage(error, 'Failed to create employee'));
    } finally {
      setIsCreatingEmployee(false);
    }
  }, [applicant?.id, isCreatingEmployee, onRefresh, toastError, toastSuccess]);

  const handleSaveDetails = useCallback(async (data: ApplicantDetailsSaveData) => {
    if (!applicant || isSaving) return;

    setIsSaving(true);

    try {
      const dataWithName = createApplicantDetailsUpdatePayload(data, applicant, availableStages);

      await updateFullApplicantDetailApplicant(applicant.id, dataWithName);
      setIsEditing(false);
      toastSuccess('Applicant updated successfully');
      refreshCustomFields();
      onRefresh?.();
    } catch (err) {
      console.error('Error updating applicant:', err);
      toastError(err instanceof Error ? err.message : 'Failed to update Applicant');
    } finally {
      setIsSaving(false);
    }
  }, [
    applicant,
    availableStages,
    isSaving,
    onRefresh,
    refreshCustomFields,
    setIsEditing,
    setIsSaving,
    toastError,
    toastSuccess,
  ]);

  return {
    handleCustomFieldChange,
    handleCreateEmployee,
    handleDeleteApplicant,
    handleJobMatchClick,
    handleSaveDetails,
    isCreatingEmployee,
    openManageTransitionsModal,
  };
}
