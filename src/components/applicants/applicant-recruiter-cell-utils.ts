import type {
  ApplicantRecruiterCellApplicant,
  ApplicantRecruiterOption,
} from './applicant-recruiter-cell-types';

export function formatApplicantRecruiterName(name: string) {
  if (!name) return '';

  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName} ${lastName.charAt(0)}.`;
}

export function filterApplicantRecruiters(
  recruiters: ApplicantRecruiterOption[],
  searchTerm: string
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) return recruiters;

  return recruiters.filter(recruiter => (
    recruiter.name.toLowerCase().includes(normalizedSearch)
  ));
}

export function getApplicantDisplayRecruiter(
  applicant: ApplicantRecruiterCellApplicant,
  recruiters: ApplicantRecruiterOption[]
) {
  return applicant.recruiter ||
    recruiters.find(recruiter => recruiter.id === applicant.recruiterId) ||
    null;
}
