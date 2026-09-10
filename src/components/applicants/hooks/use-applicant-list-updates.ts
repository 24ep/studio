import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'react-hot-toast';

import type { Applicant } from '@/lib/types';
import type { ApplicantFilterValues } from '@/components/applicants/ApplicantFilters';
import {
  applyApplicantUpdateToList,
  replaceApplicantInList,
} from './applicant-data-state-utils';

type FetchTableData = (
  filters: ApplicantFilterValues,
  page: number,
  pageSize: number,
) => void;

interface UseApplicantListUpdatesOptions {
  fetchApplicantById: (applicantId: string) => Promise<Applicant | null>;
  setAllApplicantsForCounts: Dispatch<SetStateAction<Applicant[]>>;
  setFilteredApplicants: Dispatch<SetStateAction<Applicant[]>>;
}

export function useApplicantListUpdates({
  fetchApplicantById,
  setAllApplicantsForCounts,
  setFilteredApplicants,
}: UseApplicantListUpdatesOptions) {
  const refreshApplicantInList = useCallback(async (
    applicantId: string,
    fetchTableData: FetchTableData,
    filters: ApplicantFilterValues,
    page: number,
    pageSize: number,
    aiMatchedApplicantIds: string[] | null,
  ) => {
    if (aiMatchedApplicantIds !== null) {
      toast('AI Search Active: Please clear AI search or re-run it to see specific updates.');
      return;
    }

    const updatedApplicant = await fetchApplicantById(applicantId);
    if (updatedApplicant) {
      setFilteredApplicants((prev) => replaceApplicantInList(prev, applicantId, updatedApplicant));
      setAllApplicantsForCounts((prev) => replaceApplicantInList(prev, applicantId, updatedApplicant));
    } else {
      toast.error('Could not refresh data for applicant. Attempting full list refresh.');
      fetchTableData(filters, page, pageSize);
    }
  }, [fetchApplicantById, setAllApplicantsForCounts, setFilteredApplicants]);

  const applyOptimisticUpdate = useCallback((applicantId: string, updates: Partial<Applicant>) => {
    const updatedAt = new Date().toISOString();
    setFilteredApplicants((prev) => applyApplicantUpdateToList(prev, applicantId, updates, updatedAt));
    setAllApplicantsForCounts((prev) => applyApplicantUpdateToList(prev, applicantId, updates, updatedAt));
  }, [setAllApplicantsForCounts, setFilteredApplicants]);

  const revertOptimisticUpdate = useCallback((applicantId: string, originalApplicant: Applicant) => {
    setFilteredApplicants((prev) => replaceApplicantInList(prev, applicantId, originalApplicant));
    setAllApplicantsForCounts((prev) => replaceApplicantInList(prev, applicantId, originalApplicant));
  }, [setAllApplicantsForCounts, setFilteredApplicants]);

  return {
    applyOptimisticUpdate,
    refreshApplicantInList,
    revertOptimisticUpdate,
  };
}
