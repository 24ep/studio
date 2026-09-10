"use client";

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import type { Applicant } from '@/lib/types';
import type { SendInterviewInvitationStep } from './SendInterviewInvitationStepIndicator';
import { useSendInterviewInvitationActions } from './use-send-interview-invitation-actions';
import { useSendInterviewInvitationEmailTemplate } from './use-send-interview-invitation-email-template';
import { useSendInterviewInvitationReferenceData } from './use-send-interview-invitation-reference-data';

export function useSendInterviewInvitationModal({
  applicant,
  isOpen,
  onOpenChange,
}: {
  applicant: Applicant;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentStep, setCurrentStep] = useState<SendInterviewInvitationStep>('select-interviewers');
  const [interviewDate, setInterviewDate] = useState<Date | undefined>(undefined);
  const [interviewTime, setInterviewTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState('');
  const [locationEmail, setLocationEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [addInterviewerOpen, setAddInterviewerOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const referenceData = useSendInterviewInvitationReferenceData({
    isOpen,
    positionId: applicant.positionId,
    setError,
  });

  const emailTemplate = useSendInterviewInvitationEmailTemplate({
    currentStep,
    isOpen,
  });
  const { resetEmailTemplate } = emailTemplate;
  const { resetReferenceData } = referenceData;

  const actions = useSendInterviewInvitationActions({
    applicant,
    duration,
    emailBody: emailTemplate.emailBody,
    emailSubject: emailTemplate.emailSubject,
    interviewDate,
    interviewTime,
    loadInterviewers: referenceData.loadInterviewers,
    location,
    locationEmail,
    notes,
    onOpenChange,
    selectedInterviewerIds: referenceData.selectedInterviewerIds,
    selectedUserIds,
    setAddInterviewerOpen,
    setError,
    setSelectedInterviewerIds: referenceData.setSelectedInterviewerIds,
    setSelectedUserIds,
  });

  useEffect(() => {
    if (isOpen) return;

    setCurrentStep('select-interviewers');
    setInterviewDate(undefined);
    setInterviewTime('09:00');
    setDuration(60);
    setLocation('');
    setLocationEmail('');
    setNotes('');
    setError(null);
    setAddInterviewerOpen(false);
    setSelectedUserIds(new Set());
    resetReferenceData();
    resetEmailTemplate();
  }, [isOpen, resetEmailTemplate, resetReferenceData]);

  const handleNext = useCallback(() => {
    if (currentStep === 'select-interviewers') {
      if (!interviewDate) {
        toast.error('Please select an interview date');
        return;
      }

      if (!interviewTime) {
        toast.error('Please enter an interview time');
        return;
      }

      if (referenceData.selectedInterviewerIds.size === 0) {
        toast.error('Please select at least one interviewer');
        return;
      }

      setCurrentStep('edit-email');
      return;
    }

    if (currentStep === 'edit-email') {
      if (!emailTemplate.emailSubject.trim()) {
        toast.error('Please enter an email subject');
        return;
      }

      if (!emailTemplate.emailBody.trim()) {
        toast.error('Please enter email content');
        return;
      }

      setCurrentStep('preview-email');
    }
  }, [
    currentStep,
    emailTemplate.emailBody,
    emailTemplate.emailSubject,
    interviewDate,
    interviewTime,
    referenceData.selectedInterviewerIds,
  ]);

  const handleBack = useCallback(() => {
    if (currentStep === 'preview-email') {
      setCurrentStep('edit-email');
    } else if (currentStep === 'edit-email') {
      setCurrentStep('select-interviewers');
    }
  }, [currentStep]);

  return {
    addInterviewerOpen,
    addingInterviewers: actions.addingInterviewers,
    availableUsers: referenceData.availableUsers,
    currentStep,
    duration,
    emailBody: emailTemplate.emailBody,
    emailEditorMode: emailTemplate.emailEditorMode,
    emailSubject: emailTemplate.emailSubject,
    error,
    filteredAvailableUsers: referenceData.filteredAvailableUsers,
    handleAddInterviewers: actions.handleAddInterviewers,
    handleBack,
    handleNext,
    handleSubmit: actions.handleSubmit,
    interviewDate,
    interviewTime,
    interviewers: referenceData.interviewers,
    loading: actions.loading,
    loadingInterviewers: referenceData.loadingInterviewers,
    loadingRooms: referenceData.loadingRooms,
    loadingTemplate: emailTemplate.loadingTemplate,
    loadingUsers: referenceData.loadingUsers,
    location,
    locationEmail,
    locationType: referenceData.locationType,
    notes,
    rooms: referenceData.rooms,
    selectedInterviewerIds: referenceData.selectedInterviewerIds,
    selectedUserIds,
    setAddInterviewerOpen,
    setDuration,
    setEmailBody: emailTemplate.setEmailBody,
    setEmailEditorMode: emailTemplate.setEmailEditorMode,
    setEmailSubject: emailTemplate.setEmailSubject,
    setInterviewDate,
    setInterviewTime,
    setLocation,
    setLocationEmail,
    setLocationType: referenceData.setLocationType,
    setNotes,
    setSelectedUserIds,
    toggleInterviewer: referenceData.toggleInterviewer,
  };
}
