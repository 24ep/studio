import { isToday, parseISO } from 'date-fns';

import type { Applicant } from '../../lib/types';
import { ACTIVE_APPLICANT_STATUSES, type CoreApplicantStatus } from '../../lib/types';

export function isApplicantActive(applicant: Pick<Applicant, 'status'>) {
  const statusName = applicant.status || '';
  return ACTIVE_APPLICANT_STATUSES.includes(statusName as CoreApplicantStatus);
}

export function isApplicantApplicationToday(applicant: Pick<Applicant, 'applicationDate'>) {
  try {
    if (!applicant.applicationDate || typeof applicant.applicationDate !== 'string') return false;
    return isToday(parseISO(applicant.applicationDate));
  } catch {
    return false;
  }
}

export function getActiveUnassignedApplicants<T extends Pick<Applicant, 'status' | 'recruiterId'>>(applicants: T[]) {
  return applicants.filter(applicant => isApplicantActive(applicant) && !applicant.recruiterId);
}

export function getHighPriorityApplicants<T extends Pick<Applicant, 'fitScore'>>(applicants: T[]) {
  return applicants.filter(applicant => typeof applicant.fitScore === 'number' && applicant.fitScore >= 80);
}
