"use client";

import { useCallback, useMemo, useState, type MutableRefObject } from "react";
import { useRouter } from "next/navigation";
import type { PositionsPreferences } from "@/hooks/use-user-preferences";
import {
  buildPositionFilterSnapshot,
  buildPositionPaginationSearch,
  countActivePositionFilters,
  getClearedPositionVisibleFilters,
  getPositionEmptyStateMessage,
  hasVisiblePositionFilters,
  parsePositionPageFromSearch,
  parsePositionRecruiterFromSearch,
  parsePositionStatusFromSearch,
  shouldShowAddFirstPositionButton,
  type PositionPreferencesLike,
  type PositionStatusFilter,
} from "../position-page-utils";
import { usePositionPreferencesSync } from "./use-position-preferences-sync";

interface UsePositionsPageFiltersOptions {
  preferences: PositionPreferencesLike;
  isPreferencesLoaded: boolean;
  canCreatePositions: boolean;
  updatePositionsPreferences: (updates: Partial<PositionsPreferences>) => void;
  isUpdatingURLRef?: MutableRefObject<boolean>;
}

function getWindowSearch() {
  return typeof window !== "undefined" ? window.location.search : "";
}

export function usePositionsPageFilters({
  preferences,
  isPreferencesLoaded,
  canCreatePositions,
  updatePositionsPreferences,
  isUpdatingURLRef,
}: UsePositionsPageFiltersOptions) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(preferences.searchTerm || "");
  const [departmentFilter, setDepartmentFilter] = useState(preferences.departmentFilter || "all");
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PositionStatusFilter>(() => (
    parsePositionStatusFromSearch(getWindowSearch(), preferences.statusFilter as PositionStatusFilter)
  ));
  const [page, setPage] = useState(() => parsePositionPageFromSearch(getWindowSearch()));
  const [pageSize, setPageSize] = useState(preferences.pageSize || 20);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<string | null>(() => (
    parsePositionRecruiterFromSearch(getWindowSearch(), preferences.selectedRecruiterId || null)
  ));
  const [selectedHiringManagerId, setSelectedHiringManagerId] = useState<string | null>(null);

  const updateURL = useCallback((newPage: number, newPageSize?: number) => {
    if (isUpdatingURLRef) {
      isUpdatingURLRef.current = true;
    }

    const nextSearch = buildPositionPaginationSearch(window.location.search, newPage, newPageSize);
    router.replace(`${window.location.pathname}?${nextSearch}`, { scroll: false });

    if (isUpdatingURLRef) {
      setTimeout(() => {
        isUpdatingURLRef.current = false;
      }, 100);
    }
  }, [isUpdatingURLRef, router]);

  const resetPagination = useCallback(() => {
    setPage(1);
    updateURL(1);
  }, [updateURL]);

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status as PositionStatusFilter);
    resetPagination();
  }, [resetPagination]);

  const handleDepartmentSelect = useCallback((department: string) => {
    setDepartmentFilter(department);
    resetPagination();
  }, [resetPagination]);

  const handleRecruiterSelect = useCallback((recruiterId: string | null) => {
    setSelectedRecruiterId(recruiterId);
    resetPagination();
  }, [resetPagination]);

  const handleHiringManagerSelect = useCallback((managerId: string | null) => {
    setSelectedHiringManagerId(managerId);
    resetPagination();
  }, [resetPagination]);

  const handleGradeSelect = useCallback((gradeId: string | null) => {
    setGradeFilter(gradeId);
    resetPagination();
  }, [resetPagination]);

  const filterSnapshot = useMemo(() => buildPositionFilterSnapshot({
    searchTerm,
    statusFilter,
    departmentFilter,
    gradeFilter,
    selectedRecruiterId,
    selectedHiringManagerId,
    page,
    pageSize,
  }), [
    searchTerm,
    statusFilter,
    departmentFilter,
    gradeFilter,
    selectedRecruiterId,
    selectedHiringManagerId,
    page,
    pageSize,
  ]);

  const preferencesSnapshot = useMemo(() => ({
    searchTerm,
    departmentFilter,
    statusFilter,
    selectedRecruiterId,
    pageSize,
  }), [searchTerm, departmentFilter, statusFilter, selectedRecruiterId, pageSize]);

  usePositionPreferencesSync({
    isLoaded: isPreferencesLoaded,
    preferences,
    currentPreferences: preferencesSnapshot,
    setSearchTerm,
    setDepartmentFilter,
    setPageSize,
    setSelectedRecruiterId,
    setStatusFilter,
    updatePositionsPreferences,
  });

  const activeFilterCount = useMemo(() => countActivePositionFilters(filterSnapshot), [filterSnapshot]);
  const hasActiveVisibleFilters = useMemo(() => hasVisiblePositionFilters(filterSnapshot), [filterSnapshot]);
  const emptyStateMessage = useMemo(() => getPositionEmptyStateMessage(filterSnapshot), [filterSnapshot]);
  const showAddFirstPositionButton = useMemo(
    () => shouldShowAddFirstPositionButton(canCreatePositions, filterSnapshot),
    [canCreatePositions, filterSnapshot],
  );

  const clearVisibleFilters = useCallback(() => {
    const clearedFilters = getClearedPositionVisibleFilters();
    setSearchTerm(clearedFilters.searchTerm);
    setStatusFilter(clearedFilters.statusFilter);
    setDepartmentFilter(clearedFilters.departmentFilter);
    setGradeFilter(clearedFilters.gradeFilter);
    setSelectedRecruiterId(clearedFilters.selectedRecruiterId);
    setSelectedHiringManagerId(clearedFilters.selectedHiringManagerId);
    resetPagination();
  }, [resetPagination]);

  return {
    searchTerm,
    setSearchTerm,
    departmentFilter,
    setDepartmentFilter,
    gradeFilter,
    setGradeFilter,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    selectedRecruiterId,
    setSelectedRecruiterId,
    selectedHiringManagerId,
    setSelectedHiringManagerId,
    filterSnapshot,
    activeFilterCount,
    hasActiveVisibleFilters,
    emptyStateMessage,
    showAddFirstPositionButton,
    updateURL,
    resetPagination,
    handleStatusFilterChange,
    handleDepartmentSelect,
    handleRecruiterSelect,
    handleHiringManagerSelect,
    handleGradeSelect,
    clearVisibleFilters,
  };
}
