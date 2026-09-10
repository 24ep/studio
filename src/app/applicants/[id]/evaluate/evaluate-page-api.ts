import {
  buildEvaluateApplicantUrl,
  buildEvaluatePositionCriteriaUrl,
} from './evaluate-page-url-utils';
import { readJsonOrFallback } from '../../../../lib/response-json';
import type { EvaluationFormData, EvaluationPersonalityGroupConfig, EvaluationSummary, Interviewer } from './types';
import type { EvaluationCriteriaLike } from './evaluation-form-state-types';

type EvaluatePageFetcher = typeof fetch;

async function readJsonOrNull<T = unknown>(response: Response): Promise<T | null> {
  if (!response.ok) return null;
  return readJsonOrFallback<T | null>(response, null);
}

export class EvaluatePageAuthRedirectError extends Error {
  constructor() {
    super('Evaluate page requires authentication');
    this.name = 'EvaluatePageAuthRedirectError';
  }
}

function isAuthFailure(response: Response) {
  return response.status === 401 || response.status === 403;
}

export async function fetchEvaluateApplicantAndCriteria(
  applicantId: string,
  token?: string | null,
  fetcher: EvaluatePageFetcher = fetch
) {
  const applicantResponse = await fetcher(buildEvaluateApplicantUrl(applicantId, token));
  if (!applicantResponse.ok) {
    if (isAuthFailure(applicantResponse)) {
      throw new EvaluatePageAuthRedirectError();
    }
    throw new Error('Applicant not found');
  }

  const applicant = await readJsonOrFallback<EvaluationFormData['applicant'] | null>(applicantResponse, null);
  if (!applicant) {
    throw new Error('Applicant not found');
  }

  const applicantPositionId = applicant.positionId;
  if (typeof applicantPositionId !== 'string' || !applicantPositionId) {
    throw new Error('Applicant has no assigned position');
  }

  const evaluationResponse = await fetcher(buildEvaluatePositionCriteriaUrl(applicantPositionId, token));
  if (!evaluationResponse.ok) {
    if (isAuthFailure(evaluationResponse)) {
      throw new EvaluatePageAuthRedirectError();
    }
    throw new Error('Failed to fetch evaluation criteria');
  }

  return {
    applicant,
    applicantPositionId,
    positionTitle: applicant.position?.title || null,
    evaluationCriteria: await readJsonOrFallback<EvaluationCriteriaLike>(evaluationResponse, {}),
  };
}

export async function fetchExistingApplicantEvaluationData(
  applicantId: string,
  fetcher: EvaluatePageFetcher = fetch
): Promise<EvaluationSummary[] | EvaluationSummary | null> {
  const allEvaluationsResponse = await fetcher(`/api/v1/applicants/${applicantId}/evaluations`);
  const allEvaluations = await readJsonOrNull<EvaluationSummary[]>(allEvaluationsResponse);
  if (allEvaluations !== null) {
    return allEvaluations;
  }

  const singleEvaluationResponse = await fetcher(`/api/v1/applicants/${applicantId}/evaluation`);
  return readJsonOrNull<EvaluationSummary>(singleEvaluationResponse);
}

export async function fetchEvaluatePersonalityGroupsConfig(
  fetcher: EvaluatePageFetcher = fetch
): Promise<EvaluationPersonalityGroupConfig[]> {
  const response = await fetcher('/api/evaluation/personality-traits');
  const data = await readJsonOrNull<{ groups?: EvaluationPersonalityGroupConfig[] }>(response);
  return Array.isArray(data?.groups) ? data.groups as EvaluationPersonalityGroupConfig[] : [];
}

export async function fetchEvaluatePositionInterviewers(
  positionId: string,
  fetcher: EvaluatePageFetcher = fetch
): Promise<Interviewer[]> {
  const response = await fetcher(`/api/positions/${positionId}/interviewers`, { credentials: 'include' });
  if (!response.ok) return [];

  const data = await readJsonOrFallback<Interviewer[] | unknown>(response, []);
  return Array.isArray(data) ? data : [];
}
