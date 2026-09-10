"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useToast } from "@/hooks/use-toast";
import { useToastManager } from "@/hooks/use-toast-manager";
import type { Applicant, ApplicantStatus, RecruitmentStage } from "@/lib/types";
import {
  buildTransitionFormErrorMessage,
  getTransitionCurrentStatus,
  getTrimmedTransitionNotes,
  isBlockedTransitionUpdateResult,
  isNoopTransitionSubmit,
  resolveTransitionStageId,
  transitionFormSchema,
  type TransitionFormValues,
} from "./manage-transitions-modal-utils";
import {
  useCurrentTransitionStageName,
  useManageTransitionLifecycle,
} from "./use-manage-transitions-modal-effects";

interface UseManageTransitionsModalOptions {
  applicant: Applicant | null;
  availableStages: RecruitmentStage[];
  isOpen: boolean;
  onCommentsChange: () => void;
  onOpenChange: (isOpen: boolean) => void;
  onRefreshApplicantData: (applicantId: string) => Promise<void>;
  onUpdateApplicant: (
    applicantId: string,
    status: ApplicantStatus,
    notes?: string,
    suppressToast?: boolean,
  ) => Promise<boolean | undefined>;
  preselectedStage?: string | null;
}

export function useManageTransitionsModal({
  applicant,
  availableStages,
  isOpen,
  onCommentsChange,
  onOpenChange,
  onRefreshApplicantData,
  onUpdateApplicant,
  preselectedStage,
}: UseManageTransitionsModalOptions) {
  const [isSaving, setIsSaving] = useState(false);
  const stages = useMemo(
    () => Array.isArray(availableStages) ? availableStages : [],
    [availableStages]
  );
  const currentStageName = useCurrentTransitionStageName({ applicant, isOpen });
  const {
    clearCloseTimeout,
    closeTimeoutRef,
    isMountedRef,
  } = useManageTransitionLifecycle(isOpen);
  const { success: showSuccessToast, error: showErrorToast } = useToastManager({
    deduplicationWindowMs: 2000,
  });
  const { dismissById, loadingWithId } = useToast();

  const form = useForm<TransitionFormValues>({
    resolver: zodResolver(transitionFormSchema),
    defaultValues: {
      newStatus: resolveTransitionStageId(stages, applicant?.statusId || applicant?.status || stages[0]?.id || ""),
      notes: "",
    },
  });

  const resetForm = useCallback(() => {
    form.reset({
      newStatus: resolveTransitionStageId(
        stages,
        preselectedStage || applicant?.statusId || applicant?.status || "",
      ),
      notes: "",
    });
  }, [applicant?.status, applicant?.statusId, form, preselectedStage, stages]);

  useEffect(() => {
    if (!isOpen || !applicant) {
      return;
    }

    resetForm();
  }, [applicant, isOpen, resetForm]);

  const handleAddTransitionSubmit = useCallback(async (data: TransitionFormValues) => {
    if (!isMountedRef.current || !applicant) {
      return;
    }

    const trimmedNotes = getTrimmedTransitionNotes(data.notes);
    const currentStatus = getTransitionCurrentStatus(applicant);

    if (isNoopTransitionSubmit({ currentStatus, newStatus: data.newStatus, notes: trimmedNotes })) {
      showErrorToast("Please select a new status or add notes to create a transition.");
      return;
    }

    setIsSaving(true);
    const loadingToastId = loadingWithId("Managing transaction...");

    try {
      const result = await onUpdateApplicant(applicant.id, data.newStatus, trimmedNotes, true);

      if (isBlockedTransitionUpdateResult(result)) {
        console.warn("ManageTransitionsModal - Update was blocked or returned no result. Not proceeding with success flow.");
        dismissById(loadingToastId);
        setIsSaving(false);
        return;
      }

      if (!isMountedRef.current) return;

      dismissById(loadingToastId);
      form.reset({ newStatus: data.newStatus, notes: "" });

      await onRefreshApplicantData(applicant.id);
      onCommentsChange();

      showSuccessToast("Update successful!", {
        duration: 3000,
        icon: "OK",
      });

      closeTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          onOpenChange(false);
        }
      }, 500);
    } catch (error) {
      if (!isMountedRef.current) return;

      dismissById(loadingToastId);
      console.error("Transition save error:", error);
      showErrorToast(error instanceof Error ? error.message : "Failed to save transition. Please try again.", {
        duration: 5000,
      });
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [
    applicant,
    dismissById,
    form,
    loadingWithId,
    onCommentsChange,
    onOpenChange,
    onRefreshApplicantData,
    onUpdateApplicant,
    showErrorToast,
    showSuccessToast,
  ]);

  const handleSaveClick = useCallback(async () => {
    try {
      const formValues = form.getValues();
      const isValid = await form.trigger();

      if (isValid) {
        await handleAddTransitionSubmit(formValues);
        return;
      }

      showErrorToast(buildTransitionFormErrorMessage(form.formState.errors));
    } catch (error) {
      console.error("Error in handleSaveClick:", error);
      showErrorToast("An unexpected error occurred. Please try again.");
    }
  }, [form, handleAddTransitionSubmit, showErrorToast]);

  const handleModalOpenChange = useCallback((open: boolean) => {
    onOpenChange(open);
    if (!open) {
      clearCloseTimeout();
    }
  }, [clearCloseTimeout, onOpenChange]);

  const handleCancelClick = useCallback(() => {
    resetForm();
    clearCloseTimeout();
    onOpenChange(false);
  }, [clearCloseTimeout, onOpenChange, resetForm]);

  return {
    currentStageName,
    form,
    handleCancelClick,
    handleModalOpenChange,
    handleSaveClick,
    isSaving,
    stages,
  };
}
