import type { Applicant } from "../../../lib/types";

export function createLoadingRecruiter(recruiterId: string) {
  return {
    id: recruiterId,
    name: "Loading...",
    email: "",
    avatarUrl: null,
  };
}

export function createLoadingApplicantSource(sourceId: string) {
  return {
    id: sourceId,
    name: "Loading...",
    description: "",
    allowSubSource: false,
    sortOrder: 0,
    isActive: true,
  };
}

export function createApplicantRecruiterUpdater(applicantId: string, recruiterId: string | null) {
  return (applicant: Applicant): Applicant => (
    applicant.id === applicantId
      ? {
          ...applicant,
          recruiterId,
          recruiter: recruiterId ? createLoadingRecruiter(recruiterId) : null,
          updatedAt: new Date().toISOString(),
        }
      : applicant
  );
}

export function createApplicantRecruiterRestorer(
  applicantId: string,
  recruiter: Applicant["recruiter"] | null,
) {
  return (applicant: Applicant): Applicant => (
    applicant.id === applicantId
      ? {
          ...applicant,
          recruiterId: recruiter?.id || null,
          recruiter,
          updatedAt: new Date().toISOString(),
        }
      : applicant
  );
}

export function createApplicantSourceUpdater(applicantId: string, sourceId: string | null) {
  return (applicant: Applicant): Applicant => (
    applicant.id === applicantId
      ? {
          ...applicant,
          sourceId,
          source: sourceId ? createLoadingApplicantSource(sourceId) : null,
          updatedAt: new Date().toISOString(),
        }
      : applicant
  );
}

export function createApplicantSourceRestorer(
  applicantId: string,
  source: Applicant["source"] | null,
) {
  return (applicant: Applicant): Applicant => (
    applicant.id === applicantId
      ? {
          ...applicant,
          sourceId: source?.id || null,
          source,
          updatedAt: new Date().toISOString(),
        }
      : applicant
  );
}

export function getRecruiterAssignmentSuccessMessage(recruiterId: string | null) {
  return recruiterId ? "Recruiter assigned successfully" : "Recruiter unassigned successfully";
}

export function getSourceAssignmentSuccessMessage(sourceId: string | null) {
  return sourceId ? "Source assigned successfully" : "Source unassigned successfully";
}
