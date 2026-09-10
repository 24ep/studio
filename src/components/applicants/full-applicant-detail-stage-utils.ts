import type { Applicant } from "@/lib/types";

import type { ApplicantStageLike } from "./full-applicant-detail-types";

export function resolveApplicantStageId(
  status: unknown,
  fallbackStatusId: string | null | undefined,
  stages: ApplicantStageLike[],
) {
  const requestedStatus = typeof status === "string" ? status : "";
  return (
    stages.find((stage) => stage.id === requestedStatus || stage.name === requestedStatus)?.id ||
    fallbackStatusId ||
    requestedStatus
  );
}

export function resolveApplicantTransitionStageId(
  stageIdOrName: string | undefined,
  applicant: Pick<Applicant, "status" | "statusId"> | null | undefined,
  stages: ApplicantStageLike[],
) {
  return (
    stages.find((stage) => stage.id === stageIdOrName || stage.name === stageIdOrName)?.id ||
    applicant?.statusId ||
    stages.find((stage) => stage.name === applicant?.status)?.id ||
    stages[0]?.id ||
    null
  );
}

export function canCloseApplicantHeadcountWarning(
  openedAt: number | null | undefined,
  now = Date.now(),
  minimumOpenMs = 2000,
) {
  return !openedAt || now - openedAt >= minimumOpenMs;
}

export function canOpenApplicantTransitionsModal(
  warningShownAt: number | null | undefined,
  now = Date.now(),
  cooldownMs = 3000,
) {
  return !warningShownAt || now - warningShownAt >= cooldownMs;
}

export function isApplicantHiringStage(stageName: string) {
  const normalizedStageName = stageName.toLowerCase();
  return (
    normalizedStageName.includes("hired") ||
    normalizedStageName.includes("hiring") ||
    normalizedStageName.includes("employed")
  );
}
