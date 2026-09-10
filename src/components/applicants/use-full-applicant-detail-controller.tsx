"use client";

import type { FullApplicantDetailProps } from "./FullApplicantDetailTypes";
import { useApplicantDetail } from "./hooks/use-applicant-detail";
import { useApplicantJobClipboard } from "./hooks/use-applicant-job-clipboard";
import { useFullApplicantDetailActions } from "./use-full-applicant-detail-actions";
import { useFullApplicantEvaluationLink } from "./use-full-applicant-evaluation-link";
import { useFullApplicantModalState } from "./use-full-applicant-modal-state";
import { useFullApplicantStatusUpdate } from "./use-full-applicant-status-update";
import { useFullApplicantDetailDerivedValues } from "./use-full-applicant-detail-derived-values";
import { useFullApplicantEvaluationPermissions } from "./use-full-applicant-evaluation-permissions";
import { useFullApplicantDetailBaseContext } from "./use-full-applicant-detail-base-context";
import { useFullApplicantTransitionNoteEdit } from "./use-full-applicant-transition-note-edit";

export function useFullApplicantDetailController({
  applicantId,
  comments,
  initialApplicant = null,
  isModal = false,
  onClose,
  onRefresh,
  resumes,
}: FullApplicantDetailProps) {
  const baseContext = useFullApplicantDetailBaseContext({ onRefresh });
  const {
    isJobMatchEnabled,
    session,
    toastError,
    toastSuccess,
  } = baseContext;

  const detail = useApplicantDetail(applicantId, { initialApplicant });
  const {
    applicant,
    allDbPositions,
    availableStages,
    transitionHistory,
    applicantJobMatches,
    isSaving,
    setApplicant,
    setTransitionHistory,
    setIsEditing,
    setCopiedJobApplied,
    setCopiedJobMatchIndex,
    setIsSaving,
    refreshCustomFields,
  } = detail;

  const modalState = useFullApplicantModalState({
    applicant,
    toastSuccess,
  });
  const {
    headcountModalOpenTimeRef,
    headcountWarningShownTime,
    openCreateEvalLinkModal,
    openQrModal,
    setHeadcountWarningData,
    setHeadcountWarningShownTime,
    setIsDeleteModalOpen,
    setIsDeleting,
    setIsHeadcountWarningModalOpen,
    setIsJobMatchModalOpen,
    setIsTransitionsModalOpen,
    setPreselectedStage,
    setQrData,
    setSelectedJobMatch,
  } = modalState;

  const { canOpenEvalActions, canViewEvalLinks } = useFullApplicantEvaluationPermissions({
    applicant,
    sessionUser: session?.user,
  });

  const { handleStatusUpdate, isStatusUpdating } = useFullApplicantStatusUpdate({
    applicantId,
    applicant,
    allDbPositions,
    availableStages,
    transitionHistory,
    sessionUserId: session?.user?.id,
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
  });

  const handleEvaluate = useFullApplicantEvaluationLink({
    applicant,
    canOpenEvalActions,
    canViewEvalLinks,
    onCreateEvalLinkOpen: openCreateEvalLinkModal,
    onPermissionDenied: toastError,
    onQrDataChange: setQrData,
    onQrModalOpen: openQrModal,
  });

  const clipboard = useApplicantJobClipboard({
    applicant,
    allDbPositions,
    isJobMatchEnabled,
    setCopiedJobApplied,
    setCopiedJobMatchIndex,
  });

  const actions = useFullApplicantDetailActions({
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
  });

  const derivedValues = useFullApplicantDetailDerivedValues({
    applicant,
    applicantJobMatches,
    isJobMatchEnabled,
    positions: allDbPositions,
  });

  const handleTransitionNoteEdit = useFullApplicantTransitionNoteEdit(applicantId);

  return {
    ...baseContext,
    ...detail,
    ...modalState,
    ...clipboard,
    ...actions,
    ...derivedValues,
    applicantId,
    comments,
    handleEvaluate,
    handleStatusUpdate,
    handleTransitionNoteEdit,
    isModal,
    isStatusUpdating,
    onClose,
    onRefresh,
    resumes,
  };
}

export type FullApplicantDetailController = ReturnType<typeof useFullApplicantDetailController>;
