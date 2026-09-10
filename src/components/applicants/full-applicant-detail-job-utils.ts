import type {
  ApplicantJobMatchLike,
  ApplicantJobMatchModalData,
  ApplicantPositionLike,
} from "./full-applicant-detail-types";

export function buildApplicantJobMatchModalData(
  jobMatch: ApplicantJobMatchLike,
  positions: ApplicantPositionLike[] | null | undefined,
): ApplicantJobMatchModalData {
  const safePositions = Array.isArray(positions) ? positions : [];
  const position = safePositions.find(p => p.id === jobMatch.jobId) ||
    safePositions.find(p => p.title === jobMatch.jobTitle);
  const fitScore = typeof jobMatch.fitScore === "number" && Number.isFinite(jobMatch.fitScore)
    ? jobMatch.fitScore
    : 0;
  const matchReasons = Array.isArray(jobMatch.matchReasons)
    ? jobMatch.matchReasons.filter((reason): reason is string => typeof reason === "string" && reason.trim().length > 0)
    : [];

  return {
    jobId: position?.id || jobMatch.jobId || "",
    jobTitle: position?.title || jobMatch.jobTitle || "Unknown Position",
    fitScore,
    matchReasons,
    position: position
      ? {
        id: position.id || "",
        title: position.title || "Unknown Position",
        description: typeof position.description === "string" ? position.description : undefined,
        department: typeof position.department === "string" ? position.department : undefined,
        requirements: position.requirements,
        isOpen: position.isOpen === true,
      }
      : undefined,
  };
}

export function getAppliedJobGradeBadgeData(
  appliedJobId: string | null | undefined,
  positions: ApplicantPositionLike[] | null | undefined,
) {
  if (!appliedJobId || !Array.isArray(positions)) {
    return null;
  }

  const appliedPosition = positions.find(p => p.id === appliedJobId);
  if (!appliedPosition?.gradeId || !appliedPosition.grade?.name) {
    return null;
  }

  return {
    name: appliedPosition.grade.name,
    color: appliedPosition.grade.color || "#3B82F6",
  };
}
