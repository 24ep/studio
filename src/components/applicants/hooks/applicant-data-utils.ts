import type { Applicant, ApplicantSource, Position, RecruitmentStage, UserProfile } from '@/lib/types';
import { normalizeFitScore } from '../../../lib/scoreUtils';
import { safeFetch, type SafeFetchResult } from '../../../lib/safe-fetch';

type ApplicantDataSafeFetch = <T = unknown>(
  input: RequestInfo | URL,
  options?: { timeoutMs?: number } & RequestInit,
) => Promise<SafeFetchResult<T>>;

export type RecruiterOption = Pick<UserProfile, 'id' | 'name' | 'email' | 'avatarUrl'>;

export function asArrayData<T>(data: T[] | { [key: string]: T[] | undefined } | null, key: string): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  const nested = data?.[key];
  return Array.isArray(nested) ? nested : [];
}

function getFitScoreValue(value: unknown): number {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return 0;
  }

  const fitScore = (value as { fitScore?: unknown }).fitScore;
  return typeof fitScore === 'number' ? fitScore : 0;
}

export function getBestMatchingFitScore(applicant: Applicant): number {
  if (applicant.jobMatches && Array.isArray(applicant.jobMatches)) {
    const maxMatchScore = Math.max(...applicant.jobMatches.map(match => match.fitScore || 0));
    if (maxMatchScore >= 0) return normalizeFitScore(maxMatchScore);
  }

  if (applicant.parsedData && typeof applicant.parsedData === 'object') {
    const parsed = applicant.parsedData as Record<string, unknown>;
    if (Array.isArray(parsed.job_matches)) {
      const maxMatchScore = Math.max(...parsed.job_matches.map(getFitScoreValue));
      if (maxMatchScore >= 0) return normalizeFitScore(maxMatchScore);
    }
  }

  return 0;
}

export async function fetchApplicantDataForCounts(
  safeFetcher: ApplicantDataSafeFetch = safeFetch,
): Promise<Applicant[] | null> {
  const result = await safeFetcher<{ applicants: Applicant[] }>(
    '/api/applicants?limit=10000&includeCounts=true',
    { timeoutMs: 10000 },
  );

  return result.ok && result.data ? result.data.applicants || [] : null;
}

export async function fetchApplicantSources(
  safeFetcher: ApplicantDataSafeFetch = safeFetch,
): Promise<ApplicantSource[]> {
  const result = await safeFetcher<ApplicantSource[] | { sources: ApplicantSource[] }>(
    '/api/settings/applicant-sources',
    { timeoutMs: 8000 },
  );

  return result.ok && result.data ? asArrayData<ApplicantSource>(result.data, 'sources') : [];
}

export async function fetchApplicantRecruiters(
  safeFetcher: ApplicantDataSafeFetch = safeFetch,
): Promise<RecruiterOption[]> {
  const result = await safeFetcher<{ users: Array<{ id: string; name: string; email: string; avatarUrl?: string }> }>(
    '/api/users?role=Recruiter',
    { timeoutMs: 8000 },
  );

  if (!result.ok || !result.data) {
    return [];
  }

  return (result.data.users || []).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }));
}

export async function fetchApplicantPositionsAndStages(
  safeFetcher: ApplicantDataSafeFetch = safeFetch,
) {
  const positionsResult = await safeFetcher<Position[] | { positions: Position[] }>(
    '/api/positions',
    { timeoutMs: 8000 },
  );
  const stagesResult = await safeFetcher<RecruitmentStage[] | { stages: RecruitmentStage[] }>(
    '/api/recruitment-stages',
    { timeoutMs: 8000 },
  );

  return {
    positions: positionsResult.ok && positionsResult.data
      ? asArrayData<Position>(positionsResult.data, 'positions')
      : [],
    stages: stagesResult.ok && stagesResult.data
      ? asArrayData<RecruitmentStage>(stagesResult.data, 'stages')
      : [],
  };
}

export async function fetchApplicantById(
  applicantId: string,
  safeFetcher: ApplicantDataSafeFetch = safeFetch,
): Promise<Applicant | null> {
  const result = await safeFetcher<Applicant>(`/api/applicants/${applicantId}`, { timeoutMs: 8000 });
  return result.ok ? result.data : null;
}
