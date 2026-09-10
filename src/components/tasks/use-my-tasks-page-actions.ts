"use client";

import React from "react";
import { toast } from "react-hot-toast";
import type { Task } from "@/components/tasks/TaskCard";
import {
  getTaskApplicantDisplayName,
  getTaskMoveUpdatedCount,
  toggleTaskStageSelection,
  type MyTasksStage,
  type TaskboardApplicant,
} from "@/components/tasks/my-tasks-page-utils";
import { safeFetch } from "@/lib/safe-fetch";
import type { ApplicantSummary } from "./MyTasksPageClientTypes";

export function useMyTasksPageActions({
  applicants,
  setApplicants,
  setIsDetailModalOpen,
  setSelectedApplicantSummary,
  setSelectedStages,
  stages,
}: {
  applicants: TaskboardApplicant[];
  setApplicants: React.Dispatch<React.SetStateAction<TaskboardApplicant[]>>;
  setIsDetailModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedApplicantSummary: React.Dispatch<React.SetStateAction<ApplicantSummary | null>>;
  setSelectedStages: React.Dispatch<React.SetStateAction<string[]>>;
  stages: MyTasksStage[];
}) {
  const openApplicantDetail = React.useCallback((applicant: TaskboardApplicant | Task) => {
    if (!applicant?.id) return;

    setSelectedApplicantSummary({
      id: applicant.id,
      name: getTaskApplicantDisplayName(applicant),
    });
    setIsDetailModalOpen(true);
  }, [setIsDetailModalOpen, setSelectedApplicantSummary]);

  const closeApplicantDetail = React.useCallback(() => {
    setIsDetailModalOpen(false);
    setTimeout(() => {
      setSelectedApplicantSummary(null);
    }, 100);
  }, [setIsDetailModalOpen, setSelectedApplicantSummary]);

  const handleMoveTask = React.useCallback(
    async (task: Task, newStatus: string) => {
      if (task.status === newStatus) return;

      const applicant = applicants.find((candidate) => candidate.id === task.id);
      if (!applicant) {
        toast.error("Applicant not found");
        return;
      }

      const stageName = stages.find((stage) => stage.id === newStatus)?.name || "Unknown Stage";

      try {
        toast.loading(`Moving ${applicant.name} to ${stageName}...`, {
          id: `move-${applicant.id}`,
        });

        const result = await safeFetch("/api/applicants/bulk-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "change_status",
            applicantIds: [applicant.id],
            newStatus,
          }),
          timeoutMs: 10000,
        });

        if (!result.ok) {
          console.warn("Skipping failed endpoint /api/applicants/bulk-action:", result.error || result.status);
          throw new Error(`Failed to update status: ${result.error}`);
        }

        if (getTaskMoveUpdatedCount(result.data) > 0) {
          setApplicants((prev) =>
            prev.map((candidate) =>
              candidate.id === applicant.id
                ? { ...candidate, statusId: newStatus }
                : candidate
            )
          );
          toast.success(`Moved ${applicant.name} to ${stageName}`, {
            id: `move-${applicant.id}`,
          });
        } else {
          toast.error(`Failed to move ${applicant.name}: No applicants updated`, {
            id: `move-${applicant.id}`,
          });
        }
      } catch (error) {
        console.error("Error updating applicant status:", error);
        toast.error(
          `Failed to update applicant status: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          { id: `move-${applicant.id}` }
        );
      }
    },
    [applicants, setApplicants, stages]
  );

  const toggleStageSelection = React.useCallback(
    (stageId: string) => {
      setSelectedStages((prev) => toggleTaskStageSelection(prev, stageId));
    },
    [setSelectedStages]
  );

  return {
    closeApplicantDetail,
    handleMoveTask,
    openApplicantDetail,
    toggleStageSelection,
  };
}
