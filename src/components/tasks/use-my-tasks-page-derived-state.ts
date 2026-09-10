"use client";

import React from "react";
import {
  buildTaskStageNames,
  filterTaskStagesBySelection,
  filterTaskboardApplicants,
  type MyTasksFilters,
  type MyTasksStage,
  type TaskboardApplicant,
} from "@/components/tasks/my-tasks-page-utils";

export function useMyTasksPageDerivedState({
  applicants,
  filters,
  selectedStages,
  stages,
}: {
  applicants: TaskboardApplicant[];
  filters: MyTasksFilters;
  selectedStages: string[];
  stages: MyTasksStage[];
}) {
  const displayedApplicants = React.useMemo(() => {
    if (!Array.isArray(applicants)) {
      console.warn("MyTasksPageClient: applicants is not an array:", applicants);
      return [];
    }

    try {
      return filterTaskboardApplicants(applicants, filters);
    } catch (error) {
      console.error("MyTasksPageClient: Error in displayedApplicants useMemo:", error);
      return [];
    }
  }, [applicants, filters]);

  const filteredStages = React.useMemo(() => {
    if (!Array.isArray(stages)) {
      console.warn("MyTasksPageClient: stages is not an array:", stages);
      return [];
    }

    try {
      return filterTaskStagesBySelection(stages, selectedStages);
    } catch (error) {
      console.error("MyTasksPageClient: Error in filteredStages useMemo:", error);
      return [];
    }
  }, [selectedStages, stages]);

  const stageNames = React.useMemo(() => buildTaskStageNames(stages), [stages]);

  return {
    displayedApplicants,
    filteredStages,
    stageNames,
  };
}
