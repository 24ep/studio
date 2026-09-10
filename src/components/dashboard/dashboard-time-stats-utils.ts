import type { Applicant } from '../../lib/types';
import { getApplicantDaysToHire } from './dashboard-time-to-hire-utils';

export function calculateAverageTimeToHire(
  applicants: Applicant[],
  hiredStageId?: string
) {
  const hiredApplicants = applicants.filter(applicant => (
    applicant.status === 'Hired' &&
    applicant.applicationDate &&
    typeof applicant.applicationDate === 'string'
  ));

  if (hiredApplicants.length === 0) return 0;

  const totalDays = hiredApplicants.reduce(
    (total, applicant) => total + getApplicantDaysToHire(applicant, hiredStageId),
    0
  );

  return parseFloat((totalDays / hiredApplicants.length).toFixed(2));
}
