import {
  getJsonArray,
  getJsonNumber,
  getJsonString,
  isJsonObject,
  readJsonOrFallback,
} from '../../../lib/response-json';
import type { UserGroup } from '../../../lib/types';

export type UnifiedUserTeamOption = { id: string; name: string; color?: string };

export function normalizeUnifiedUserGroups(value: unknown): UserGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((group) => {
    if (!isJsonObject(group)) {
      return [];
    }

    const id = getJsonString(group, 'id');
    const name = getJsonString(group, 'name');
    if (!id || !name) {
      return [];
    }

    return [{
      id,
      name,
      description: getJsonString(group, 'description') ?? null,
      permissions: getJsonArray(group, 'permissions')?.filter((permission): permission is string => (
        typeof permission === 'string'
      )),
      isDefault: getJsonBoolean(group, 'isDefault'),
      isSystemRole: getJsonBoolean(group, 'isSystemRole'),
      user_count: getJsonNumber(group, 'user_count'),
      createdAt: getJsonString(group, 'createdAt'),
      updatedAt: getJsonString(group, 'updatedAt'),
    }];
  });
}

export function normalizeUnifiedUserTeams(value: unknown): UnifiedUserTeamOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((team) => {
    if (!isJsonObject(team)) {
      return [];
    }

    const id = getJsonString(team, 'id');
    const name = getJsonString(team, 'name');
    return id && name
      ? [{ id, name, color: getJsonString(team, 'color') }]
      : [];
  });
}

export function normalizeUnifiedUserCustomFieldDefinitions(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export async function loadUnifiedUserGroups(): Promise<UserGroup[]> {
  const response = await fetch('/api/settings/user-groups');
  if (!response.ok) {
    return [];
  }

  return normalizeUnifiedUserGroups(await readJsonOrFallback<unknown>(response, []));
}

export async function loadUnifiedUserTeams(): Promise<UnifiedUserTeamOption[]> {
  const response = await fetch('/api/settings/user-teams');
  if (!response.ok) {
    throw new Error('Failed to fetch user teams');
  }

  return normalizeUnifiedUserTeams(await readJsonOrFallback<unknown>(response, []));
}

export async function loadUnifiedUserCustomFieldDefinitions(): Promise<unknown[]> {
  const response = await fetch('/api/settings/custom-fields?model=User&section=personal');
  if (!response.ok) {
    return [];
  }

  return normalizeUnifiedUserCustomFieldDefinitions(await readJsonOrFallback<unknown>(response, []));
}

function getJsonBoolean(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === 'boolean' ? field : undefined;
}
