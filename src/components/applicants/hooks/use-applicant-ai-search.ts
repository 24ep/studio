import { useCallback, useEffect, useRef, useState } from 'react';
import type { Applicant } from '@/lib/types';
import { toast } from "react-hot-toast";
import { readJsonOrFallback } from '@/lib/response-json';
import {
  getApplicantAiSearchErrorMessage,
  getApplicantAiSearchSuccessMessage,
  getApplicantDataListFromPayload,
  getErrorMessage,
  getMissingAiMatchedApplicantIds,
  getTrimmedApplicantAiSearchQuery,
  mergeUniqueApplicants,
  normalizeApplicantAiSearchResult,
  readApplicantAiSearchResponseJson,
  type NormalizedApplicantAiSearchResult,
} from './applicant-ai-search-utils';

interface UseApplicantAiSearchProps {
  setFilteredApplicants: (applicants: Applicant[] | ((prev: Applicant[]) => Applicant[])) => void;
  setAiMatchedApplicantIds: (ids: string[] | null) => void;
  setAiSearchReasoning: (reasoning: string | null) => void;
  setAiRecordCount: (count: number) => void;
  setIsAiSearchActive: (active: boolean) => void;
  filteredApplicants: Applicant[];
}

export function useApplicantAiSearch({
  setFilteredApplicants,
  setAiMatchedApplicantIds,
  setAiSearchReasoning,
  setAiRecordCount,
  setIsAiSearchActive,
  filteredApplicants,
}: UseApplicantAiSearchProps) {
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isAiSearching, setIsAiSearching] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const applyAiSearchResult = useCallback((result: NormalizedApplicantAiSearchResult) => {
    if (!isMountedRef.current) {
      return;
    }

    setAiMatchedApplicantIds(result.matchedApplicantIds);
    setAiSearchReasoning(result.aiReasoning);
    setAiRecordCount(result.recordCount);
    toast.success(getApplicantAiSearchSuccessMessage(result));
  }, [setAiMatchedApplicantIds, setAiRecordCount, setAiSearchReasoning]);

  const fetchMissingApplicants = useCallback(async () => {
    const response = await fetch('/api/applicants?limit=1000');

    if (!response.ok) {
      return false;
    }

    const payload = await readJsonOrFallback<unknown>(response, {});
    const applicants = getApplicantDataListFromPayload(payload);

    if (!applicants) {
      return false;
    }

    if (isMountedRef.current) {
      setFilteredApplicants((prevApplicants) => mergeUniqueApplicants(prevApplicants, applicants));
    }

    return true;
  }, [setFilteredApplicants]);

  const handleAiSearch = useCallback(async (aiQuery: string) => {
    const query = getTrimmedApplicantAiSearchQuery(aiQuery);

    if (!query) {
      toast("Please enter a search query for AI search.");
      return;
    }

    if (!isMountedRef.current) {
      return;
    }

    try {
      setIsAiSearching(true);
      setAiSearchReasoning(null);
      setAiMatchedApplicantIds(null);
      setAiRecordCount(0);
      setIsAiSearchActive(true);

      abortControllerRef.current = new AbortController();
      const response = await fetch('/api/ai/search-applicants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: abortControllerRef.current.signal,
      });

      if (!isMountedRef.current) {
        return;
      }

      const payload = await readApplicantAiSearchResponseJson(response);

      if (!response.ok) {
        throw new Error(getApplicantAiSearchErrorMessage(response.status, payload));
      }

      const result = normalizeApplicantAiSearchResult(payload);
      const missingApplicants = getMissingAiMatchedApplicantIds(
        filteredApplicants,
        result.matchedApplicantIds
      );

      if (result.matchedApplicantIds.length > 0 && missingApplicants.length > 0) {
        const loadedMissingApplicants = await fetchMissingApplicants();

        applyAiSearchResult(result);

        if (!loadedMissingApplicants && isMountedRef.current) {
          toast.error("Could not load all applicants. Some results may not be visible.");
        }

        return;
      }

      applyAiSearchResult(result);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("AI search request was cancelled.");
      } else {
        toast.error(getErrorMessage(error));
      }

      if (isMountedRef.current) {
        setAiMatchedApplicantIds([]);
        setAiRecordCount(0);
        setIsAiSearchActive(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsAiSearching(false);
      }
    }
  }, [
    applyAiSearchResult,
    fetchMissingApplicants,
    filteredApplicants,
    setAiMatchedApplicantIds,
    setAiRecordCount,
    setAiSearchReasoning,
    setIsAiSearchActive,
  ]);

  const cancelAiSearch = useCallback(() => {
    abortControllerRef.current?.abort();

    if (isMountedRef.current) {
      setIsAiSearching(false);
      setIsAiSearchActive(false);
      setAiMatchedApplicantIds(null);
      setAiSearchReasoning(null);
      setAiRecordCount(0);
    }
  }, [setAiMatchedApplicantIds, setAiRecordCount, setAiSearchReasoning, setIsAiSearchActive]);

  return {
    isAiSearching,
    handleAiSearch,
    cancelAiSearch,
  };
}
