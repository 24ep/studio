import type { Applicant } from '@/lib/types';

import { selectApplicantsByIds as selectApplicantsByIdsForDisplay } from './applicant-score-count-utils';

export function paginateApplicantsForDisplay(
  applicants: Applicant[],
  page: number,
  pageSize: number
) {
  const safePageSize = pageSize > 0 ? pageSize : 20;
  const safePage = page > 0 ? page : 1;
  const startIndex = (safePage - 1) * safePageSize;
  return applicants.slice(startIndex, startIndex + safePageSize);
}

export function selectPaginatedApplicantsForDisplay({
  isAiSearchActive,
  aiMatchedApplicantIds,
  mappedApplicants,
  page,
  pageSize,
}: {
  isAiSearchActive: boolean;
  aiMatchedApplicantIds?: string[] | null;
  mappedApplicants?: Applicant[] | null;
  page: number;
  pageSize: number;
}) {
  const applicantList = Array.isArray(mappedApplicants) ? mappedApplicants : [];
  if (!isAiSearchActive || !aiMatchedApplicantIds) {
    return applicantList;
  }

  return paginateApplicantsForDisplay(
    selectApplicantsByIdsForDisplay(applicantList, aiMatchedApplicantIds),
    page,
    pageSize
  );
}
