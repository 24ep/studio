"use client";

import { useCallback, useState } from "react";

import {
  type CreateEvaluateLinkApplicantInfo,
  type CreateEvaluateLinkStep,
  getCreateEvaluateLinkNextAction,
} from "./create-evaluate-link-utils";
import { useCreateEvaluateLinkActions } from "./use-create-evaluate-link-actions";
import { useCreateEvaluateLinkModalStateEffects } from "./use-create-evaluate-link-modal-state";
import { useCreateEvaluateLinkResources } from "./use-create-evaluate-link-resources";

interface UseCreateEvaluateLinkModalOptions {
  applicant: CreateEvaluateLinkApplicantInfo;
  editMode?: boolean;
  initialData?: {
    interviewDateTime?: string;
    interviewLocation?: string;
    interviewers?: Array<{ id: string; name: string }>;
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (linkInfo: { url: string; expiresAt: string }) => void;
}

export function useCreateEvaluateLinkModal({
  applicant,
  editMode = false,
  initialData,
  isOpen,
  onSuccess,
}: UseCreateEvaluateLinkModalOptions) {
  const resources = useCreateEvaluateLinkResources({ applicant, isOpen });
  const resetResources = resources.resetResources;
  const setSelectedInterviewerIds = resources.setSelectedInterviewerIds;
  const [currentStep, setCurrentStep] = useState<CreateEvaluateLinkStep>("configure");
  const [loading, setLoading] = useState(false);
  const [interviewDate, setInterviewDate] = useState<Date | undefined>(undefined);
  const [interviewTime, setInterviewTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState("");
  const [locationEmail, setLocationEmail] = useState<string | undefined>(undefined);
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [expireDays, setExpireDays] = useState(7);
  const [requireLogin, setRequireLogin] = useState(true);
  const [linkInfo, setLinkInfo] = useState<{ url: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useCreateEvaluateLinkModalStateEffects({
    editMode,
    initialData,
    isOpen,
    resetResources,
    setCopied,
    setCurrentStep,
    setDuration,
    setExpireDays,
    setInterviewDate,
    setInterviewTime,
    setIsCustomLocation,
    setLinkInfo,
    setLocation,
    setLocationEmail,
    setRequireLogin,
    setSelectedInterviewerIds,
    setSendEmail,
  });

  const { copyLink, createLink, downloadQR } = useCreateEvaluateLinkActions({
    applicant,
    duration,
    emailBody: resources.emailBody,
    emailSubject: resources.emailSubject,
    expireDays,
    interviewDate,
    interviewTime,
    invitationEnabled: resources.isInterviewInvitationEnabled,
    location,
    locationEmail,
    onSuccess,
    requireLogin,
    selectedInterviewerIds: resources.selectedInterviewerIds,
    sendEmail,
    setCopied,
    setCurrentStep,
    setLinkInfo,
    setLoading,
  });

  const handleNext = useCallback(() => {
    const action = getCreateEvaluateLinkNextAction({
      currentStep,
      invitationEnabled: resources.isInterviewInvitationEnabled,
      sendEmail,
    });

    if (action.nextStep) {
      setCurrentStep(action.nextStep);
    }

    if (action.shouldCreateLink) {
      void createLink(action.skipEmail);
    }
  }, [createLink, currentStep, resources.isInterviewInvitationEnabled, sendEmail]);

  const handleBack = useCallback(() => {
    if (currentStep === "email") {
      setCurrentStep("configure");
    }
  }, [currentStep]);

  return {
    addInterviewerOpen: resources.addInterviewerOpen,
    addingInterviewers: resources.addingInterviewers,
    appLogoUrl: resources.appLogoUrl,
    availableUsers: resources.availableUsers,
    azureMeetingRoomsEnabled: resources.azureMeetingRoomsEnabled,
    azureRooms: resources.azureRooms,
    canProceed: resources.canProceed,
    copied,
    currentStep,
    datePickerOpen,
    duration,
    emailBody: resources.emailBody,
    emailSubject: resources.emailSubject,
    expireDays,
    featureLoading: resources.featureLoading,
    handleAddInterviewers: resources.handleAddInterviewers,
    handleBack,
    handleNext,
    interviewDate,
    interviewTime,
    interviewers: resources.interviewers,
    interviewerSearchQuery: resources.interviewerSearchQuery,
    isCustomLocation,
    isInterviewInvitationEnabled: resources.isInterviewInvitationEnabled,
    linkInfo,
    loading,
    loadingTemplate: resources.loadingTemplate,
    location,
    positionValidation: resources.positionValidation,
    requireLogin,
    selectedInterviewerIds: resources.selectedInterviewerIds,
    selectedUserIds: resources.selectedUserIds,
    sendEmail,
    setAddInterviewerOpen: resources.setAddInterviewerOpen,
    setDatePickerOpen,
    setDuration,
    setEmailBody: resources.setEmailBody,
    setEmailSubject: resources.setEmailSubject,
    setExpireDays,
    setInterviewerSearchQuery: resources.setInterviewerSearchQuery,
    setInterviewDate,
    setInterviewTime,
    setIsCustomLocation,
    setLocation,
    setLocationEmail,
    setRequireLogin,
    setSelectedUserIds: resources.setSelectedUserIds,
    setSendEmail,
    systemEditorMode: resources.systemEditorMode,
    toggleInterviewer: resources.toggleInterviewer,
    copyLink: () => copyLink(linkInfo?.url),
    downloadQR,
  };
}

export type CreateEvaluateLinkModalController = ReturnType<typeof useCreateEvaluateLinkModal>;
