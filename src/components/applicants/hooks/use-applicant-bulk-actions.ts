import { useCallback, useState } from 'react';
import { toast } from "react-hot-toast";
import { getErrorMessage } from '@/lib/networkUtils';
import type { ApplicantFilterValues } from '@/lib/types';
import {
  bulkAssignApplicantRecruiter,
  bulkChangeApplicantStatus,
  bulkDeleteApplicants,
  bulkReprocessApplicants,
  getBulkActionArrayCount,
  getBulkActionCount,
  getBulkRecruiterName,
  getBulkReprocessErrorMessages,
} from './applicant-bulk-action-utils';

interface UseApplicantBulkActionsProps {
  fetchTableData: (filters: ApplicantFilterValues, page: number, pageSize: number) => void | Promise<void>;
  fetchAllApplicantsForCounts: () => void | Promise<void>;
  filters: ApplicantFilterValues;
  page: number;
  pageSize: number;
  availableRecruiter: Array<{ id: string; name: string }>;
}

export function useApplicantBulkActions({
  fetchTableData,
  fetchAllApplicantsForCounts,
  filters,
  page,
  pageSize,
  availableRecruiter,
}: UseApplicantBulkActionsProps) {
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<Set<string>>(new Set());

  const clearSelectionAndRefresh = useCallback(() => {
    setSelectedApplicantIds(new Set());
    if (filters) {
      void fetchTableData(filters, page, pageSize);
    }
    void fetchAllApplicantsForCounts();
  }, [fetchAllApplicantsForCounts, fetchTableData, filters, page, pageSize]);

  const handleBulkDelete = useCallback(async (applicantIds: string[]) => {
    try {
      const result = await bulkDeleteApplicants(applicantIds);
      toast.success(`${getBulkActionCount(result, 'successCount')} Applicant(s) deleted successfully`);
      clearSelectionAndRefresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [clearSelectionAndRefresh]);

  const handleBulkChangeStatus = useCallback(async (
    applicantIds: string[],
    newStatus: string,
    notes?: string
  ) => {
    try {
      const result = await bulkChangeApplicantStatus(applicantIds, newStatus, notes);
      const rejectedCount = getBulkActionArrayCount(result, 'rejectedApplicants');
      const updatedCount = getBulkActionCount(result, 'updatedCount');

      if (rejectedCount > 0) {
        if (updatedCount > 0) {
          toast.success(`${updatedCount} Applicant(s) status updated to ${newStatus}`);
        }

        // Headcount constraint details are handled by the warning UI.
      } else {
        toast.success(`${updatedCount || applicantIds.length} Applicant(s) status updated to ${newStatus}`);
      }

      clearSelectionAndRefresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [clearSelectionAndRefresh]);

  const handleBulkAssignRecruiter = useCallback(async (
    applicantIds: string[],
    recruiterId: string | null
  ) => {
    try {
      const result = await bulkAssignApplicantRecruiter(applicantIds, recruiterId);
      const recruiterName = getBulkRecruiterName(availableRecruiter, recruiterId);

      toast.success(`${getBulkActionCount(result, 'successCount')} Applicant(s) assigned to ${recruiterName}`);
      clearSelectionAndRefresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [availableRecruiter, clearSelectionAndRefresh]);

  const handleBulkReprocess = useCallback(async (applicantIds: string[]) => {
    try {
      const result = await bulkReprocessApplicants(applicantIds);
      const errorMessages = getBulkReprocessErrorMessages(result);

      if (errorMessages.length > 0) {
        const successCount = getBulkActionCount(result, 'reprocessedCount');

        if (successCount > 0) {
          toast.success(`${successCount} Applicant(s) queued for re-processing`);
        }

        toast.error(`${errorMessages.length} Applicant(s) failed: ${errorMessages.join(', ')}`);
      } else {
        toast.success(`${getBulkActionCount(result, 'reprocessedCount', applicantIds.length) || applicantIds.length} Applicant(s) queued for re-processing`);
      }

      clearSelectionAndRefresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [clearSelectionAndRefresh]);

  return {
    selectedApplicantIds,
    setSelectedApplicantIds,
    handleBulkDelete,
    handleBulkChangeStatus,
    handleBulkAssignRecruiter,
    handleBulkReprocess,
  };
}
