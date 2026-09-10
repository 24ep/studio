"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { Applicant } from "@/lib/types";
import {
  canCloseApplicantHeadcountWarning,
  type ApplicantJobMatchModalData,
} from "./full-applicant-detail-utils";
import type { FullApplicantHeadcountWarningData } from "./use-full-applicant-status-update";

export interface FullApplicantQrData {
  name: string;
  url: string;
  avatarUrl: string | null;
  expiresAt?: string;
}

interface EvaluationLinkInfo {
  url: string;
  expiresAt?: string;
}

interface UseFullApplicantModalStateOptions {
  applicant: Pick<Applicant, "name" | "avatarUrl"> | null;
  toastSuccess: (message: string) => void;
}

export function useFullApplicantModalState({
  applicant,
  toastSuccess,
}: UseFullApplicantModalStateOptions) {
  const [isTransitionsModalOpen, setIsTransitionsModalOpen] = useState(false);
  const [isJobMatchModalOpen, setIsJobMatchModalOpen] = useState(false);
  const [isReprocessModalOpen, setIsReprocessModalOpen] = useState(false);
  const [isGenerativeAIModalOpen, setIsGenerativeAIModalOpen] = useState(false);
  const [isHeadcountWarningModalOpen, setIsHeadcountWarningModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSendInvitationModalOpen, setIsSendInvitationModalOpen] = useState(false);
  const [isCreateEvalLinkModalOpen, setIsCreateEvalLinkModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<FullApplicantQrData | null>(null);
  const [isEditingEvalLink, setIsEditingEvalLink] = useState(false);
  const [isPositionDrawerOpen, setIsPositionDrawerOpen] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [headcountWarningData, setHeadcountWarningData] = useState<FullApplicantHeadcountWarningData | null>(null);
  const [headcountWarningShownTime, setHeadcountWarningShownTime] = useState<number | null>(null);
  const [preselectedStage, setPreselectedStage] = useState<string | null>(null);
  const [selectedJobMatch, setSelectedJobMatch] = useState<ApplicantJobMatchModalData | null>(null);
  const headcountModalOpenTimeRef: MutableRefObject<number | null> = useRef<number | null>(null);

  useEffect(() => {
    if (!headcountWarningShownTime) {
      return;
    }

    const timer = setTimeout(() => {
      setHeadcountWarningShownTime(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [headcountWarningShownTime]);

  const handleOpenPositionDrawer = useCallback((positionId: string) => {
    setSelectedPositionId(positionId);
    setIsPositionDrawerOpen(true);
  }, []);

  const closeHeadcountWarningModal = useCallback(() => {
    if (!canCloseApplicantHeadcountWarning(headcountModalOpenTimeRef.current)) {
      return;
    }

    setIsHeadcountWarningModalOpen(false);
    setHeadcountWarningData(null);
    headcountModalOpenTimeRef.current = null;
    setHeadcountWarningShownTime(null);
  }, []);

  const openCreateEvalLinkModal = useCallback(() => setIsCreateEvalLinkModalOpen(true), []);
  const openQrModal = useCallback(() => setIsQrModalOpen(true), []);
  const clearPreselectedStage = useCallback(() => setPreselectedStage(null), []);

  const handleCopyEvaluationLink = useCallback(() => {
    if (!qrData?.url) {
      return;
    }

    navigator.clipboard.writeText(qrData.url);
    toastSuccess("Link copied");
  }, [qrData?.url, toastSuccess]);

  const handleEditInterviewDetails = useCallback(() => {
    setIsQrModalOpen(false);
    setIsEditingEvalLink(true);
    setIsCreateEvalLinkModalOpen(true);
  }, []);

  const handleEvaluationLinkCreated = useCallback((linkInfo: EvaluationLinkInfo) => {
    if (!applicant) {
      return;
    }

    setQrData({
      name: applicant.name,
      url: linkInfo.url,
      expiresAt: linkInfo.expiresAt,
      avatarUrl: applicant.avatarUrl || null,
    });
    setIsCreateEvalLinkModalOpen(false);
    setIsQrModalOpen(true);
    setIsEditingEvalLink(false);
  }, [applicant]);

  return {
    clearPreselectedStage,
    closeHeadcountWarningModal,
    handleCopyEvaluationLink,
    handleEditInterviewDetails,
    handleEvaluationLinkCreated,
    handleOpenPositionDrawer,
    headcountModalOpenTimeRef,
    headcountWarningData,
    headcountWarningShownTime,
    isCreateEvalLinkModalOpen,
    isDeleteModalOpen,
    isDeleting,
    isEditingEvalLink,
    isGenerativeAIModalOpen,
    isHeadcountWarningModalOpen,
    isJobMatchModalOpen,
    isPositionDrawerOpen,
    isQrModalOpen,
    isReprocessModalOpen,
    isSendInvitationModalOpen,
    isTransitionsModalOpen,
    openCreateEvalLinkModal,
    openQrModal,
    preselectedStage,
    qrData,
    selectedJobMatch,
    selectedPositionId,
    setHeadcountWarningData,
    setHeadcountWarningShownTime,
    setIsCreateEvalLinkModalOpen,
    setIsDeleteModalOpen,
    setIsDeleting,
    setIsEditingEvalLink,
    setIsGenerativeAIModalOpen,
    setIsHeadcountWarningModalOpen,
    setIsJobMatchModalOpen,
    setIsPositionDrawerOpen,
    setIsQrModalOpen,
    setIsReprocessModalOpen,
    setIsSendInvitationModalOpen,
    setIsTransitionsModalOpen,
    setPreselectedStage,
    setQrData,
    setSelectedJobMatch,
    setSelectedPositionId,
  };
}
