import type { Applicant } from '@/lib/types';

import { paginateApplicantsForDisplay } from './applicant-page-pagination-utils';

export function selectDisplayedApplicantsForTable({
  isAiSearchActive,
  aiMatchedApplicantIds,
  mappedApplicants,
  filteredApplicants,
  paginatedApplicants,
  page,
  pageSize,
}: {
  isAiSearchActive: boolean;
  aiMatchedApplicantIds?: string[] | null;
  mappedApplicants?: Applicant[] | null;
  filteredApplicants?: Applicant[] | null;
  paginatedApplicants?: Applicant[] | null;
  page: number;
  pageSize: number;
}) {
  const safePaginatedApplicants = Array.isArray(paginatedApplicants) ? paginatedApplicants : [];
  if (isAiSearchActive && aiMatchedApplicantIds) {
    return safePaginatedApplicants;
  }

  const safeMappedApplicants = Array.isArray(mappedApplicants) ? mappedApplicants : [];
  const safeFilteredApplicants = Array.isArray(filteredApplicants) ? filteredApplicants : [];
  if (safeMappedApplicants.length === 0 && safeFilteredApplicants.length > 0) {
    return paginateApplicantsForDisplay(safeFilteredApplicants, page, pageSize);
  }

  return safePaginatedApplicants;
}

export function selectApplicantsToRender(
  displayedApplicants?: Applicant[] | null,
  lastNonEmptyApplicants?: Applicant[] | null,
  hasTransientState = false
) {
  const current = Array.isArray(displayedApplicants) ? displayedApplicants : [];
  const fallback = Array.isArray(lastNonEmptyApplicants) ? lastNonEmptyApplicants : [];

  if (current.length === 0 && hasTransientState && fallback.length > 0) {
    return fallback;
  }

  return current;
}

export function splitPinnedApplicantsForTable(
  applicants?: Applicant[] | null,
  pinnedApplicants?: Applicant[] | null
) {
  const pinned = Array.isArray(pinnedApplicants) ? pinnedApplicants : [];
  const pinnedIds = new Set(pinned.map(applicant => applicant.id));
  const unpinned = (Array.isArray(applicants) ? applicants : [])
    .filter(applicant => !pinnedIds.has(applicant.id));

  return { pinned, unpinned };
}

export function groupApplicantsByEmailForTable(applicants?: Applicant[] | null) {
  const groupsByEmail: Record<string, Applicant[]> = {};
  const emailOrder: string[] = [];
  const seenEmails = new Set<string>();

  for (const applicant of Array.isArray(applicants) ? applicants : []) {
    const email = applicant.email || 'no-email';
    if (!groupsByEmail[email]) {
      groupsByEmail[email] = [];
    }
    groupsByEmail[email].push(applicant);

    if (!seenEmails.has(email)) {
      seenEmails.add(email);
      emailOrder.push(email);
    }
  }

  return { groupsByEmail, emailOrder };
}
