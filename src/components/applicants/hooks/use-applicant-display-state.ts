import { useEffect, useMemo, useRef } from 'react';
import type { Applicant, ApplicantSource, Position } from '@/lib/types';
import type { ApplicantScoreCounts } from '../applicant-page-utils';
import {
  buildApplicantTotalPages,
  countApplicantsByStage,
  hydrateApplicantsForDisplay,
  selectApplicantScoreCountsForDisplay,
  selectApplicantsToRender,
  selectDisplayedApplicantsForTable,
  selectPaginatedApplicantsForDisplay,
} from '../applicant-page-utils';

interface UseApplicantDisplayStateInput {
  isAiSearchActive: boolean;
  aiMatchedApplicantIds?: string[] | null;
  aiRecordCount: number;
  total: number;
  page: number;
  pageSize: number;
  allApplicantsForCounts?: Applicant[] | null;
  databaseFitScoreCounts?: ApplicantScoreCounts | null;
  filteredApplicants: Applicant[];
  availablePositions: Position[];
  availableRecruiter: Array<NonNullable<Applicant['recruiter']>>;
  availableSources: ApplicantSource[];
  initialApplicants: Applicant[];
  isLoading: boolean;
  tableLoading: boolean;
  isFetching: boolean;
  tableError?: string | null;
  fetchError?: string | null;
  isFitScoreCountsLoading: boolean;
}

export function useApplicantDisplayState({
  isAiSearchActive,
  aiMatchedApplicantIds,
  aiRecordCount,
  total,
  page,
  pageSize,
  allApplicantsForCounts,
  databaseFitScoreCounts,
  filteredApplicants,
  availablePositions,
  availableRecruiter,
  availableSources,
  initialApplicants,
  isLoading,
  tableLoading,
  isFetching,
  tableError,
  fetchError,
  isFitScoreCountsLoading,
}: UseApplicantDisplayStateInput) {
  const totalPages = useMemo(() => {
    return buildApplicantTotalPages({
      isAiSearchActive,
      aiMatchedApplicantIds,
      aiRecordCount,
      total,
      pageSize,
    });
  }, [isAiSearchActive, aiMatchedApplicantIds, aiRecordCount, pageSize, total]);

  const applicantScoreCounts = useMemo(() => {
    return selectApplicantScoreCountsForDisplay({
      isAiSearchActive,
      aiMatchedApplicantIds,
      allApplicantsForCounts,
      databaseFitScoreCounts,
    });
  }, [isAiSearchActive, aiMatchedApplicantIds, allApplicantsForCounts, databaseFitScoreCounts]);

  const isFitScoreCountsLoadingState = isLoading || tableLoading || isFitScoreCountsLoading;

  const applicantCountsByStage = useMemo(() => {
    return countApplicantsByStage(allApplicantsForCounts);
  }, [allApplicantsForCounts]);

  const mappedApplicants = useMemo(() => {
    return hydrateApplicantsForDisplay(
      filteredApplicants,
      availablePositions,
      availableRecruiter,
      availableSources
    );
  }, [filteredApplicants, availablePositions, availableRecruiter, availableSources]);

  const paginatedApplicants = useMemo(() => {
    return selectPaginatedApplicantsForDisplay({
      isAiSearchActive,
      aiMatchedApplicantIds,
      mappedApplicants,
      page,
      pageSize,
    });
  }, [isAiSearchActive, aiMatchedApplicantIds, mappedApplicants, page, pageSize]);

  const displayedApplicants = useMemo(() => {
    return selectDisplayedApplicantsForTable({
      isAiSearchActive,
      aiMatchedApplicantIds,
      mappedApplicants,
      filteredApplicants,
      paginatedApplicants,
      page,
      pageSize,
    });
  }, [isAiSearchActive, aiMatchedApplicantIds, mappedApplicants, filteredApplicants, paginatedApplicants, page, pageSize]);

  const lastNonEmptyApplicantsRef = useRef<Applicant[]>(
    Array.isArray(initialApplicants) && initialApplicants.length > 0 ? initialApplicants : []
  );

  useEffect(() => {
    const current = Array.isArray(displayedApplicants) ? displayedApplicants : [];
    if (current.length > 0) {
      lastNonEmptyApplicantsRef.current = current;
    }
  }, [displayedApplicants]);

  const applicantsToRender = useMemo(() => {
    const hasTransientState = Boolean(tableLoading || isLoading || isFetching || tableError || fetchError);
    return selectApplicantsToRender(displayedApplicants, lastNonEmptyApplicantsRef.current, hasTransientState);
  }, [displayedApplicants, tableLoading, isLoading, isFetching, tableError, fetchError]);

  return {
    applicantCountsByStage,
    applicantScoreCounts,
    applicantsToRender,
    displayedApplicants,
    isFitScoreCountsLoadingState,
    mappedApplicants,
    paginatedApplicants,
    totalPages,
  };
}
