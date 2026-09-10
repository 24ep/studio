import type { Applicant } from '../../lib/types';

export function getMultiRecruiterStageApplicants(
  applicants: Applicant[],
  stage: string,
  recruiterId: string
) {
  if (!Array.isArray(applicants)) {
    console.warn('ApplicantMultiRecruiterKanbanView: applicants is not an array:', applicants);
    return [];
  }

  return applicants.filter((applicant) => (
    applicant &&
    applicant.status === stage &&
    applicant.recruiterId === recruiterId
  ));
}
