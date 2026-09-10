import { useCallback } from "react";
import { toast } from "react-hot-toast";

import {
  getUploadQueueBulkRetryToastMessages,
  getUploadQueueRetryErrorMessage,
  markUploadQueueItemQueued,
  removeUploadQueueItem,
} from "./applicant-import-queue-utils";
import {
  deleteUploadQueueItem,
  getUploadQueueActionError,
  retryUploadQueueItem,
  runUploadQueueBulkAction,
} from "./applicant-import-upload-queue-api";
import type { QueueResponse } from "./applicant-import-queue-types";

interface UseApplicantImportUploadQueueActionsOptions {
  fetchQueue: (currentPage?: number, currentPageSize?: number) => Promise<void>;
  page: number;
  pageSize: number;
  setQueueData: React.Dispatch<React.SetStateAction<QueueResponse | null>>;
  clearSelection: () => void;
}

export function useApplicantImportUploadQueueActions({
  clearSelection,
  fetchQueue,
  page,
  pageSize,
  setQueueData,
}: UseApplicantImportUploadQueueActionsOptions) {
  const handleRetryItem = useCallback(async (itemId: string) => {
    try {
      const result = await retryUploadQueueItem(itemId);

      if (result.ok) {
        toast.success("Job queued for retry");
        setQueueData((prev) => markUploadQueueItemQueued(prev, itemId));
        fetchQueue(page, pageSize);
      } else {
        console.error(`Retry failed for job ${itemId}:`, result.data);
        toast.error(getUploadQueueRetryErrorMessage(result.data.error));
      }
    } catch (error) {
      console.error(`Retry error for job ${itemId}:`, error);
      toast.error("Failed to retry job");
    }
  }, [fetchQueue, page, pageSize, setQueueData]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    try {
      const result = await deleteUploadQueueItem(itemId);

      if (result.ok) {
        toast.success("Job deleted");
        setQueueData((prev) => removeUploadQueueItem(prev, itemId));
        fetchQueue(page, pageSize);
      } else {
        toast.error(getUploadQueueActionError(result.data, "Failed to delete job"));
      }
    } catch {
      toast.error("Failed to delete job");
    }
  }, [fetchQueue, page, pageSize, setQueueData]);

  const handleBulkDelete = useCallback(async (itemIds: string[]) => {
    if (!confirm("Are you sure you want to delete these jobs?")) return;

    try {
      const result = await runUploadQueueBulkAction("delete", itemIds);

      if (result.ok) {
        toast.success("Jobs deleted");
        clearSelection();
        fetchQueue(page, pageSize);
      } else {
        toast.error(getUploadQueueActionError(result.data, "Failed to delete jobs"));
      }
    } catch {
      toast.error("Failed to delete jobs");
    }
  }, [clearSelection, fetchQueue, page, pageSize]);

  const handleBulkRetry = useCallback(async (itemIds: string[]) => {
    try {
      const result = await runUploadQueueBulkAction("retry", itemIds);

      if (result.ok) {
        const { successMessage, errorMessage } = getUploadQueueBulkRetryToastMessages(result.data);

        if (successMessage) {
          toast.success(successMessage);
        }

        if (errorMessage) {
          toast.error(errorMessage);
          console.error("Bulk retry failed details:", result.data.failedDetails);
        }

        clearSelection();
        fetchQueue(page, pageSize);
      } else {
        toast.error(getUploadQueueActionError(result.data, "Failed to retry jobs"));
      }
    } catch (error) {
      console.error("Bulk retry error:", error);
      toast.error("Failed to retry jobs");
    }
  }, [clearSelection, fetchQueue, page, pageSize]);

  return {
    handleBulkDelete,
    handleBulkRetry,
    handleDeleteItem,
    handleRetryItem,
  };
}
