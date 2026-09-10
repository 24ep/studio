import type { Applicant } from '@/lib/types';

export function getSafeInitialApplicants(value: unknown): Applicant[] {
  return Array.isArray(value) ? value as Applicant[] : [];
}

export function replaceApplicantInList(
  applicants: Applicant[],
  applicantId: string,
  updatedApplicant: Applicant,
): Applicant[] {
  return applicants.map((applicant) =>
    applicant.id === applicantId ? updatedApplicant : applicant,
  );
}

export function applyApplicantUpdateToList(
  applicants: Applicant[],
  applicantId: string,
  updates: Partial<Applicant>,
  updatedAt = new Date().toISOString(),
): Applicant[] {
  return applicants.map((applicant) =>
    applicant.id === applicantId
      ? { ...applicant, ...updates, updatedAt }
      : applicant,
  );
}
