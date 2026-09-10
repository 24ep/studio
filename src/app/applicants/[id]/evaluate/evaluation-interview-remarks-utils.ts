import type { ApplicantWithInterviewRemarks } from './evaluation-form-state-types';

export function getSharedInterviewRemarks(applicantData: ApplicantWithInterviewRemarks) {
  return applicantData?.customAttributes?.interviewRemarks ||
    applicantData?.custom_attributes?.interviewRemarks ||
    '';
}

export function buildSharedInterviewRemarkAttributes(
  applicantData: ApplicantWithInterviewRemarks,
  interviewRemarks: string
) {
  const currentCustomAttributes = applicantData?.customAttributes ||
    applicantData?.custom_attributes ||
    {};

  return {
    ...currentCustomAttributes,
    interviewRemarks,
  };
}
