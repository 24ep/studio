import { getJsonErrorMessage, readJsonObject } from '../../lib/response-json';
import {
  type CalendarInterviewer,
  type PositionValidation,
  type SearchApplicant,
} from './calendar-page-utils';
import {
  readCalendarEvaluationHasSkills,
  readCalendarEvaluationLinkResponse,
  readCalendarInterviewersResponse,
  readSearchApplicantsResponse,
  type CalendarEvaluationLinkResponse,
} from './calendar-create-link-api-parsers';

type CalendarFetch = typeof fetch;

export interface CalendarPositionValidationResult {
  availableInterviewers: CalendarInterviewer[];
  positionValidation: PositionValidation;
}

export async function searchCalendarApplicants(
  query: string,
  fetcher: CalendarFetch = fetch
): Promise<SearchApplicant[]> {
  if (!query.trim()) {
    return [];
  }

  const searchParam = encodeURIComponent(query);
  const response = await fetcher(`/api/applicants?name=${searchParam}&nameOperator=contains&limit=20`, {
    credentials: 'include',
  });

  return readSearchApplicantsResponse(response);
}

export async function fetchCalendarPositionValidation(
  positionId: string,
  positionTitle: string | null,
  fetcher: CalendarFetch = fetch
): Promise<CalendarPositionValidationResult> {
  const [interviewersRes, evaluationRes] = await Promise.all([
    fetcher(`/api/positions/${positionId}/interviewers`, { credentials: 'include' }),
    fetcher(`/api/v1/positions/${positionId}/evaluation`, { credentials: 'include' }),
  ]);

  const [availableInterviewers, hasSkills] = await Promise.all([
    readCalendarInterviewersResponse(interviewersRes),
    readCalendarEvaluationHasSkills(evaluationRes),
  ]);

  return {
    availableInterviewers,
    positionValidation: {
      hasInterviewers: availableInterviewers.length > 0,
      hasSkills,
      positionId,
      positionTitle,
      isLoading: false,
      error: null,
    },
  };
}

export async function createCalendarEvaluationLink(
  applicantId: string,
  payload: { days: number; requireLogin: boolean },
  fetcher: CalendarFetch = fetch
): Promise<CalendarEvaluationLinkResponse> {
  const response = await fetcher(`/api/v1/applicants/${applicantId}/evaluation-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await readJsonObject(response);
    throw new Error(getJsonErrorMessage(errorData, 'Failed to create evaluation link'));
  }

  return readCalendarEvaluationLinkResponse(response);
}
