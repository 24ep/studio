import type { ApplicantSource, Position, RecruitmentStage, UserProfile } from '@/lib/types';
import { readJsonOrFallback } from '../../../../lib/response-json';

type EvaluatePageFetch = (input: string, init?: RequestInit) => Promise<Pick<Response, 'ok' | 'json'>>;

export interface EvaluatePageJobAppliedOptions {
  positions: Position[];
  stages: RecruitmentStage[];
  recruiters: Pick<UserProfile, 'id' | 'name'>[];
  sources: ApplicantSource[];
}

export function normalizeEvaluatePageRecruiterOptions(data: unknown): Pick<UserProfile, 'id' | 'name'>[] {
  return getArrayPayload<Partial<UserProfile>>(data)
    .filter((recruiter): recruiter is Partial<UserProfile> & { id: string } => typeof recruiter.id === 'string')
    .map((recruiter) => ({
      id: recruiter.id,
      name: recruiter.name || recruiter.email || recruiter.id,
    }));
}

export async function fetchEvaluatePageJobAppliedOptions(
  fetcher: EvaluatePageFetch = fetch,
): Promise<EvaluatePageJobAppliedOptions> {
  const [
    positions,
    stages,
    recruiterResponse,
    sources,
  ] = await Promise.all([
    fetchArrayPayload<Position>(fetcher, '/api/positions'),
    fetchArrayPayload<RecruitmentStage>(fetcher, '/api/settings/recruitment-stages'),
    fetchArrayPayload<Partial<UserProfile>>(fetcher, '/api/users'),
    fetchArrayPayload<ApplicantSource>(fetcher, '/api/settings/applicant-sources'),
  ]);

  return {
    positions,
    stages,
    recruiters: normalizeEvaluatePageRecruiterOptions(recruiterResponse),
    sources,
  };
}

function getArrayPayload<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === 'object' &&
    'data' in data &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: T[] }).data;
  }

  return [];
}

async function fetchArrayPayload<T>(fetcher: EvaluatePageFetch, url: string): Promise<T[]> {
  try {
    const response = await fetcher(url, { credentials: 'include' });
    if (!response.ok) {
      return [];
    }

    return getArrayPayload<T>(await readJsonOrFallback<unknown>(response, []));
  } catch {
    return [];
  }
}
