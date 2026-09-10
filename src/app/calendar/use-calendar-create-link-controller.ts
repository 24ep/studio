import {
  type ApplicantWithEvaluationLink,
} from './calendar-page-utils';
import { useCalendarCreateLinkActions } from './use-calendar-create-link-actions';
import { useCalendarCreateLinkModalState } from './use-calendar-create-link-modal-state';
import { useCalendarCreateLinkSelection } from './use-calendar-create-link-selection';

interface UseCalendarCreateLinkControllerInput {
  applicants: ApplicantWithEvaluationLink[];
  refreshApplicantsWithEvaluationLinks: () => void;
  pushRoute: (href: string) => void;
}

export function useCalendarCreateLinkController({
  applicants,
  refreshApplicantsWithEvaluationLinks,
  pushRoute,
}: UseCalendarCreateLinkControllerInput) {
  const selection = useCalendarCreateLinkSelection();
  const {
    availableInterviewers,
    isSearching,
    positionValidation,
    resetSelectionState,
    searchQuery,
    searchResults,
    selectedApplicant,
    selectedInterviewerIds,
    setSearchQuery,
    setSelectedApplicant,
    setSelectedInterviewerIds,
  } = selection;
  const modalState = useCalendarCreateLinkModalState(resetSelectionState);
  const {
    expireDate,
    interviewDateTime,
    interviewLocation,
    isCreateModalOpen,
    isCreatingLink,
    isEditEvalLinkModalOpen,
    qrData,
    qrModalOpen,
    requireLogin,
    sendAppointment,
    setExpireDate,
    setInterviewDateTime,
    setInterviewLocation,
    setIsCreateModalOpen,
    setQrModalOpen,
    setRequireLogin,
    setSendAppointment,
    setShowCreateLinkModal,
    showCreateLinkModal,
  } = modalState;
  const {
    canCreateLink,
    createEvaluationLink,
    handleApplicantClick,
    handleConfigurePosition,
    handleEditAppointmentFromQr,
    handleEditEvaluationLinkOpenChange,
    handleOpenCreateModal,
    handleSelectApplicant,
    showValidationWarning,
  } = useCalendarCreateLinkActions({
    applicants,
    modalState,
    pushRoute,
    refreshApplicantsWithEvaluationLinks,
    selection,
  });

  return {
    createDialogState: {
      availableInterviewers,
      canCreateLink,
      expireDate,
      interviewDateTime,
      interviewLocation,
      isCreatingLink,
      isOpen: isCreateModalOpen,
      isSearching,
      positionValidation,
      requireLogin,
      searchQuery,
      searchResults,
      selectedApplicant,
      selectedInterviewerIds,
      sendAppointment,
      showValidationWarning,
      onConfigurePosition: handleConfigurePosition,
      onCreateEvaluationLink: createEvaluationLink,
      onOpenChange: setIsCreateModalOpen,
      onRequireLoginChange: setRequireLogin,
      onSearchQueryChange: setSearchQuery,
      onSelectApplicant: handleSelectApplicant,
      onSelectedApplicantChange: setSelectedApplicant,
      onSelectedInterviewerIdsChange: setSelectedInterviewerIds,
      onSendAppointmentChange: setSendAppointment,
      setExpireDate,
      setInterviewDateTime,
      setInterviewLocation,
    },
    editEvaluationLinkState: {
      isOpen: isEditEvalLinkModalOpen,
      onOpenChange: handleEditEvaluationLinkOpenChange,
    },
    qrDialogState: {
      open: qrModalOpen,
      qrData,
      onEditAppointment: handleEditAppointmentFromQr,
      onOpenChange: setQrModalOpen,
    },
    selectedApplicant,
    showCreateLinkModal,
    setShowCreateLinkModal,
    setSelectedApplicant,
    handleApplicantClick,
    handleOpenCreateModal,
    refreshApplicantsWithEvaluationLinks,
  };
}
