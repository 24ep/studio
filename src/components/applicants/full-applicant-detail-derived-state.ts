import type { Applicant } from "@/lib/types";
import {
  formatApplicantExperienceDuration,
  getApplicantParsedEntries,
  getAppliedJobGradeBadgeData,
  normalizeApplicantJustification,
  type ApplicantPositionLike,
} from "./full-applicant-detail-utils";

export function buildFullApplicantDetailDerivedState({
  applicant,
  applicantJobMatches,
  isJobMatchEnabled,
  positions,
}: {
  applicant: Applicant | null | undefined;
  applicantJobMatches: unknown[];
  isJobMatchEnabled: boolean;
  positions: ApplicantPositionLike[] | null | undefined;
}) {
  const appliedJobId = applicant?.positionId ?? null;

  return {
    appliedFitScore: applicant?.fitScore ?? null,
    appliedJobGradeBadgeData: getAppliedJobGradeBadgeData(appliedJobId, positions),
    appliedJobId,
    appliedJustification: normalizeApplicantJustification(applicant?.assignmentJustification),
    educationCount: getApplicantParsedEntries(applicant?.parsedData, "education").length,
    experienceDuration: formatApplicantExperienceDuration(applicant?.parsedData),
    jobMatchCount: isJobMatchEnabled ? applicantJobMatches.length : 0,
  };
}
