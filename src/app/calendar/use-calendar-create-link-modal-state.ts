import { useCallback, useState } from 'react';

import type { CalendarQrData } from './CalendarQrCodeContent';
import { getDefaultCalendarCreateLinkExpireDate } from './calendar-create-link-date-utils';

export function useCalendarCreateLinkModalState(resetSelectionState: () => void) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [requireLogin, setRequireLogin] = useState(true);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [expireDate, setExpireDate] = useState('');
  const [interviewDateTime, setInterviewDateTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [sendAppointment, setSendAppointment] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<CalendarQrData | null>(null);
  const [qrApplicantId, setQrApplicantId] = useState<string | null>(null);
  const [isEditEvalLinkModalOpen, setIsEditEvalLinkModalOpen] = useState(false);

  const resetCreateLinkState = useCallback(() => {
    resetSelectionState();
    setRequireLogin(true);
    setExpireDate(getDefaultCalendarCreateLinkExpireDate());
    setInterviewDateTime('');
    setInterviewLocation('');
    setSendAppointment(false);
  }, [resetSelectionState]);

  return {
    expireDate,
    interviewDateTime,
    interviewLocation,
    isCreateModalOpen,
    isCreatingLink,
    isEditEvalLinkModalOpen,
    qrApplicantId,
    qrData,
    qrModalOpen,
    requireLogin,
    resetCreateLinkState,
    sendAppointment,
    setExpireDate,
    setInterviewDateTime,
    setInterviewLocation,
    setIsCreateModalOpen,
    setIsCreatingLink,
    setIsEditEvalLinkModalOpen,
    setQrApplicantId,
    setQrData,
    setQrModalOpen,
    setRequireLogin,
    setSendAppointment,
    setShowCreateLinkModal,
    showCreateLinkModal,
  };
}
