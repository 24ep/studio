"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { useMyTasksApplicantRefresh } from "@/components/tasks/use-my-tasks-applicant-refresh";
import { useMyTasksPreferencesSync } from "@/components/tasks/use-my-tasks-preferences-sync";
import {
  buildTaskboardApplicantParams as createTaskboardApplicantParams,
  type MyTasksFilters,
  type MyTasksRecruiter,
  type MyTasksStage,
  type TaskboardApplicant,
} from "@/components/tasks/my-tasks-page-utils";
import { useMyTasksPageActions } from "@/components/tasks/use-my-tasks-page-actions";
import { useMyTasksPageDataLoaders } from "@/components/tasks/use-my-tasks-page-data-loaders";
import { useMyTasksPageDerivedState } from "@/components/tasks/use-my-tasks-page-derived-state";
import {
  useClearMyTasksSearchTimeout,
  useMyTasksAuthRedirect,
  useMyTasksGlobalEvents,
  useMyTasksRecruiterDefaultFilter,
  useMyTasksSelectedStagesFilterSync,
} from "@/components/tasks/use-my-tasks-page-effects";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import type {
  ApplicantSummary,
  MyTasksPageClientProps,
  MyTasksPageViewActions,
  MyTasksPageViewState,
} from "./MyTasksPageClientTypes";

export function useMyTasksPageClient({
  userSession,
}: MyTasksPageClientProps): {
  actions: MyTasksPageViewActions;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  metadataLoaded: boolean;
  searchInputRef: React.RefObject<HTMLInputElement>;
  state: MyTasksPageViewState;
} {
  const {
    taskBoard: preferences,
    updateTaskBoardPreferences,
    resetTaskBoardPreferences,
    isLoaded,
  } = useUserPreferences();
  const [filters, setFilters] = React.useState<MyTasksFilters>({});
  const [applicants, setApplicants] = React.useState<TaskboardApplicant[]>([]);
  const [stages, setStages] = React.useState<MyTasksStage[]>([]);
  const [recruiters, setRecruiter] = React.useState<MyTasksRecruiter[]>([]);
  const [selectedApplicantSummary, setSelectedApplicantSummary] =
    React.useState<ApplicantSummary | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isStageFilterOpen, setIsStageFilterOpen] = React.useState(false);
  const [isCardSettingsOpen, setIsCardSettingsOpen] = React.useState(false);
  const [showNetworkDiagnostics, setShowNetworkDiagnostics] = React.useState(false);
  const [hasNetworkError] = React.useState(false);
  const [metadataLoaded, setMetadataLoaded] = React.useState(false);
  const [totalApplicants, setTotalApplicants] = React.useState(0);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const buildTaskboardApplicantParams = React.useCallback(() => {
    return createTaskboardApplicantParams(filters);
  }, [filters]);

  const {
    memoizedPreferences,
    selectedStages,
    setSelectedStages,
    viewMode,
    handleViewModeChange,
  } = useMyTasksPreferencesSync({
    isLoaded,
    preferences,
    updateTaskBoardPreferences,
  });

  useMyTasksApplicantRefresh({
    applicants,
    buildTaskboardApplicantParams,
    loading,
    sessionUserId: session?.user?.id,
    setApplicants,
    setLoading,
    status,
  });

  const isRecruiter =
    userSession?.role === "Recruiter" &&
    !userSession?.modulePermissions?.includes("applicantS_VIEW");
  const canSeeAllRecruiter =
    userSession?.modulePermissions?.includes("USERS_VIEW") ||
    userSession?.modulePermissions?.includes("applicantS_VIEW");

  useMyTasksAuthRedirect({ router, status, userSession });
  useMyTasksRecruiterDefaultFilter({
    filters,
    isRecruiter,
    selectedStageCount: selectedStages.length,
    setFilters,
    userSession,
  });
  useClearMyTasksSearchTimeout(searchTimeoutRef);
  useMyTasksGlobalEvents({ searchInputRef, setIsStageFilterOpen });
  useMyTasksPageDataLoaders({
    filters,
    searchTimeoutRef,
    setApplicants,
    setLoading,
    setMetadataLoaded,
    setRecruiter,
    setStages,
    setTotalApplicants,
  });

  useMyTasksSelectedStagesFilterSync({ selectedStages, setFilters });

  const {
    displayedApplicants,
    filteredStages,
    stageNames,
  } = useMyTasksPageDerivedState({ applicants, filters, selectedStages, stages });
  const {
    closeApplicantDetail,
    handleMoveTask,
    openApplicantDetail,
    toggleStageSelection,
  } = useMyTasksPageActions({
    applicants,
    setApplicants,
    setIsDetailModalOpen,
    setSelectedApplicantSummary,
    setSelectedStages,
    stages,
  });

  return {
    actions: {
      clearFilters: () => setFilters({}),
      closeApplicantDetail,
      handleMoveTask,
      handleViewModeChange,
      openApplicantDetail,
      resetTaskBoardPreferences,
      setFilters,
      setIsCardSettingsOpen,
      setIsStageFilterOpen,
      setShowNetworkDiagnostics,
      toggleStageSelection,
      updateTaskBoardPreferences,
    },
    isAuthenticated: status !== "unauthenticated" && Boolean(userSession),
    isAuthLoading: status === "loading",
    metadataLoaded,
    searchInputRef,
    state: {
      applicants,
      canSeeAllRecruiter: Boolean(canSeeAllRecruiter),
      displayedApplicants,
      filteredStages,
      filters,
      hasNetworkError,
      isCardSettingsOpen,
      isDetailModalOpen,
      isRecruiter: Boolean(isRecruiter),
      isStageFilterOpen,
      loading,
      memoizedPreferences,
      recruiters,
      selectedApplicantSummary,
      selectedStages,
      showNetworkDiagnostics,
      stageNames,
      stages,
      totalApplicants,
      viewMode,
    },
  };
}
