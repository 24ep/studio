import { format } from 'date-fns';

import type { Headcount, HeadcountStatus } from '../../lib/types';

export const HEADCOUNT_BASE_COLUMN_COUNT = 11;

export type HeadcountApprovalState = 'pending' | 'approved' | 'rejected' | 'not_required';

export interface HeadcountApprovalDecision {
  state: HeadcountApprovalState;
  actorName: string | null;
  decidedAt: string | null;
  rejectionReason: string | null;
}

export const HEADCOUNT_STATUS_OPTIONS: { value: HeadcountStatus; label: string; color: string }[] = [
  { value: 'vacant', label: 'Vacant', color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800' },
  { value: 'filled', label: 'Filled', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' },
];

export function getHeadcountTableColumnCount(customFieldCount: number) {
  return HEADCOUNT_BASE_COLUMN_COUNT + customFieldCount;
}

export function getHeadcountActualStatus(headcount: Pick<Headcount, 'status' | 'applicantId'>): HeadcountStatus {
  return headcount.status === 'filled' && headcount.applicantId !== null ? 'filled' : 'vacant';
}

export function getHeadcountStatusOption(status: HeadcountStatus) {
  return HEADCOUNT_STATUS_OPTIONS.find(option => option.value === status) || HEADCOUNT_STATUS_OPTIONS[0];
}

export function getHeadcountApprovalDecision(
  headcount: Pick<Headcount, 'status' | 'customFields'>
): HeadcountApprovalDecision {
  const rawStatus = headcount.status as string;
  const action = getHeadcountAuditString(headcount, 'approvalAction');
  const requestSource = getHeadcountAuditString(headcount, 'requestSource');
  const auditFields = {
    actorName: getHeadcountAuditString(headcount, 'approvalActionByName'),
    decidedAt: getHeadcountAuditString(headcount, 'approvalActionAt'),
    rejectionReason: getHeadcountAuditString(headcount, 'rejectionReason'),
  };

  if (rawStatus === 'pending') {
    return { state: 'pending', ...auditFields };
  }

  if (rawStatus === 'rejected' || action === 'reject') {
    return { state: 'rejected', ...auditFields };
  }

  if (
    action === 'approve' ||
    (requestSource === 'hiring_headcount_request' && (rawStatus === 'vacant' || rawStatus === 'filled'))
  ) {
    return { state: 'approved', ...auditFields };
  }

  return { state: 'not_required', ...auditFields };
}

function getHeadcountAuditString(
  headcount: Pick<Headcount, 'customFields'>,
  key: string
) {
  const value = headcount.customFields?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function formatHeadcountRequestDateGroupLabel(requestDate: string) {
  return requestDate === 'No Date' ? 'Not Set' : format(new Date(requestDate), 'MMM dd, yyyy');
}

export function groupHeadcountsByRequestDate(headcounts: Headcount[]) {
  const groupedHeadcounts = headcounts.reduce((groups, headcount) => {
    const requestDate = headcount.requestDate
      ? format(new Date(headcount.requestDate), 'yyyy-MM-dd')
      : 'No Date';

    if (!groups[requestDate]) {
      groups[requestDate] = [];
    }

    groups[requestDate].push(headcount);
    return groups;
  }, {} as Record<string, Headcount[]>);

  return Object.entries(groupedHeadcounts).sort(([dateA], [dateB]) => {
    if (dateA === 'No Date') return 1;
    if (dateB === 'No Date') return -1;
    return dateB.localeCompare(dateA);
  });
}
