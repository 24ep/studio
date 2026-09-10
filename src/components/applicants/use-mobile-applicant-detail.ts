"use client";

import { useCallback, useMemo, useState } from "react";

import { useAutoScrollToInput } from "@/hooks/use-auto-scroll-to-input";
import { formatApplicantNameWithLang } from "@/lib/applicantUtils";
import type { ApplicantFilePreview } from "./applicant-attachment-utils";
import type { MobileApplicantDetailTab } from "./MobileApplicantTabsNav";
import {
  buildMobileApplicantStageNames,
  getMobileApplicantAppliedSummary,
  getMobileApplicantProfileSections,
} from "./mobile-applicant-detail-derived-state";
import { useMobileApplicantDetailActions } from "./use-mobile-applicant-detail-actions";
import { useMobileApplicantDetailData } from "./use-mobile-applicant-detail-data";
import { useMobileApplicantDetailScrollState } from "./use-mobile-applicant-detail-scroll-state";

interface UseMobileApplicantDetailOptions {
  applicantId: string;
  onClose?: () => void;
  onRefresh?: () => void;
}

export function useMobileApplicantDetail({
  applicantId,
  onClose,
  onRefresh,
}: UseMobileApplicantDetailOptions) {
  const [activeTab, setActiveTab] = useState<MobileApplicantDetailTab>("job-applied");
  const [isPositionDrawerOpen, setIsPositionDrawerOpen] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isRecruiterModalOpen, setIsRecruiterModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [transitionNotes, setTransitionNotes] = useState("");
  const [newRecruiterId, setNewRecruiterId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<ApplicantFilePreview | null>(null);
  const [isFileViewerOpen, setIsFileViewerOpen] = useState(false);
  const [footerStatusNote, setFooterStatusNote] = useState("");
  const [footerRejectNote, setFooterRejectNote] = useState("");
  const [isFooterPopoverOpen, setIsFooterPopoverOpen] = useState(false);
  const [isRejectPopoverOpen, setIsRejectPopoverOpen] = useState(false);

  useAutoScrollToInput();

  const detailData = useMobileApplicantDetailData(applicantId);
  const { isScrolled, mainContainerRef } = useMobileApplicantDetailScrollState(activeTab);

  const handleRefresh = useCallback(() => {
    detailData.loadData();
    onRefresh?.();
  }, [detailData, onRefresh]);

  const handleOpenPositionDrawer = (positionId: string) => {
    setSelectedPositionId(positionId);
    setIsPositionDrawerOpen(true);
  };

  const actions = useMobileApplicantDetailActions({
    applicant: detailData.applicant,
    handleRefresh,
    newRecruiterId,
    newStatus,
    onClose,
    onRefresh,
    setIsActionsModalOpen,
    setIsDeleteModalOpen,
    setIsRecruiterModalOpen,
    setIsStatusModalOpen,
    setNewRecruiterId,
    setNewStatus,
    setTransitionNotes,
    transitionNotes,
  });

  const {
    appliedJobId,
    appliedFitScore,
    appliedJustification,
  } = useMemo(() => getMobileApplicantAppliedSummary(detailData.applicant), [detailData.applicant]);

  const stageNames = useMemo(() => {
    return buildMobileApplicantStageNames(detailData.availableStages);
  }, [detailData.availableStages]);

  const nameInfo = useMemo(
    () => detailData.applicant ? formatApplicantNameWithLang(detailData.applicant) : { fontClass: "", lang: "en" },
    [detailData.applicant]
  );

  const { personalInfo, education, experience } = useMemo(
    () => getMobileApplicantProfileSections(detailData.applicant),
    [detailData.applicant],
  );

  return {
    applicant: detailData.applicant,
    allDbPositions: detailData.allDbPositions,
    availableStages: detailData.availableStages,
    availableRecruiters: detailData.availableRecruiters,
    availableSources: detailData.availableSources,
    comments: detailData.comments,
    attachments: detailData.attachments,
    transitionHistory: detailData.transitionHistory,
    isLoading: detailData.isLoading,
    error: detailData.error,
    activeTab,
    setActiveTab,
    isPositionDrawerOpen,
    setIsPositionDrawerOpen,
    selectedPositionId,
    isActionsModalOpen,
    setIsActionsModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isStatusModalOpen,
    setIsStatusModalOpen,
    isRecruiterModalOpen,
    setIsRecruiterModalOpen,
    newStatus,
    setNewStatus,
    transitionNotes,
    setTransitionNotes,
    newRecruiterId,
    setNewRecruiterId,
    isScrolled,
    isDeleting: actions.isDeleting,
    isCreatingEmployee: actions.isCreatingEmployee,
    selectedFile,
    setSelectedFile,
    isFileViewerOpen,
    setIsFileViewerOpen,
    isStatusUpdating: actions.isStatusUpdating,
    footerStatusNote,
    setFooterStatusNote,
    footerRejectNote,
    setFooterRejectNote,
    isFooterPopoverOpen,
    setIsFooterPopoverOpen,
    isRejectPopoverOpen,
    setIsRejectPopoverOpen,
    mainContainerRef,
    loadData: detailData.loadData,
    handleRefresh,
    handleOpenPositionDrawer,
    handleDelete: actions.handleDelete,
    handleCreateEmployee: actions.handleCreateEmployee,
    handleChangeStatus: actions.handleChangeStatus,
    handleStatusUpdate: actions.handleStatusUpdate,
    handleAssignRecruiter: actions.handleAssignRecruiter,
    handleTogglePin: actions.handleTogglePin,
    handleReprocess: actions.handleReprocess,
    appliedJobId,
    appliedFitScore,
    appliedJustification,
    stageNames,
    nameInfo,
    personalInfo,
    education,
    experience,
  };
}
