"use client";

import { useEffect, useRef } from "react";

import {
  type CreateEvaluateLinkApplicantInfo,
  type CreateEvaluateLinkStep,
  getCreateEvaluateLinkEditState,
  getDefaultCreateEvaluateLinkModalState,
} from "./create-evaluate-link-utils";

interface UseCreateEvaluateLinkModalStateEffectsOptions {
  editMode: boolean;
  initialData?: {
    interviewDateTime?: string;
    interviewLocation?: string;
    interviewers?: Array<{ id: string; name: string }>;
  };
  isOpen: boolean;
  resetResources: () => void;
  setCopied: (value: boolean) => void;
  setCurrentStep: (value: CreateEvaluateLinkStep) => void;
  setDuration: (value: number) => void;
  setExpireDays: (value: number) => void;
  setInterviewDate: (value: Date | undefined) => void;
  setInterviewTime: (value: string) => void;
  setIsCustomLocation: (value: boolean) => void;
  setLinkInfo: (value: { url: string; expiresAt: string } | null) => void;
  setLocation: (value: string) => void;
  setLocationEmail: (value: string | undefined) => void;
  setRequireLogin: (value: boolean) => void;
  setSelectedInterviewerIds: (value: Set<string>) => void;
  setSendEmail: (value: boolean) => void;
}

export type CreateEvaluateLinkInitialData = NonNullable<
  UseCreateEvaluateLinkModalStateEffectsOptions["initialData"]
>;

export type CreateEvaluateLinkApplicant = CreateEvaluateLinkApplicantInfo;

export function useCreateEvaluateLinkModalStateEffects({
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
}: UseCreateEvaluateLinkModalStateEffectsOptions) {
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (isOpen && editMode && initialData && !hasInitializedRef.current) {
      const editState = getCreateEvaluateLinkEditState(initialData);
      if (editState.interviewDate) {
        setInterviewDate(editState.interviewDate);
      }
      if (editState.interviewTime) {
        setInterviewTime(editState.interviewTime);
      }
      if (editState.location) {
        setLocation(editState.location);
      }
      if (editState.selectedInterviewerIds) {
        setSelectedInterviewerIds(editState.selectedInterviewerIds);
      }

      hasInitializedRef.current = true;
    }
  }, [
    editMode,
    initialData,
    isOpen,
    setInterviewDate,
    setInterviewTime,
    setLocation,
    setSelectedInterviewerIds,
  ]);

  useEffect(() => {
    if (isOpen) return;

    const resetState = getDefaultCreateEvaluateLinkModalState();
    setCurrentStep(resetState.currentStep);
    setInterviewDate(resetState.interviewDate);
    setInterviewTime(resetState.interviewTime);
    setDuration(resetState.duration);
    setLocation(resetState.location);
    setLocationEmail(resetState.locationEmail);
    setLinkInfo(resetState.linkInfo);
    setExpireDays(resetState.expireDays);
    setRequireLogin(resetState.requireLogin);
    setSendEmail(resetState.sendEmail);
    setCopied(resetState.copied);
    setIsCustomLocation(resetState.isCustomLocation);
    resetResources();
    hasInitializedRef.current = false;
  }, [
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
    setSendEmail,
  ]);
}
