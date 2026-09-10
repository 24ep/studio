import { useCallback, useRef, useState } from "react";

import type { ApplicantFilterValues } from "@/components/applicants/ApplicantFilters";
import { safeFetch } from "@/lib/safe-fetch";

interface FitScoreCounts {
  applied: Array<{ letter: string; count: number }>;
  matching: Array<{ letter: string; count: number }>;
}

interface UseApplicantFitScoreCountsProps {
  filters?: ApplicantFilterValues;
}

const ALL_FIT_SCORE_GRADES = ["A", "B", "C", "D", "E", "no-score"];

function appendApplicantFitScoreCountParams(params: URLSearchParams, filters?: ApplicantFilterValues) {
  if (!filters) {
    return;
  }

  if (filters.selectedPositionIds?.length) {
    params.append("positionId", filters.selectedPositionIds.join(","));
  }

  if (filters.selectedStatuses?.length) {
    params.append("status", filters.selectedStatuses.join(","));
  }

  if (filters.selectedRecruiterIds?.length) {
    params.append("recruiterId", filters.selectedRecruiterIds.join(","));
  }

  if (filters.selectedSourceIds?.length) {
    params.append("sourceId", filters.selectedSourceIds.join(","));
  }

  if (filters.minAppliedJobFitScore !== undefined) {
    params.append("minAppliedJobFitScore", String(filters.minAppliedJobFitScore * 100));
  }

  if (filters.maxAppliedJobFitScore !== undefined) {
    params.append("maxAppliedJobFitScore", String(filters.maxAppliedJobFitScore * 100));
  }

  if (filters.includeNoScoreInApplied !== undefined) {
    params.append("includeNoScoreInApplied", String(filters.includeNoScoreInApplied));
  }

  if (filters.applicationDateStart) {
    params.append("applicationDateStart", filters.applicationDateStart.toISOString());
  }

  if (filters.applicationDateEnd) {
    params.append("applicationDateEnd", filters.applicationDateEnd.toISOString());
  }

  if (filters.minExperienceYears !== undefined) {
    params.append("minExperienceYears", String(filters.minExperienceYears));
  }

  if (filters.maxExperienceYears !== undefined) {
    params.append("maxExperienceYears", String(filters.maxExperienceYears));
  }

  if (filters.skills) {
    params.append("skills", filters.skills);
  }

  if (filters.location) {
    params.append("location", filters.location);

    if (filters.locationOperator) {
      params.append("locationOperator", filters.locationOperator);
    }
  }
}

function normalizeFitScoreCounts(data: {
  applied?: Array<{ letter: string; count: number }>;
  matching?: Array<{ letter: string; count: number }>;
}): FitScoreCounts {
  return {
    applied: ALL_FIT_SCORE_GRADES.map((letter) => {
      const item = data.applied?.find((count) => count.letter === letter);
      return { letter, count: item?.count || 0 };
    }),
    matching: ALL_FIT_SCORE_GRADES.map((letter) => {
      const item = data.matching?.find((count) => count.letter === letter);
      return { letter, count: item?.count || 0 };
    }),
  };
}

export function useApplicantFitScoreCounts({ filters }: UseApplicantFitScoreCountsProps) {
  const [databaseFitScoreCounts, setDatabaseFitScoreCounts] = useState<FitScoreCounts | null>(null);
  const [isFitScoreCountsLoading, setIsFitScoreCountsLoading] = useState(false);
  const filtersRef = useRef(filters);
  const isFetchingFitScoreCountsRef = useRef(false);

  filtersRef.current = filters;

  const fetchFitScoreCounts = useCallback(async (forceRefresh = false) => {
    if (isFetchingFitScoreCountsRef.current && !forceRefresh) {
      return;
    }

    isFetchingFitScoreCountsRef.current = true;
    setIsFitScoreCountsLoading(true);

    try {
      const params = new URLSearchParams();
      appendApplicantFitScoreCountParams(params, filtersRef.current);

      const result = await safeFetch<{
        applied?: Array<{ letter: string; count: number }>;
        matching?: Array<{ letter: string; count: number }>;
      }>(`/api/applicants/fit-score-counts?${params.toString()}`, {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
        timeoutMs: 8000,
      });

      setDatabaseFitScoreCounts(result.ok && result.data ? normalizeFitScoreCounts(result.data) : null);
    } catch (error) {
      setDatabaseFitScoreCounts(null);
    } finally {
      setIsFitScoreCountsLoading(false);
      isFetchingFitScoreCountsRef.current = false;
    }
  }, []);

  const debouncedFetchFitScoreCounts = useCallback(() => {
    fetchFitScoreCounts(false);
  }, [fetchFitScoreCounts]);

  const forceRefreshFitScoreCounts = useCallback(() => {
    fetchFitScoreCounts(true);
  }, [fetchFitScoreCounts]);

  return {
    databaseFitScoreCounts,
    isFitScoreCountsLoading,
    fetchFitScoreCounts,
    debouncedFetchFitScoreCounts,
    forceRefreshFitScoreCounts,
  };
}
