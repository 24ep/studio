import type { Applicant } from '@prisma/client';

type ApplicantResponseSource = Pick<
  Applicant,
  | 'id'
  | 'name'
  | 'email'
  | 'phone'
  | 'expectedSalary'
  | 'parsedData'
  | 'applicationDate'
  | 'createdAt'
  | 'updatedAt'
  | 'recruiterId'
>;

export function asLogDetails(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function createApplicantResponse(applicant: ApplicantResponseSource) {
  return {
    id: applicant.id,
    name: applicant.name,
    email: applicant.email,
    phone: applicant.phone,
    expectedSalary: applicant.expectedSalary,
    status: 'Applied',
    parsedData: applicant.parsedData,
    applicationDate: applicant.applicationDate ? new Date(applicant.applicationDate).toISOString() : new Date().toISOString(),
    createdAt: applicant.createdAt ? new Date(applicant.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: applicant.updatedAt ? new Date(applicant.updatedAt).toISOString() : new Date().toISOString(),
    recruiterId: applicant.recruiterId,
  };
}
