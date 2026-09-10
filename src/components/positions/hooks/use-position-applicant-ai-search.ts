"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'react-hot-toast';

import type { Applicant, ApplicantFilterValues } from '@/lib/types';
import { getJsonArray, getJsonErrorMessage, readJsonObject } from '@/lib/response-json';
import { filterApplicantsByMatchedIds } from '../position-detail-drawer-utils';

interface UsePositionApplicantAiSearchInput {
  setAppliedApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setAppliedApplicantsTotal: Dispatch<SetStateAction<number>>;
  setApplicantFilters: Dispatch<SetStateAction<ApplicantFilterValues>>;
  setFilteredApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setFilteredApplicantsTotal: Dispatch<SetStateAction<number>>;
  setPotentialApplicants: Dispatch<SetStateAction<Applicant[]>>;
  setPotentialApplicantsTotal: Dispatch<SetStateAction<number>>;
}

export function usePositionApplicantAiSearch({
  setAppliedApplicants,
  setAppliedApplicantsTotal,
  setApplicantFilters,
  setFilteredApplicants,
  setFilteredApplicantsTotal,
  setPotentialApplicants,
  setPotentialApplicantsTotal,
}: UsePositionApplicantAiSearchInput) {
  const [isAiSearchingApplicants, setIsAiSearchingApplicants] = useState(false);

  const handlePositionApplicantAiSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      toast.error('Enter an AI search query first.');
      return;
    }

    setIsAiSearchingApplicants(true);
    try {
      const response = await fetch('/api/ai/search-applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedQuery }),
      });

      const result = await readJsonObject(response);
      if (!response.ok) {
        throw new Error(getJsonErrorMessage(result, 'AI search failed.'));
      }

      const rawMatchedApplicantIds = getJsonArray(result, 'matchedApplicantIds');
      const matchedApplicantIds: string[] = Array.isArray(rawMatchedApplicantIds)
        ? Array.from(new Set(rawMatchedApplicantIds.filter((id: unknown): id is string => typeof id === 'string')))
        : [];

      setAppliedApplicants((applicants) => {
        const filtered = filterApplicantsByMatchedIds(applicants, matchedApplicantIds);
        setAppliedApplicantsTotal(filtered.length);
        return filtered;
      });
      setPotentialApplicants((applicants) => {
        const filtered = filterApplicantsByMatchedIds(applicants, matchedApplicantIds);
        setPotentialApplicantsTotal(filtered.length);
        return filtered;
      });
      setFilteredApplicants((applicants) => {
        const filtered = filterApplicantsByMatchedIds(applicants, matchedApplicantIds);
        setFilteredApplicantsTotal(filtered.length);
        return filtered;
      });
      setApplicantFilters((currentFilters) => ({ ...currentFilters, aiSearchQuery: trimmedQuery }));
      toast.success(`Found ${matchedApplicantIds.length} AI match(es).`);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsAiSearchingApplicants(false);
    }
  }, [
    setAppliedApplicants,
    setAppliedApplicantsTotal,
    setApplicantFilters,
    setFilteredApplicants,
    setFilteredApplicantsTotal,
    setPotentialApplicants,
    setPotentialApplicantsTotal,
  ]);

  return {
    handlePositionApplicantAiSearch,
    isAiSearchingApplicants,
  };
}
