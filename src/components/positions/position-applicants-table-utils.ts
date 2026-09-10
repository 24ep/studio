import type { Applicant } from '@/lib/types';

import type { PositionApplicantVisibleColumns } from './position-applicants-table-types';

export function splitPinnedApplicants(applicants: Applicant[]) {
  return {
    pinned: applicants.filter(applicant => applicant.isPinned),
    unpinned: applicants.filter(applicant => !applicant.isPinned),
  };
}

export function getVisibleColumnSpan(visibleColumns: PositionApplicantVisibleColumns) {
  return Object.values(visibleColumns).filter(Boolean).length + 1;
}

export function getAppliedApplicantRowClass(applicant: Applicant) {
  if (applicant.isBlacklisted) {
    return 'border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
  }

  if (applicant.isPinned) {
    return 'border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
  }

  if (applicant.isRead !== true) {
    return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10';
  }

  return '';
}
