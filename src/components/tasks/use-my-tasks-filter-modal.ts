import { useEffect, useMemo, useState } from "react";
import type { MyTasksFilters } from "./my-tasks-page-utils";
import {
  getTaskFilterActiveCount,
  hasActiveTaskFilters,
  parseTaskFilterRecruiterIds,
  updateTaskFilter,
  updateTaskFilterRecruiters,
  type MyTasksFilterRecruiter,
} from "./my-tasks-filter-modal-utils";

interface UseMyTasksFilterModalInput {
  open: boolean;
  filters: MyTasksFilters;
  recruiters: MyTasksFilterRecruiter[];
  onFiltersChange: (filters: MyTasksFilters) => void;
  onOpenChange: (open: boolean) => void;
}

export function useMyTasksFilterModal({
  open,
  filters,
  recruiters,
  onFiltersChange,
  onOpenChange,
}: UseMyTasksFilterModalInput) {
  const [localFilters, setLocalFilters] = useState<MyTasksFilters>(filters);
  const [activeTab, setActiveTab] = useState("basic");
  const [selectedRecruiters, setSelectedRecruiters] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      return;
    }

    setLocalFilters(filters);
    setSelectedRecruiters(new Set(parseTaskFilterRecruiterIds(filters)));
  }, [open, filters]);

  const hasActiveFilters = useMemo(
    () => hasActiveTaskFilters(localFilters, selectedRecruiters),
    [localFilters, selectedRecruiters],
  );

  const activeFilterCount = useMemo(
    () => getTaskFilterActiveCount(localFilters, selectedRecruiters),
    [localFilters, selectedRecruiters],
  );

  function setFilter(key: keyof MyTasksFilters, value: unknown) {
    setLocalFilters((currentFilters) => updateTaskFilter(currentFilters, key, value));
  }

  function replaceRecruiters(nextRecruiters: Set<string>) {
    setSelectedRecruiters(nextRecruiters);
    setLocalFilters((currentFilters) => updateTaskFilterRecruiters(currentFilters, nextRecruiters));
  }

  function handleSelectAllRecruiters() {
    replaceRecruiters(new Set(recruiters.map((recruiter) => recruiter.id)));
  }

  function handleClearAllRecruiters() {
    replaceRecruiters(new Set());
  }

  function handleToggleRecruiter(recruiterId: string) {
    const nextRecruiters = new Set(selectedRecruiters);
    if (nextRecruiters.has(recruiterId)) {
      nextRecruiters.delete(recruiterId);
    } else {
      nextRecruiters.add(recruiterId);
    }

    replaceRecruiters(nextRecruiters);
  }

  function handleApply() {
    onFiltersChange(updateTaskFilterRecruiters(localFilters, selectedRecruiters));
    onOpenChange(false);
  }

  function handleReset() {
    setLocalFilters({});
    setSelectedRecruiters(new Set());
    onFiltersChange({});
  }

  function handleClear() {
    setLocalFilters({});
    setSelectedRecruiters(new Set());
  }

  function handleRemoveFilter(key: string) {
    setLocalFilters((currentFilters) => ({
      ...currentFilters,
      [key]: undefined,
    }));

    if (key === "recruiterId") {
      setSelectedRecruiters(new Set());
    }
  }

  return {
    activeFilterCount,
    activeTab,
    hasActiveFilters,
    localFilters,
    selectedRecruiters,
    actions: {
      handleApply,
      handleClear,
      handleClearAllRecruiters,
      handleRemoveFilter,
      handleReset,
      handleSelectAllRecruiters,
      handleToggleRecruiter,
      setActiveTab,
      setFilter,
    },
  };
}
