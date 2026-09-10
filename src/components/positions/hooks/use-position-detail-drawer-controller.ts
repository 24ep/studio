"use client";

import { useCallback, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";

import { useIsMobile } from "@/hooks/use-mobile";
import { usePositionLevels } from "@/hooks/use-position-levels";
import { useJobMatchFeature } from "@/hooks/useJobMatchFeature";

import { editPositionFormSchema, type EditPositionFormValues } from "../position-edit-form";
import { getPositionEditFormDefaults } from "../position-detail-drawer-utils";
import { usePositionAdUsers } from "./use-position-ad-users";
import { usePositionDetailApplicants } from "./use-position-detail-applicants";
import { usePositionDetailBaseData } from "./use-position-detail-base-data";
import { usePositionDetailRealtimeRefresh } from "./use-position-detail-realtime-refresh";
import { usePositionDetailDrawerUiState } from "./use-position-detail-drawer-ui-state";
import { usePositionEditActions } from "./use-position-edit-actions";

interface UsePositionDetailDrawerControllerProps {
  initialEditMode: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  positionId: string | null;
}

export function usePositionDetailDrawerController({
  initialEditMode,
  isOpen,
  onOpenChange,
  positionId,
}: UsePositionDetailDrawerControllerProps) {
  const { status: sessionStatus } = useSession();
  const { isJobMatchEnabled } = useJobMatchFeature();
  const isMobile = useIsMobile();
  const uiState = usePositionDetailDrawerUiState({
    initialEditMode,
    isMobile,
    isOpen,
    onOpenChange,
  });
  const {
    activeTab,
    closeApplicantModal,
    handleApplicantClick,
    handleManualClose,
    handleSheetOpenChange,
    hasMounted,
    isApplicantModalOpen,
    isEditMode,
    selectedApplicantId,
    setActiveTab,
    setIsEditMode,
  } = uiState;

  const { levels: positionLevels, isLoading: isLoadingLevels } = usePositionLevels();
  const form = useForm<EditPositionFormValues>({
    resolver: zodResolver(editPositionFormSchema),
    defaultValues: getPositionEditFormDefaults(),
  });

  const baseData = usePositionDetailBaseData({
    positionId,
    sessionStatus,
    form,
  });

  const editActions = usePositionEditActions({
    form,
    position: baseData.position,
    setIsEditMode,
    setPosition: baseData.setPosition,
  });

  const applicantState = usePositionDetailApplicants({
    isOpen,
    positionId,
    sessionStatus,
    isJobMatchEnabled,
    recruitmentStages: baseData.recruitmentStages,
  });

  const drawerInitialLoadersRef = useRef({
    fetchPosition: baseData.fetchPosition,
    fetchGrades: baseData.fetchGrades,
    fetchAppliedApplicants: applicantState.fetchAppliedApplicants,
    fetchAllApplicants: applicantState.fetchAllApplicants,
    fetchPotentialApplicants: applicantState.fetchPotentialApplicants,
    fetchHeadcountCount: baseData.fetchHeadcountCount,
    fetchRecruitmentStages: baseData.fetchRecruitmentStages,
    fetchRecruiters: baseData.fetchRecruiters,
    fetchSources: baseData.fetchSources,
  });

  drawerInitialLoadersRef.current = {
    fetchPosition: baseData.fetchPosition,
    fetchGrades: baseData.fetchGrades,
    fetchAppliedApplicants: applicantState.fetchAppliedApplicants,
    fetchAllApplicants: applicantState.fetchAllApplicants,
    fetchPotentialApplicants: applicantState.fetchPotentialApplicants,
    fetchHeadcountCount: baseData.fetchHeadcountCount,
    fetchRecruitmentStages: baseData.fetchRecruitmentStages,
    fetchRecruiters: baseData.fetchRecruiters,
    fetchSources: baseData.fetchSources,
  };

  const {
    adUsers,
    adUsersError,
    fetchAdUsers,
    isLoadingAdUsers,
  } = usePositionAdUsers({
    enabled: activeTab === "existing-employees",
    positionId,
  });

  const refreshApplicantModal = useCallback(() => {
    if (isMobile) {
      if (positionId) {
        baseData.fetchPosition();
      }
      return;
    }

    void applicantState.fetchAppliedApplicants();
    void applicantState.fetchAllApplicants();
    void applicantState.fetchPotentialApplicants();
  }, [
    applicantState.fetchAllApplicants,
    applicantState.fetchAppliedApplicants,
    applicantState.fetchPotentialApplicants,
    baseData.fetchPosition,
    isMobile,
    positionId,
  ]);

  useEffect(() => {
    if (
      isOpen
      && positionId
      && (sessionStatus === "authenticated" || positionId === "preview")
    ) {
      const loaders = drawerInitialLoadersRef.current;
      loaders.fetchPosition();
      if (positionId === "preview") return;
      loaders.fetchGrades();
      loaders.fetchAppliedApplicants();
      loaders.fetchAllApplicants();
      loaders.fetchPotentialApplicants();
      loaders.fetchHeadcountCount();
      loaders.fetchRecruitmentStages();
      loaders.fetchRecruiters();
      loaders.fetchSources();
    }
  }, [isOpen, positionId, sessionStatus]);

  usePositionDetailRealtimeRefresh({
    sessionStatus,
    positionId: positionId === "preview" ? null : positionId,
    isOpen,
    fetchPosition: baseData.fetchPosition,
    fetchHeadcountCount: baseData.fetchHeadcountCount,
    fetchAppliedApplicants: applicantState.fetchAppliedApplicants,
    fetchAllApplicants: applicantState.fetchAllApplicants,
    fetchPotentialApplicants: applicantState.fetchPotentialApplicants,
  });

  useEffect(() => {
    if (!isOpen) {
      baseData.setPosition(null);
      setIsEditMode(false);
      baseData.resetBaseData();
    }
  }, [baseData.resetBaseData, baseData.setPosition, isOpen]);

  useEffect(() => {
    if (baseData.position && !isEditMode) {
      form.reset(getPositionEditFormDefaults(baseData.position));
    }
  }, [baseData.position, isEditMode, form]);

  return {
    activeTab,
    adUsers,
    adUsersError,
    applicantState,
    baseData,
    closeApplicantModal,
    editActions,
    form,
    handleApplicantClick,
    handleManualClose,
    handleSheetOpenChange,
    hasMounted,
    isApplicantModalOpen,
    isEditMode,
    isJobMatchEnabled,
    isLoadingAdUsers,
    isLoadingLevels,
    isMobile,
    positionLevels: positionLevels.map((level) => ({
      id: level.id,
      name: level.name,
      color: level.color || undefined,
    })),
    refreshApplicantModal,
    selectedApplicantId,
    setActiveTab,
    fetchAdUsers,
  };
}

export type PositionDetailDrawerController = ReturnType<typeof usePositionDetailDrawerController>;
