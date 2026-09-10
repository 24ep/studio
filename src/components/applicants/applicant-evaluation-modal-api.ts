import { readJsonOrFallback } from '../../lib/response-json';

import { hasEvaluationSkills } from './create-evaluate-link-utils';
import {
  normalizeAttachments,
  normalizeEvaluationData,
  normalizeEvaluationList,
} from './applicant-evaluation-modal-normalizers';
import {
  normalizeApplicantEvaluationLinkState,
  summarizeApplicantEvaluations,
  summarizeSingleApplicantEvaluation,
} from './applicant-evaluation-modal-summary';
import type {
  ApplicantEvaluationFetcher,
  ApplicantEvaluationLinkState,
  ApplicantEvaluationPositionValidation,
} from './applicant-evaluation-modal-types';

export type {
  ApplicantEvaluationAttachment,
  ApplicantEvaluationData,
  ApplicantEvaluationFetcher,
  ApplicantEvaluationGroup,
  ApplicantEvaluationLinkInfo,
  ApplicantEvaluationLinkState,
  ApplicantEvaluationPositionValidation,
  ApplicantEvaluationTrait,
  ApplicantPersonalityScore,
  AveragedApplicantEvaluationData,
} from './applicant-evaluation-modal-types';
export {
  formatPersonalityScore,
  getDaysUntil,
  normalizeApplicantEvaluationLinkState,
  summarizeApplicantEvaluations,
  summarizeSingleApplicantEvaluation,
} from './applicant-evaluation-modal-summary';

export async function fetchApplicantEvaluationPositionValidation(
  positionId: string,
  fetcher: ApplicantEvaluationFetcher = fetch
): Promise<ApplicantEvaluationPositionValidation> {
  const [interviewersResponse, evaluationResponse] = await Promise.all([
    fetcher(`/api/positions/${positionId}/interviewers`, { credentials: 'include' }),
    fetcher(`/api/v1/positions/${positionId}/evaluation`, { credentials: 'include' }),
  ]);

  const interviewers = interviewersResponse.ok
    ? await readJsonOrFallback<unknown>(interviewersResponse, {})
    : [];
  const criteria = evaluationResponse.ok
    ? await readJsonOrFallback<unknown>(evaluationResponse, {})
    : {};

  return {
    hasInterviewers: Array.isArray(interviewers) && interviewers.length > 0,
    hasSkills: hasEvaluationSkills(criteria),
  };
}

export async function fetchApplicantEvaluationSummary(
  applicantId: string,
  fetcher: ApplicantEvaluationFetcher = fetch
) {
  const response = await fetcher(`/api/v1/applicants/${applicantId}/evaluations`);
  if (response.ok) {
    return summarizeApplicantEvaluations(
      normalizeEvaluationList(await readJsonOrFallback<unknown>(response, []))
    );
  }

  const fallbackResponse = await fetcher(`/api/v1/applicants/${applicantId}/evaluation`);
  if (!fallbackResponse.ok) {
    return { evaluationData: null, averagedEvaluationData: null };
  }

  return summarizeSingleApplicantEvaluation(
    normalizeEvaluationData(await readJsonOrFallback<unknown>(fallbackResponse, null))
  );
}

export async function fetchApplicantEvaluationAttachments(
  applicantId: string,
  fetcher: ApplicantEvaluationFetcher = fetch
) {
  const response = await fetcher(
    `/api/applicants/${applicantId}/resumes?limit=50&offset=0`,
    { credentials: 'include' }
  );
  if (!response.ok) return [];

  return normalizeAttachments(await readJsonOrFallback<unknown>(response, {}));
}

export async function fetchApplicantEvaluationLink(
  applicantId: string,
  fetcher: ApplicantEvaluationFetcher = fetch
): Promise<ApplicantEvaluationLinkState | null> {
  const response = await fetcher(
    `/api/v1/applicants/${applicantId}/evaluation-link`,
    { credentials: 'include' }
  );
  if (!response.ok) return null;

  return normalizeApplicantEvaluationLinkState(
    await readJsonOrFallback<unknown>(response, {})
  );
}

export async function createOrGetApplicantEvaluationLink({
  applicantId,
  expireDays,
  requireLogin,
  force,
  fetcher = fetch,
}: {
  applicantId: string;
  expireDays: number;
  requireLogin: boolean;
  force: boolean;
  fetcher?: ApplicantEvaluationFetcher;
}): Promise<ApplicantEvaluationLinkState> {
  const response = await fetcher(`/api/v1/applicants/${applicantId}/evaluation-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ days: expireDays, force, requireLogin }),
  });

  if (!response.ok) {
    throw new Error('Failed to create link');
  }

  return normalizeApplicantEvaluationLinkState(
    await readJsonOrFallback<unknown>(response, {})
  );
}

export async function removeApplicantEvaluationLink(
  applicantId: string,
  fetcher: ApplicantEvaluationFetcher = fetch
) {
  const response = await fetcher(`/api/v1/applicants/${applicantId}/evaluation-link`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to remove link');
  }
}
