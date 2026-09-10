import type {
  ApplicantActivityLogItem,
  ApplicantCommentItem,
  ApplicantReminderItem,
} from './applicant-comments-utils';

export interface ApplicantCommentsPage {
  comments: ApplicantCommentItem[];
  hasMore: boolean;
  totalComments: number;
  totalRemarks: number;
}

export interface ApplicantActivitiesPage {
  logs: ApplicantActivityLogItem[];
  hasMore: boolean;
  total: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getPayloadData(value: unknown): unknown[] {
  return isRecord(value) && Array.isArray(value.data) ? value.data : [];
}

function getPayloadPagination(value: unknown): Record<string, unknown> {
  return isRecord(value) && isRecord(value.pagination) ? value.pagination : {};
}

function getBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : false;
}

function getNumber(value: unknown) {
  return typeof value === 'number' ? value : 0;
}

function normalizeCommentItems(value: unknown): ApplicantCommentItem[] {
  return getPayloadData(value).filter(isRecord);
}

function normalizeActivityLogItems(value: unknown): ApplicantActivityLogItem[] {
  return getPayloadData(value).filter(isRecord);
}

export function normalizeReminderItems(value: unknown): ApplicantReminderItem[] {
  return getPayloadData(value).filter(isRecord);
}

export function normalizeApplicantCommentsPage(value: unknown): ApplicantCommentsPage {
  const pagination = getPayloadPagination(value);
  return {
    comments: normalizeCommentItems(value),
    hasMore: getBoolean(pagination.hasMore),
    totalComments: getNumber(pagination.totalComments),
    totalRemarks: getNumber(pagination.totalRemarks),
  };
}

export function normalizeApplicantActivitiesPage(value: unknown): ApplicantActivitiesPage {
  const pagination = getPayloadPagination(value);
  return {
    logs: normalizeActivityLogItems(value),
    hasMore: getBoolean(pagination.hasMore),
    total: getNumber(pagination.total),
  };
}

export function getApplicantCommentMutationErrorMessage(status: number, responseText: string) {
  const errorMessage = `Failed to add comment: ${status}`;

  try {
    const errorJson = JSON.parse(responseText);
    if (isRecord(errorJson)) {
      const message = typeof errorJson.message === 'string' ? errorJson.message : null;
      const error = typeof errorJson.error === 'string' ? errorJson.error : null;
      return message || error || errorMessage;
    }
    return errorMessage;
  } catch {
    return responseText || errorMessage;
  }
}
