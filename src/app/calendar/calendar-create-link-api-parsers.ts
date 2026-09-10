import { readJsonObject, readJsonOrFallback } from '../../lib/response-json';
import {
  hasEvaluationCriteriaSkills,
  normalizeInterviewers,
  normalizeSearchApplicants,
  type CalendarInterviewer,
  type SearchApplicant,
} from './calendar-page-utils';

export interface CalendarEvaluationLinkResponse {
  url?: unknown;
  expiresAt?: unknown;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export async function readSearchApplicantsResponse(response: Response): Promise<SearchApplicant[]> {
  if (!response.ok) {
    return [];
  }

  return normalizeSearchApplicants(await readJsonOrFallback<unknown>(response, {}));
}

export async function readCalendarInterviewersResponse(
  response: Response
): Promise<CalendarInterviewer[]> {
  if (!response.ok) {
    return [];
  }

  const interviewers = await readJsonOrFallback<unknown>(response, []);
  return Array.isArray(interviewers) ? normalizeInterviewers(interviewers) : [];
}

export async function readCalendarEvaluationHasSkills(response: Response): Promise<boolean> {
  if (!response.ok) {
    return false;
  }

  return hasEvaluationCriteriaSkills(await readJsonOrFallback<unknown>(response, {}));
}

export async function readCalendarEvaluationLinkResponse(
  response: Response
): Promise<CalendarEvaluationLinkResponse> {
  const data = await readJsonObject(response);
  return isRecord(data) ? data : {};
}
