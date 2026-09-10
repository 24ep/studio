import type { Applicant } from "../../../lib/types";

export type ApplicantListUpdater = (applicants: Applicant[] | ((prev: Applicant[]) => Applicant[])) => void;

interface ApplicantListSetters {
  setFilteredApplicants: ApplicantListUpdater;
  setAllApplicantsForCounts: ApplicantListUpdater;
}

export function updateApplicantLists(
  { setFilteredApplicants, setAllApplicantsForCounts }: ApplicantListSetters,
  updater: (applicant: Applicant) => Applicant,
) {
  setFilteredApplicants((prev: Applicant[]) => prev.map(applicant => updater(applicant)));
  setAllApplicantsForCounts((prev: Applicant[]) => prev.map(applicant => updater(applicant)));
}

export function removeApplicantFromLists(
  { setFilteredApplicants, setAllApplicantsForCounts }: ApplicantListSetters,
  applicantId: string,
) {
  setFilteredApplicants((prev: Applicant[]) => prev.filter(applicant => applicant.id !== applicantId));
  setAllApplicantsForCounts((prev: Applicant[]) => prev.filter(applicant => applicant.id !== applicantId));
}

export function appendApplicantToLists(
  { setFilteredApplicants, setAllApplicantsForCounts }: ApplicantListSetters,
  applicant: Applicant,
) {
  setFilteredApplicants(prev => [...prev, applicant]);
  setAllApplicantsForCounts(prev => [...prev, applicant]);
}

export function createApplicantStatusUpdater(applicantId: string, status: Applicant["status"]) {
  return (applicant: Applicant): Applicant => (
    applicant.id === applicantId
      ? { ...applicant, status, updatedAt: new Date().toISOString() }
      : applicant
  );
}

export function createOriginalApplicantRestorer(originalApplicant: Applicant) {
  return (applicant: Applicant): Applicant => (
    applicant.id === originalApplicant.id ? originalApplicant : applicant
  );
}
