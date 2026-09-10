import {
  getJsonArray,
  getJsonString,
  isJsonObject,
  readJsonObject,
  readJsonOrFallback,
} from '../../lib/response-json';
import type {
  BoardApplicant,
  BoardPosition,
  BoardRecruiter,
  BoardStage,
  UserPreference,
} from './customize-board-utils';

export interface CustomizeBoardReferenceData {
  applicants: BoardApplicant[];
  positions: BoardPosition[];
  recruiters: BoardRecruiter[];
  stages: BoardStage[];
}

function normalizeRecruiters(data: Awaited<ReturnType<typeof readJsonObject>>): BoardRecruiter[] {
  return (getJsonArray(data, 'users') ?? []).flatMap((user) => {
    if (!isJsonObject(user)) return [];

    const id = getJsonString(user, 'id');
    if (!id) return [];

    return [{ id, name: getJsonString(user, 'name') }];
  });
}

function normalizePositions(data: Awaited<ReturnType<typeof readJsonObject>>): BoardPosition[] {
  return (getJsonArray(data, 'data') ?? []).flatMap((position) => {
    if (!isJsonObject(position)) return [];

    const id = getJsonString(position, 'id');
    if (!id) return [];

    return [{ id, title: getJsonString(position, 'title') }];
  });
}

function normalizeStages(data: unknown): BoardStage[] {
  return (Array.isArray(data) ? data : []).flatMap((stage) => {
    if (!isJsonObject(stage)) return [];

    const id = getJsonString(stage, 'id');
    const name = getJsonString(stage, 'name');
    return id && name ? [{ id, name }] : [];
  });
}

function normalizeApplicants(data: unknown): BoardApplicant[] {
  const items = Array.isArray(data)
    ? data
    : isJsonObject(data)
      ? getJsonArray(data, 'data') ?? []
      : [];

  return items.filter(isJsonObject) as BoardApplicant[];
}

export async function fetchCustomizeBoardReferenceData(): Promise<CustomizeBoardReferenceData> {
  const [recruitersRes, positionsRes, stagesRes, applicantsRes] = await Promise.all([
    fetch('/api/users?role=Recruiter'),
    fetch('/api/positions/all'),
    fetch('/api/recruitment-stages'),
    fetch('/api/applicants?limit=1000'),
  ]);

  if (!recruitersRes.ok) throw new Error('Failed to fetch recruiters');
  if (!positionsRes.ok) throw new Error('Failed to fetch positions');
  if (!stagesRes.ok) throw new Error('Failed to fetch stages');
  if (!applicantsRes.ok) throw new Error('Failed to fetch Applicants');

  const [recruiters, positions, stages, applicants] = await Promise.all([
    readJsonObject(recruitersRes).then(normalizeRecruiters),
    readJsonObject(positionsRes).then(normalizePositions),
    readJsonOrFallback<unknown>(stagesRes, []).then(normalizeStages),
    readJsonOrFallback<unknown>(applicantsRes, []).then(normalizeApplicants),
  ]);

  return { applicants, positions, recruiters, stages };
}

export async function fetchCustomizeBoardPreferences(): Promise<UserPreference[]> {
  const response = await fetch('/api/settings/user-preferences', {
    credentials: 'include',
  });

  if (!response.ok) {
    return [];
  }

  return readJsonOrFallback<UserPreference[]>(response, []);
}
