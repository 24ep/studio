import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

import { createCalendarEvaluationLink } from './calendar-create-link-api';
import { getCalendarCreateLinkDurationDays } from './calendar-create-link-date-utils';
import {
  buildCalendarQrDataFromCreatedLink,
  buildCalendarQrDataFromEvaluationLink,
  canCreateCalendarEvaluationLink,
  shouldShowCalendarPositionValidationWarning,
  type ApplicantWithEvaluationLink,
  type SearchApplicant,
} from './calendar-page-utils';
import type { useCalendarCreateLinkModalState } from './use-calendar-create-link-modal-state';
import type { useCalendarCreateLinkSelection } from './use-calendar-create-link-selection';

type CalendarCreateLinkSelection = ReturnType<typeof useCalendarCreateLinkSelection>;
type CalendarCreateLinkModalState = ReturnType<typeof useCalendarCreateLinkModalState>;

interface UseCalendarCreateLinkActionsInput {
  applicants: ApplicantWithEvaluationLink[];
  modalState: CalendarCreateLinkModalState;
  pushRoute: (href: string) => void;
  refreshApplicantsWithEvaluationLinks: () => void;
  selection: CalendarCreateLinkSelection;
}

export function useCalendarCreateLinkActions({
  applicants,
  modalState,
  pushRoute,
  refreshApplicantsWithEvaluationLinks,
  selection,
}: UseCalendarCreateLinkActionsInput) {
  const {
    positionValidation,
    searchResults,
    selectedApplicant,
    selectedInterviewerIds,
    setSearchQuery,
    setSearchResults,
    setSelectedApplicant,
  } = selection;
  const {
    expireDate,
    qrApplicantId,
    requireLogin,
    resetCreateLinkState,
    sendAppointment,
    setIsCreateModalOpen,
    setIsCreatingLink,
    setIsEditEvalLinkModalOpen,
    setQrApplicantId,
    setQrData,
    setQrModalOpen,
    setShowCreateLinkModal,
  } = modalState;

  const createEvaluationLink = useCallback(async () => {
    if (!selectedApplicant) return;

    try {
      setIsCreatingLink(true);
      const data = await createCalendarEvaluationLink(selectedApplicant.id, {
        days: getCalendarCreateLinkDurationDays(expireDate),
        requireLogin,
      });
      toast.success('Evaluation link created successfully');
      setIsCreateModalOpen(false);

      const createdLinkQrData = buildCalendarQrDataFromCreatedLink(selectedApplicant, data);
      if (createdLinkQrData) {
        setQrData(createdLinkQrData);
        setQrModalOpen(true);
      }

      setSelectedApplicant(null);
      setSearchQuery('');
      setSearchResults([]);
      refreshApplicantsWithEvaluationLinks();

      if (typeof data.url === 'string' && data.url) {
        navigator.clipboard.writeText(data.url).then(() => {
          toast.success('Link copied to clipboard');
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Error creating evaluation link:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create evaluation link');
    } finally {
      setIsCreatingLink(false);
    }
  }, [
    expireDate,
    refreshApplicantsWithEvaluationLinks,
    requireLogin,
    selectedApplicant,
    setIsCreateModalOpen,
    setIsCreatingLink,
    setQrData,
    setQrModalOpen,
    setSearchQuery,
    setSearchResults,
    setSelectedApplicant,
  ]);

  const handleApplicantClick = useCallback((applicantId: string, isReminder?: boolean) => {
    if (isReminder) {
      pushRoute(`/applicants/${applicantId}`);
      return;
    }

    const applicant = applicants.find((candidate) => candidate.id === applicantId);
    const applicantQrData = applicant ? buildCalendarQrDataFromEvaluationLink(applicant) : null;
    if (applicantQrData) {
      setQrData(applicantQrData);
      setQrApplicantId(applicantId);
      setQrModalOpen(true);
    }
  }, [applicants, pushRoute, setQrApplicantId, setQrData, setQrModalOpen]);

  const handleOpenCreateModal = useCallback(() => {
    resetCreateLinkState();
    setIsCreateModalOpen(true);
  }, [resetCreateLinkState, setIsCreateModalOpen]);

  const handleConfigurePosition = useCallback(() => {
    if (selectedApplicant && positionValidation.positionId) {
      pushRoute(`/applicants/${selectedApplicant.id}`);
      setIsCreateModalOpen(false);
    }
  }, [positionValidation.positionId, pushRoute, selectedApplicant, setIsCreateModalOpen]);

  const handleSelectApplicant = useCallback((applicant: SearchApplicant) => {
    setSelectedApplicant(applicant);
    setSearchQuery('');
    setSearchResults([]);
    setIsCreateModalOpen(false);
    setShowCreateLinkModal(true);
  }, [
    setIsCreateModalOpen,
    setSearchQuery,
    setSearchResults,
    setSelectedApplicant,
    setShowCreateLinkModal,
  ]);

  const handleEditAppointmentFromQr = useCallback(() => {
    setQrModalOpen(false);
    if (!qrApplicantId) {
      return;
    }

    const applicant = applicants.find((candidate) => candidate.id === qrApplicantId);
    if (applicant) {
      setSelectedApplicant({
        id: applicant.id,
        name: applicant.name,
        email: applicant.email,
        avatarUrl: applicant.avatarUrl,
        position: applicant.position,
        positionId: applicant.position?.id,
      });
      setIsEditEvalLinkModalOpen(true);
    }
  }, [applicants, qrApplicantId, setIsEditEvalLinkModalOpen, setQrModalOpen, setSelectedApplicant]);

  const handleEditEvaluationLinkOpenChange = useCallback((open: boolean) => {
    setIsEditEvalLinkModalOpen(open);
    if (!open) {
      setSelectedApplicant(null);
      refreshApplicantsWithEvaluationLinks();
    }
  }, [refreshApplicantsWithEvaluationLinks, setIsEditEvalLinkModalOpen, setSelectedApplicant]);

  return {
    canCreateLink: canCreateCalendarEvaluationLink({
      selectedApplicant,
      positionValidation,
      sendAppointment,
      selectedInterviewerIds,
    }),
    createEvaluationLink,
    handleApplicantClick,
    handleConfigurePosition,
    handleEditAppointmentFromQr,
    handleEditEvaluationLinkOpenChange,
    handleOpenCreateModal,
    handleSelectApplicant,
    hasSearchResults: searchResults.length > 0,
    showValidationWarning: shouldShowCalendarPositionValidationWarning({
      selectedApplicant,
      positionValidation,
    }),
  };
}
