"use client";

import { AppliedJobGradeBadge } from "./AppliedJobGradeBadge";
import { buildFullApplicantDetailDerivedState } from "./full-applicant-detail-derived-state";
import type { Applicant, Position } from "@/lib/types";

export function useFullApplicantDetailDerivedValues({
  applicant,
  applicantJobMatches,
  isJobMatchEnabled,
  positions,
}: {
  applicant: Applicant | null;
  applicantJobMatches: unknown[];
  isJobMatchEnabled: boolean;
  positions: Position[];
}) {
  const {
    appliedFitScore,
    appliedJobGradeBadgeData,
    appliedJobId,
    appliedJustification,
    educationCount,
    experienceDuration,
    jobMatchCount,
  } = buildFullApplicantDetailDerivedState({
    applicant,
    applicantJobMatches,
    isJobMatchEnabled,
    positions,
  });

  return {
    appliedFitScore,
    appliedJobBadge: appliedJobGradeBadgeData
      ? <AppliedJobGradeBadge gradeBadgeData={appliedJobGradeBadgeData} />
      : null,
    appliedJobId,
    appliedJustification,
    educationCount,
    experienceDuration,
    jobMatchCount,
  };
}
