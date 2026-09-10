import { readJsonOrFallback } from '../../lib/response-json';
import {
  normalizeApplicantAttachments,
  type ApplicantAttachment,
} from './applicant-attachment-utils';
import type { ApplicantCommentItem } from './applicant-comments-utils';

export type MobileApplicantReference = {
  id: string;
  name: string;
};

export type MobileApplicantComment = ApplicantCommentItem;
export type MobileApplicantAttachment = ApplicantAttachment;

async function parseResponseData<T = unknown>(response: Response): Promise<T | null> {
  if (!response.ok) return null;
  return readJsonOrFallback<T | null>(response, null);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeListResponse(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (isRecord(value) && Array.isArray(value.data)) {
    return value.data;
  }

  return [];
}

function hasStringId(value: unknown): value is Record<string, unknown> & { id: string } {
  return isRecord(value) && typeof value.id === 'string';
}

function getRecordString(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === 'string' ? field : undefined;
}

export function normalizeRecruiters(value: unknown): MobileApplicantReference[] {
  return normalizeListResponse(value)
    .filter(hasStringId)
    .map((recruiter) => ({
      id: recruiter.id,
      name: getRecordString(recruiter, 'name') ?? getRecordString(recruiter, 'email') ?? 'Unknown',
    }));
}

export function normalizeSources(value: unknown): MobileApplicantReference[] {
  return normalizeListResponse(value)
    .filter(hasStringId)
    .map((source) => ({
      id: source.id,
      name: getRecordString(source, 'name') ?? 'Unknown',
    }));
}

export function normalizeRecords<T>(value: unknown): T[] {
  return normalizeListResponse(value).filter(isRecord) as T[];
}

export function normalizeMobileApplicantAttachments(value: unknown): MobileApplicantAttachment[] {
  return normalizeApplicantAttachments(value);
}

export async function parseSettledResponse<T = unknown>(
  result: PromiseSettledResult<Response>,
): Promise<T | null> {
  if (result.status !== 'fulfilled') return null;
  return parseResponseData<T>(result.value);
}
