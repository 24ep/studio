"use client";

import { useCallback, useState, type MouseEvent } from "react";
import { toast } from "react-hot-toast";

interface UseEvaluationAssignmentRemovalOptions {
  positionId: string;
  errorLabel: string;
  logMessage: string;
  removeAssignment: (positionId: string, assignmentId: string) => Promise<unknown>;
  reloadAssignments: () => Promise<unknown>;
}

export function useEvaluationAssignmentRemoval({
  positionId,
  errorLabel,
  logMessage,
  removeAssignment,
  reloadAssignments,
}: UseEvaluationAssignmentRemovalOptions) {
  const [removingAssignmentId, setRemovingAssignmentId] = useState<string | null>(null);

  const handleRemoveAssignment = useCallback(async (
    assignmentId: string,
    itemName: string,
    event?: MouseEvent,
  ) => {
    event?.preventDefault();
    event?.stopPropagation();

    setRemovingAssignmentId(assignmentId);
    try {
      await removeAssignment(positionId, assignmentId);
      toast.success(`${itemName} removed successfully`);
      await reloadAssignments();
    } catch (error) {
      console.error(logMessage, error);
      toast.error(error instanceof Error && error.message ? error.message : `Failed to remove ${errorLabel}`);
    } finally {
      setRemovingAssignmentId(null);
    }
  }, [errorLabel, logMessage, positionId, reloadAssignments, removeAssignment]);

  return {
    removingAssignmentId,
    handleRemoveAssignment,
  };
}
