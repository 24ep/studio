import { type CreateApplicantInput } from './applicants-v1-schema';
import {
  getApplicantCreateIdentity,
  toApplicantInfo,
} from './applicants-v1-applicant-info';
import {
  findPositionId,
  resolveFitScore,
} from './applicants-v1-payload-score-position';

export { cleanPayload } from './applicants-v1-payload-clean';

export function buildApplicantCreatePayload(validatedData: CreateApplicantInput) {
  const applicantInfo = toApplicantInfo(validatedData.applicant_info);
  const { email, name } = getApplicantCreateIdentity(applicantInfo);

  return {
    name,
    email,
    contactInfo: applicantInfo.contact_info,
    applicantInfo,
    expectedSalary: validatedData.expectedSalary,
    parsedData: {
      ...validatedData.applicant_info,
      education: validatedData.educationData || [],
      experience: validatedData.experienceData || [],
      job_applied: validatedData.job_applied || applicantInfo.job_applied,
      job_matches: validatedData.job_matches || applicantInfo.job_matches || [],
    },
    fitScore: resolveFitScore(applicantInfo, validatedData.job_applied),
    positionId: findPositionId(applicantInfo, validatedData.job_applied, validatedData.job_matches),
  };
}

export type ApplicantCreatePayload = ReturnType<typeof buildApplicantCreatePayload>;
