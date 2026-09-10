"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { useInterviewInvitationFeature } from "@/hooks/useInterviewInvitationFeature";
import {
  addCreateEvaluateLinkInterviewers,
} from "./create-evaluate-link-api";
import {
  type CreateEvaluateLinkApplicantInfo,
  getApplicantPositionId,
} from "./create-evaluate-link-utils";
import { useCreateEvaluateLinkPositionValidation } from "./use-create-evaluate-link-position-validation";
import { useCreateEvaluateLinkReferenceResources } from "./use-create-evaluate-link-reference-resources";

export function useCreateEvaluateLinkResources({
  applicant,
  isOpen,
}: {
  applicant: CreateEvaluateLinkApplicantInfo;
  isOpen: boolean;
}) {
  const { isInterviewInvitationEnabled, editorMode: systemEditorMode, isLoading: featureLoading } = useInterviewInvitationFeature();
  const {
    canProceed,
    interviewers,
    positionValidation,
    selectedInterviewerIds,
    setSelectedInterviewerIds,
    toggleInterviewer,
    validatePosition,
  } = useCreateEvaluateLinkPositionValidation(applicant);
  const {
    appLogoUrl,
    availableUsers,
    azureMeetingRoomsEnabled,
    azureRooms,
    emailBody,
    emailSubject,
    loadingTemplate,
    resetEmailTemplateFields,
    setEmailBody,
    setEmailSubject,
  } = useCreateEvaluateLinkReferenceResources({
    applicantId: applicant?.id,
    isOpen,
  });
  const [addInterviewerOpen, setAddInterviewerOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [addingInterviewers, setAddingInterviewers] = useState(false);
  const [interviewerSearchQuery, setInterviewerSearchQuery] = useState("");

  useEffect(() => {
    if (!isOpen || !applicant?.id) return;

    void validatePosition();
  }, [applicant?.id, isOpen, validatePosition]);

  const handleAddInterviewers = useCallback(async () => {
    if (selectedUserIds.size === 0) return;
    const positionId = getApplicantPositionId(applicant);
    if (!positionId) return;

    setAddingInterviewers(true);

    try {
      const successCount = await addCreateEvaluateLinkInterviewers({
        positionId,
        userIds: Array.from(selectedUserIds),
      });

      if (successCount > 0) {
        toast.success(`${successCount} interviewer(s) added`);
        await validatePosition();
      }

      setSelectedUserIds(new Set());
      setAddInterviewerOpen(false);
    } catch (error) {
      console.error("Error adding interviewers:", error);
      toast.error("Failed to add interviewers");
    } finally {
      setAddingInterviewers(false);
    }
  }, [applicant, selectedUserIds, validatePosition]);

  const resetResources = useCallback(() => {
    setSelectedInterviewerIds(new Set());
    resetEmailTemplateFields();
    setAddInterviewerOpen(false);
    setSelectedUserIds(new Set());
  }, [resetEmailTemplateFields, setSelectedInterviewerIds]);

  return {
    addInterviewerOpen,
    addingInterviewers,
    appLogoUrl,
    availableUsers,
    azureMeetingRoomsEnabled,
    azureRooms,
    canProceed,
    emailBody,
    emailSubject,
    featureLoading,
    handleAddInterviewers,
    interviewers,
    interviewerSearchQuery,
    isInterviewInvitationEnabled,
    loadingTemplate,
    positionValidation,
    resetResources,
    selectedInterviewerIds,
    selectedUserIds,
    setAddInterviewerOpen,
    setEmailBody,
    setEmailSubject,
    setInterviewerSearchQuery,
    setSelectedInterviewerIds,
    setSelectedUserIds,
    systemEditorMode,
    toggleInterviewer,
  };
}
