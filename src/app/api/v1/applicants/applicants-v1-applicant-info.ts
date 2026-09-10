import { isRecord } from './applicants-v1-payload-guards';
import type {
  ApplicantInfo,
  ApplicantInfoInput,
} from './applicants-v1-payload-types';

export function toApplicantInfo(value: ApplicantInfoInput): ApplicantInfo {
  const source = isRecord(value) ? value : {};
  const personalInfo = isRecord(source.personal_info) ? source.personal_info : {};
  const contactInfo = isRecord(source.contact_info) ? source.contact_info : {};

  return {
    ...source,
    personal_info: personalInfo,
    contact_info: contactInfo,
    job_matches: Array.isArray(source.job_matches) ? source.job_matches : [],
  };
}

export function getApplicantCreateIdentity(applicantInfo: ApplicantInfo) {
  const firstname = applicantInfo.personal_info.firstname || '';
  const lastname = applicantInfo.personal_info.lastname || '';

  return {
    name: `${firstname} ${lastname}`.trim() || 'Unknown Applicant',
    email: applicantInfo.contact_info.email || 'unknown@email.com',
  };
}
