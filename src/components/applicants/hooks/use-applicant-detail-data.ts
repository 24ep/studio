import type { ApplicantSource, Position, RecruitmentStage, TransitionRecord, UserProfile } from '@/lib/types';
import { getJsonArray, isJsonObject, readJsonOrFallback } from '@/lib/response-json';
import { normalizePositionList } from '../position-list-api';

async function fetchJsonOrEmpty<T>(
  url: string,
  emptyValue: T,
  errorLabel: string,
  options?: RequestInit
) {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error(`Authentication required to fetch ${errorLabel}`);
      } else {
        console.error(`Error fetching ${errorLabel}:`, response.status, response.statusText);
      }
      return emptyValue;
    }

    return await readJsonOrFallback<unknown>(response, emptyValue);
  } catch (error) {
    console.error(`Error fetching ${errorLabel}:`, error);
    return emptyValue;
  }
}

export async function fetchApplicantDetailPositions(): Promise<Position[]> {
  const data = await fetchJsonOrEmpty<unknown>(
    '/api/positions/all',
    {},
    'positions',
    { headers: { 'Cache-Control': 'no-cache' } }
  );
  return normalizePositionList(data);
}

export async function fetchApplicantDetailRecruiters(): Promise<UserProfile[]> {
  const data = await fetchJsonOrEmpty<unknown>(
    '/api/users?role=Recruiter',
    {},
    'recruiters',
    { headers: { 'Cache-Control': 'no-cache' } }
  );
  const users = isJsonObject(data) ? getJsonArray(data, 'users') ?? [] : [];
  return users.filter(isJsonObject).map((user) => user as unknown as UserProfile);
}

export async function fetchApplicantDetailSources(): Promise<ApplicantSource[]> {
  const data = await fetchJsonOrEmpty<unknown>(
    '/api/settings/applicant-sources',
    [],
    'sources',
    { headers: { 'Cache-Control': 'no-cache' } }
  );
  return Array.isArray(data) ? data as ApplicantSource[] : [];
}

export async function fetchApplicantDetailStages(): Promise<RecruitmentStage[]> {
  const data = await fetchJsonOrEmpty<unknown>(
    '/api/recruitment-stages',
    [],
    'stages',
    { headers: { 'Cache-Control': 'no-cache' } }
  );
  return Array.isArray(data) ? data as RecruitmentStage[] : [];
}

export async function fetchApplicantDetailTransitionHistory(applicantId: string): Promise<TransitionRecord[]> {
  const data = await fetchJsonOrEmpty<unknown>(
    `/api/transitions?applicantId=${applicantId}`,
    [],
    'transition history'
  );
  return Array.isArray(data) ? data as TransitionRecord[] : [];
}
