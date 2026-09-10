"use client";

import React from "react";

import type { MyTasksPageClientProps } from "@/components/tasks/MyTasksPageClientTypes";
import type { MyTasksFilters } from "@/components/tasks/my-tasks-page-utils";

interface MyTasksAuthRedirectOptions {
  router: { replace: (href: string) => void };
  status: string;
  userSession: MyTasksPageClientProps["userSession"];
}

export function useMyTasksAuthRedirect({
  router,
  status,
  userSession,
}: MyTasksAuthRedirectOptions) {
  React.useEffect(() => {
    if (status === "loading" || userSession) return;

    const isOnSigninPage =
      typeof window !== "undefined" &&
      window.location.pathname === "/auth/signin";
    const isLogoutInProgress =
      typeof window !== "undefined" &&
      window.location.search.includes("signout=true");

    if (!isOnSigninPage && !isLogoutInProgress) {
      router.replace("/auth/signin");
    }
  }, [router, status, userSession]);
}

interface MyTasksRecruiterDefaultFilterOptions {
  filters: MyTasksFilters;
  isRecruiter: boolean;
  selectedStageCount: number;
  setFilters: React.Dispatch<React.SetStateAction<MyTasksFilters>>;
  userSession: MyTasksPageClientProps["userSession"];
}

export function useMyTasksRecruiterDefaultFilter({
  filters,
  isRecruiter,
  selectedStageCount,
  setFilters,
  userSession,
}: MyTasksRecruiterDefaultFilterOptions) {
  React.useEffect(() => {
    if (
      isRecruiter &&
      userSession?.id &&
      !filters.recruiterId &&
      selectedStageCount > 0
    ) {
      setFilters((prev) => ({ ...prev, recruiterId: userSession.id }));
    }
  }, [
    filters.recruiterId,
    isRecruiter,
    selectedStageCount,
    setFilters,
    userSession?.id,
  ]);
}

interface MyTasksGlobalEventsOptions {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  setIsStageFilterOpen: (open: boolean) => void;
}

export function useMyTasksGlobalEvents({
  searchInputRef,
  setIsStageFilterOpen,
}: MyTasksGlobalEventsOptions) {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocusSearch = () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    const handleOpenFilters = () => setIsStageFilterOpen(true);

    window.addEventListener("mytasks:focus-search", handleFocusSearch);
    window.addEventListener("mytasks:open-filters", handleOpenFilters);

    return () => {
      window.removeEventListener("mytasks:focus-search", handleFocusSearch);
      window.removeEventListener("mytasks:open-filters", handleOpenFilters);
    };
  }, [searchInputRef, setIsStageFilterOpen]);
}

export function useClearMyTasksSearchTimeout(
  searchTimeoutRef: React.RefObject<NodeJS.Timeout | null>
) {
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTimeoutRef]);
}

export function useMyTasksSelectedStagesFilterSync({
  selectedStages,
  setFilters,
}: {
  selectedStages: string[];
  setFilters: React.Dispatch<React.SetStateAction<MyTasksFilters>>;
}) {
  React.useEffect(() => {
    if (selectedStages.length > 0) {
      setFilters((prev) => ({ ...prev, stage: selectedStages.join(",") }));
    } else {
      setFilters((prev) => {
        const { stage, ...rest } = prev;
        return rest;
      });
    }
  }, [selectedStages, setFilters]);
}
