import { differenceInDays, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { z } from 'zod';

import { getApplicationTimezone } from '../../lib/dateUtils';
import { formatScoreWithGrade } from '../../lib/scoreUtils';
import type { Applicant } from '@/lib/types';

export type ApplicantTableRowHeight = 'compact' | 'normal' | 'comfortable';

export const DEFAULT_APPLICANT_TABLE_COLUMN_ORDER = [
  'pin',
  'applicant',
  'appliedJob',
  'jobMatches',
  'fitScore',
  'recruiter',
  'source',
  'status',
  'appliedDate',
  'lastUpdate',
  'createdAt',
];

export function displayApplicantFitScoreWithGrade(score: number | undefined | null) {
  return formatScoreWithGrade(score);
}

function formatApplicantAbsoluteDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: getApplicationTimezone(),
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(value => value.type === type)?.value ?? '';

  return `${part('month')} ${part('day')}, ${part('year')} ${part('hour')}:${part('minute')}`;
}

export function displayApplicantTableDate(
  dateString: string | undefined | null,
  daysThreshold = 7,
  now = new Date(),
): string {
  if (!dateString) return 'N/A';

  const date = parseISO(dateString);
  if (!isValid(date)) return 'Invalid Date';

  const daysAgo = Math.abs(differenceInDays(now, date));
  if (daysAgo < daysThreshold) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  return formatApplicantAbsoluteDate(date);
}

export function getRowHeightStyle(rowHeight: ApplicantTableRowHeight = 'normal') {
  switch (rowHeight) {
    case 'compact':
      return { height: '48px', minHeight: '48px' };
    case 'comfortable':
      return { height: '80px', minHeight: '80px' };
    case 'normal':
    default:
      return { height: '64px', minHeight: '64px' };
  }
}

export function getRowPaddingClass(rowHeight: ApplicantTableRowHeight = 'normal') {
  switch (rowHeight) {
    case 'compact':
      return '[&>td]:py-2';
    case 'comfortable':
      return '[&>td]:py-6';
    case 'normal':
    default:
      return '[&>td]:py-4';
  }
}

export function isApplicantTableDetailIdValid(applicantId: string | null | undefined) {
  return Boolean(applicantId && z.string().uuid().safeParse(applicantId).success);
}

export function getApplicantTableRowStateClass(applicant: Applicant) {
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
