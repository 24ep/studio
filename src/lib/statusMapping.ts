/**
 * Status mapping utilities for the Applicant status migration
 * This file provides helper functions to work with both old string statuses and new UUID statuses
 */

import { getCommonStageIds } from './recruitmentStageUtils';

/**
 * Common status names that are frequently used
 */
export const COMMON_STATUS_NAMES = {
  APPLIED: 'Applied',
  SCREENING: 'Screening',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEWING: 'Interviewing',
  OFFER_EXTENDED: 'Offer Extended',
  OFFER_ACCEPTED: 'Offer Accepted',
  HIRED: 'Hired',
  ON_HOLD: 'On Hold',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn'
} as const;

export type CommonStatusName = typeof COMMON_STATUS_NAMES[keyof typeof COMMON_STATUS_NAMES];

/**
 * Status color mapping for UI display
 */
export const STATUS_COLORS: Record<CommonStatusName, string> = {
  [COMMON_STATUS_NAMES.APPLIED]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  [COMMON_STATUS_NAMES.SCREENING]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-blue-800',
  [COMMON_STATUS_NAMES.SHORTLISTED]: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
  [COMMON_STATUS_NAMES.INTERVIEW_SCHEDULED]: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
  [COMMON_STATUS_NAMES.INTERVIEWING]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
  [COMMON_STATUS_NAMES.OFFER_EXTENDED]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
  [COMMON_STATUS_NAMES.OFFER_ACCEPTED]: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  [COMMON_STATUS_NAMES.HIRED]: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  [COMMON_STATUS_NAMES.ON_HOLD]: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  [COMMON_STATUS_NAMES.REJECTED]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
  [COMMON_STATUS_NAMES.WITHDRAWN]: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
};

const BACKLOG_STATUSES = new Set<string>([
  COMMON_STATUS_NAMES.HIRED,
  COMMON_STATUS_NAMES.REJECTED,
  COMMON_STATUS_NAMES.OFFER_ACCEPTED,
  COMMON_STATUS_NAMES.WITHDRAWN,
]);

const INTERVIEW_STATUSES = new Set<string>([
  COMMON_STATUS_NAMES.INTERVIEW_SCHEDULED,
  COMMON_STATUS_NAMES.INTERVIEWING,
]);

/**
 * Get status color by status name
 */
export function getStatusColor(statusName: string): string {
  return STATUS_COLORS[statusName as CommonStatusName] || 
         'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
}

/**
 * Get status badge variant for UI components
 */
export function getStatusBadgeVariant(statusName: string): "default" | "secondary" | "destructive" | "outline" {
  switch (statusName) {
    case COMMON_STATUS_NAMES.HIRED:
    case COMMON_STATUS_NAMES.OFFER_ACCEPTED:
      return 'default';
    case COMMON_STATUS_NAMES.INTERVIEW_SCHEDULED:
    case COMMON_STATUS_NAMES.INTERVIEWING:
    case COMMON_STATUS_NAMES.OFFER_EXTENDED:
      return 'secondary';
    case COMMON_STATUS_NAMES.REJECTED:
      return 'destructive';
    case COMMON_STATUS_NAMES.APPLIED:
    case COMMON_STATUS_NAMES.SCREENING:
    case COMMON_STATUS_NAMES.SHORTLISTED:
    case COMMON_STATUS_NAMES.ON_HOLD:
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Check if a status is considered "active" (not in backlog)
 */
export function isActiveStatus(statusName: string): boolean {
  return !BACKLOG_STATUSES.has(statusName);
}

/**
 * Check if a status is considered "interview stage"
 */
export function isInterviewStatus(statusName: string): boolean {
  return INTERVIEW_STATUSES.has(statusName);
}

/**
 * Get status display name from stage ID
 * This function helps with the migration by providing a fallback to the old status name
 */
export async function getStatusDisplayName(statusId: string): Promise<string> {
  try {
    const { getRecruitmentStageName } = await import('./recruitmentStageUtils');
    const stageName = await getRecruitmentStageName(statusId);
    return stageName || statusId;
  } catch (error) {
    console.error('Error getting status display name:', error);
    return statusId;
  }
}

/**
 * Get status color by stage ID
 * This function helps with the migration by mapping stage IDs to colors
 */
export async function getStatusColorByStageId(statusId: string): Promise<string> {
  try {
    const stageName = await getStatusDisplayName(statusId);
    return getStatusColor(stageName);
  } catch (error) {
    console.error('Error getting status color by stage ID:', error);
    return getStatusColor('Unknown');
  }
}

/**
 * Get status badge variant by stage ID
 */
export async function getStatusBadgeVariantByStageId(statusId: string): Promise<"default" | "secondary" | "destructive" | "outline"> {
  try {
    const stageName = await getStatusDisplayName(statusId);
    return getStatusBadgeVariant(stageName);
  } catch (error) {
    console.error('Error getting status badge variant by stage ID:', error);
    return 'outline';
  }
}
