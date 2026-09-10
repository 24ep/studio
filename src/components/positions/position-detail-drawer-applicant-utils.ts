import type { Applicant, ApplicantFilterValues } from "@/lib/types";
import type { RecruitmentStageLike } from "./position-detail-drawer-types";

export function buildPositionStageNames(stages: RecruitmentStageLike[]) {
  return stages.reduce<Record<string, string>>((mapping, stage) => {
    if (stage.id && stage.name) {
      mapping[stage.id] = stage.name;
    }

    return mapping;
  }, {});
}

export function createDefaultPositionApplicantFilters(stages: RecruitmentStageLike[]): ApplicantFilterValues {
  const selectedStatuses = stages
    .filter((stage) => {
      const stageName = (stage.name || "").trim().toLowerCase();
      return stageName !== "hiring" && !stageName.includes("reject");
    })
    .map((stage) => stage.id)
    .filter((id): id is string => Boolean(id));

  return selectedStatuses.length > 0 ? { selectedStatuses } : {};
}

export function hasPositionApplicantFilterValues(filters?: ApplicantFilterValues | null) {
  if (!filters) {
    return false;
  }

  return Object.values(filters).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return value !== undefined && value !== null && value !== "";
  });
}

export function getInitialPositionApplicantFilters(
  currentFilters: ApplicantFilterValues,
  stages: RecruitmentStageLike[],
) {
  return hasPositionApplicantFilterValues(currentFilters)
    ? currentFilters
    : createDefaultPositionApplicantFilters(stages);
}

export function filterApplicantsByMatchedIds(applicants: Applicant[], matchedApplicantIds: readonly string[]) {
  const matchedIds = new Set(matchedApplicantIds);
  return applicants.filter((applicant) => matchedIds.has(applicant.id));
}

export function buildPositionApplicantTotalPages(total: number, pageSize: number) {
  const safePageSize = pageSize > 0 ? pageSize : 100;
  return Math.max(1, Math.ceil(Math.max(0, total) / safePageSize));
}

export function updateApplicantPinState<T extends Pick<Applicant, "id"> & { isPinned?: boolean }>(
  applicants: T[],
  applicantId: string,
  isPinned: boolean,
) {
  return applicants.map((applicant) => (
    applicant.id === applicantId
      ? { ...applicant, isPinned }
      : applicant
  ));
}

export function groupPositionApplicantsByEmail(applicants: Applicant[]) {
  const applicantsByEmail: Record<string, Applicant[]> = {};
  const emailOrder: string[] = [];
  const seenEmails = new Set<string>();

  applicants.forEach((applicant) => {
    if (!applicant.email) {
      return;
    }

    if (!applicantsByEmail[applicant.email]) {
      applicantsByEmail[applicant.email] = [];
    }

    applicantsByEmail[applicant.email].push(applicant);

    if (!seenEmails.has(applicant.email)) {
      seenEmails.add(applicant.email);
      emailOrder.push(applicant.email);
    }
  });

  return { applicantsByEmail, emailOrder };
}
