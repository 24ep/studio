import type { Applicant } from "@/lib/types";

import {
  normalizeApplicantEditParsedData,
  normalizeApplicantJustification,
  type ApplicantStageLike,
} from "./full-applicant-detail-utils";

export function buildMobileApplicantStageNames(stages: ApplicantStageLike[]) {
  return stages.reduce<Record<string, string>>((names, stage) => {
    if (stage.id && stage.name) {
      names[stage.id] = stage.name;
    }
    return names;
  }, {});
}

export function getMobileApplicantAppliedSummary(applicant: Applicant | null) {
  return {
    appliedJobId: applicant?.positionId || null,
    appliedFitScore: applicant?.fitScore || null,
    appliedJustification: normalizeApplicantJustification(applicant?.assignmentJustification),
  };
}

export function getMobileApplicantProfileSections(applicant: Applicant | null) {
  if (!applicant) {
    return {
      personalInfo: {},
      education: [],
      experience: [],
    };
  }

  const parsedData = normalizeApplicantEditParsedData(applicant.parsedData);

  return {
    personalInfo: parsedData.personal_info,
    education: Array.isArray(applicant.educationData) && applicant.educationData.length > 0
      ? applicant.educationData
      : parsedData.education,
    experience: Array.isArray(applicant.experienceData) && applicant.experienceData.length > 0
      ? applicant.experienceData
      : parsedData.experience,
  };
}
