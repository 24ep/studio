import { useCallback } from 'react';
import type { ApplicantFilterValues, ApplicantStatus } from '@/lib/types';
import {
  runAssignRecruiterAction,
  runAssignSourceAction,
  runDeleteApplicantAction,
  runUpdateApplicantStatusAction,
} from "./applicant-action-handlers";
import type { ApplicantListUpdater } from './applicant-action-utils';
import { prepareApplicantAction } from './applicant-action-guards';

interface UseApplicantActionsProps {
  setFilteredApplicants: ApplicantListUpdater;
  setAllApplicantsForCounts: ApplicantListUpdater;
  fetchTableData: (filters: ApplicantFilterValues, page: number, pageSize: number) => void | Promise<void>;
  filters: ApplicantFilterValues;
  page: number;
  pageSize: number;
  aiMatchedApplicantIds: string[] | null;
}

export function useApplicantActions({
  setFilteredApplicants,
  setAllApplicantsForCounts,
  fetchTableData,
  filters,
  page,
  pageSize,
  aiMatchedApplicantIds
}: UseApplicantActionsProps) {
  const listSetters = { setFilteredApplicants, setAllApplicantsForCounts };
  const refreshOptions = { fetchTableData, filters, page, pageSize };
  const actionContext = { listSetters, refreshOptions };
  
  const updateApplicantStatus = useCallback(async (
    applicantId: string,
    newStatus: ApplicantStatus,
    notes?: string,
    suppressToast?: boolean
  ): Promise<void> => {
    const originalApplicant = await prepareApplicantAction(applicantId, aiMatchedApplicantIds);
    if (!originalApplicant) {
      return;
    }

    await runUpdateApplicantStatusAction({
      applicantId,
      context: actionContext,
      newStatus,
      notes,
      originalApplicant,
      suppressToast,
    });
  }, [setFilteredApplicants, setAllApplicantsForCounts, fetchTableData, filters, page, pageSize, aiMatchedApplicantIds]);

  const handleDeleteApplicant = useCallback(async (applicantId: string) => {
    const originalApplicant = await prepareApplicantAction(applicantId, aiMatchedApplicantIds);
    if (!originalApplicant) {
      return;
    }

    await runDeleteApplicantAction({ applicantId, context: actionContext, originalApplicant });
  }, [setFilteredApplicants, setAllApplicantsForCounts, fetchTableData, filters, page, pageSize, aiMatchedApplicantIds]);

  const handleAssignRecruiter = useCallback(async (applicantId: string, recruiterId: string | null) => {
    const originalApplicant = await prepareApplicantAction(applicantId, aiMatchedApplicantIds);
    if (!originalApplicant) {
      return;
    }

    await runAssignRecruiterAction({ applicantId, context: actionContext, originalApplicant, recruiterId });
  }, [setFilteredApplicants, setAllApplicantsForCounts, fetchTableData, filters, page, pageSize, aiMatchedApplicantIds]);

  const handleAssignSource = useCallback(async (applicantId: string, sourceId: string | null) => {
    const originalApplicant = await prepareApplicantAction(applicantId, aiMatchedApplicantIds);
    if (!originalApplicant) {
      return;
    }

    await runAssignSourceAction({ applicantId, context: actionContext, originalApplicant, sourceId });
  }, [setFilteredApplicants, setAllApplicantsForCounts, fetchTableData, filters, page, pageSize, aiMatchedApplicantIds]);

  return {
    updateApplicantStatus,
    handleDeleteApplicant,
    handleAssignRecruiter,
    handleAssignSource
  };
}
