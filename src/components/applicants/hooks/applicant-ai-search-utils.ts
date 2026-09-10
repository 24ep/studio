import type { Applicant } from '@/lib/types';
import { readJsonOrFallback } from '../../../lib/response-json';

export interface NormalizedApplicantAiSearchResult {
  matchedApplicantIds: string[];
  aiReasoning: string;
  recordCount: number;
}

const DEFAULT_AI_SEARCH_REASONING = 'AI search complete.';

export function getTrimmedApplicantAiSearchQuery(query: string) {
  return query.trim();
}

export function normalizeApplicantAiSearchResult(payload: unknown): NormalizedApplicantAiSearchResult {
  const data = asRecord(payload);
  const matchedApplicantIds = Array.isArray(data?.matchedApplicantIds)
    ? data.matchedApplicantIds.filter((id): id is string => typeof id === 'string')
    : [];
  const aiReasoning = typeof data?.aiReasoning === 'string'
    ? data.aiReasoning
    : DEFAULT_AI_SEARCH_REASONING;
  const recordCount = typeof data?.recordCount === 'number' && Number.isFinite(data.recordCount)
    ? data.recordCount
    : 0;

  return {
    matchedApplicantIds,
    aiReasoning,
    recordCount,
  };
}

export function getApplicantAiSearchErrorMessage(status: number, payload: unknown) {
  const data = asRecord(payload);

  if (status === 403) {
    return getStringValue(data?.message) || 'You do not have permission to use AI search.';
  }

  if (status === 503) {
    return getStringValue(data?.message) || 'AI search is temporarily unavailable. Please check your AI provider configuration.';
  }

  return getStringValue(data?.message)
    || getStringValue(data?.error)
    || getDetailsMessage(data?.details)
    || `AI search failed with status: ${status}`;
}

export function getMissingAiMatchedApplicantIds(
  applicants: Pick<Applicant, 'id'>[],
  matchedApplicantIds: string[]
) {
  const existingIds = new Set(applicants.map((applicant) => applicant.id));
  return matchedApplicantIds.filter((id) => !existingIds.has(id));
}

export function mergeUniqueApplicants<TApplicant extends Pick<Applicant, 'id'>>(
  currentApplicants: TApplicant[],
  incomingApplicants: TApplicant[]
) {
  const existingIds = new Set(currentApplicants.map((applicant) => applicant.id));
  const newApplicants = incomingApplicants.filter((applicant) => !existingIds.has(applicant.id));
  return [...currentApplicants, ...newApplicants];
}

export function getApplicantDataListFromPayload(payload: unknown): Applicant[] | null {
  const data = asRecord(payload);

  if (!Array.isArray(data?.data)) {
    return null;
  }

  return data.data.filter(isApplicantLike);
}

export function getApplicantAiSearchSuccessCount(result: NormalizedApplicantAiSearchResult) {
  return result.recordCount || result.matchedApplicantIds.length;
}

export function getApplicantAiSearchSuccessMessage(result: NormalizedApplicantAiSearchResult) {
  return `Found ${getApplicantAiSearchSuccessCount(result)} potential match(es).`;
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'AI search failed.';
}

export async function readApplicantAiSearchResponseJson(response: Response) {
  const payload = await readJsonOrFallback<unknown>(response.clone(), undefined);
  if (payload !== undefined) {
    return payload;
  }

  const text = await response.text().catch(() => 'Unable to read response');
  throw new Error(`AI search failed with status: ${response.status}. Response: ${text.substring(0, 200)}`);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
}

function getStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getDetailsMessage(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (value === undefined || value === null) {
    return null;
  }

  return JSON.stringify(value);
}

function isApplicantLike(value: unknown): value is Applicant {
  const data = asRecord(value);
  return typeof data?.id === 'string';
}
