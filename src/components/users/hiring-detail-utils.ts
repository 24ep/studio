import type { HiringDetails } from './hiring-detail-types';

export function hasHiringDetails(data: HiringDetails | null): data is HiringDetails {
  return Boolean(data?.headcount || data?.applicant);
}

export function getApplicantProfileHref(applicant: NonNullable<HiringDetails['applicant']>): string {
  if (applicant.positionId) {
    return `/positions/${applicant.positionId}?applicantId=${applicant.id}`;
  }

  return `/applicants?applicantId=${applicant.id}`;
}

export function getMatchCriteriaLabels(matchCriteria: HiringDetails['matchCriteria']): string[] {
  return [
    matchCriteria.matchedByEmployeeId ? 'Matched by Employee ID' : null,
    matchCriteria.matchedByEmail ? 'Matched by Email' : null,
    matchCriteria.matchedByPhone ? 'Matched by Phone' : null
  ].filter((label): label is string => Boolean(label));
}
