"use client";

import { useCallback, useMemo } from "react";

import { FitScoreFilterTabs } from "@/components/applicants/FitScoreFilterTabs";
import type {
  MyTasksFilters,
  TaskboardApplicant,
} from "@/components/tasks/my-tasks-page-utils";

import { buildTaskboardFitScoreCounts } from "./my-tasks-fit-score-utils";

interface MyTasksFitScoreFilterTabsProps {
  applicants: TaskboardApplicant[];
  filters: MyTasksFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<MyTasksFilters>>;
}

export function MyTasksFitScoreFilterTabs({
  applicants,
  filters,
  onFiltersChange,
}: MyTasksFitScoreFilterTabsProps) {
  const selectedGrades = useMemo(
    () => new Set(Array.isArray(filters.fitScoreGrades) ? filters.fitScoreGrades : []),
    [filters.fitScoreGrades],
  );
  const applicantCounts = useMemo(
    () => buildTaskboardFitScoreCounts(applicants),
    [applicants],
  );

  const handleGradeToggle = useCallback((grade: string) => {
    onFiltersChange((currentFilters) => {
      const nextGrades = new Set(
        Array.isArray(currentFilters.fitScoreGrades) ? currentFilters.fitScoreGrades : [],
      );

      if (nextGrades.has(grade)) {
        nextGrades.delete(grade);
      } else {
        nextGrades.add(grade);
      }

      return {
        ...currentFilters,
        fitScoreGrades: nextGrades.size > 0 ? Array.from(nextGrades) : undefined,
      };
    });
  }, [onFiltersChange]);

  const handleClearAll = useCallback(() => {
    onFiltersChange((currentFilters) => ({
      ...currentFilters,
      fitScoreGrades: undefined,
    }));
  }, [onFiltersChange]);

  return (
    <div className="w-full overflow-x-auto">
      <FitScoreFilterTabs
        applicantCounts={applicantCounts}
        className="min-w-[680px]"
        filterMode="multi"
        onClearAll={handleClearAll}
        onGradeToggle={handleGradeToggle}
        selectedGrades={selectedGrades}
      />
    </div>
  );
}
