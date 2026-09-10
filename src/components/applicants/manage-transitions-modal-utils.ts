import * as z from "zod";
import type { RecruitmentStage } from "@/lib/types";

export const transitionFormSchema = z.object({
  newStatus: z.string().min(1, "New status is required"),
  notes: z.string().optional(),
});

export type TransitionFormValues = z.infer<typeof transitionFormSchema>;

export function resolveTransitionStageId(
  stages: RecruitmentStage[],
  stageIdOrName?: string | null,
) {
  if (!stageIdOrName) {
    return "";
  }

  const matchedStage = stages.find(
    (stage) => stage.id === stageIdOrName || stage.name === stageIdOrName,
  );

  return matchedStage?.id || stageIdOrName;
}

export function getTransitionCurrentStatus({
  status,
  statusId,
}: {
  status?: string | null;
  statusId?: string | null;
}) {
  return statusId || status || "";
}

export function getTrimmedTransitionNotes(notes?: string | null) {
  return notes?.trim() || "";
}

export function isNoopTransitionSubmit({
  currentStatus,
  newStatus,
  notes,
}: {
  currentStatus: string;
  newStatus: string;
  notes: string;
}) {
  return newStatus === currentStatus && !notes;
}

export function isBlockedTransitionUpdateResult(result: boolean | undefined) {
  return result === false || result === undefined;
}

export function buildTransitionFormErrorMessage(errors: Record<string, { message?: unknown } | undefined>) {
  const errorMessages = Object.values(errors)
    .map((error) => error?.message)
    .filter((message): message is string => typeof message === "string" && message.length > 0);

  return errorMessages.length > 0
    ? `Please fix the following errors: ${errorMessages.join(", ")}`
    : "Please fix the form errors before submitting";
}
