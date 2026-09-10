import type { UserTeam } from '@/lib/types';
import {
  getJsonArray,
  getJsonErrorMessage,
  getJsonString,
  isJsonObject,
  readJsonObject,
  readJsonOrFallback,
} from '../../lib/response-json';
import { buildAvailableTeamUsersUrl, getTeamSaveRequest } from './user-teams-utils';
import type { AvailableUser, TeamFormValues, TeamMember } from './UserTeamsParts';

type TeamUserRow = TeamMember | AvailableUser;

function normalizeTeamUserRows(data: Awaited<ReturnType<typeof readJsonObject>>): TeamUserRow[] {
  return (getJsonArray(data, 'users') ?? []).flatMap((user) => {
    if (!isJsonObject(user)) {
      return [];
    }

    const id = getJsonString(user, 'id');
    const name = getJsonString(user, 'name');
    const email = getJsonString(user, 'email');
    if (!id || !name || !email) {
      return [];
    }

    return [{
      id,
      name,
      email,
      role: getJsonString(user, 'role') ?? '',
      createdAt: getJsonString(user, 'createdAt') ?? '',
    }];
  });
}

export async function fetchTeamMembers(teamId: string) {
  const response = await fetch(`/api/settings/user-teams/${teamId}/members`);
  if (!response.ok) {
    throw new Error('Failed to load team members');
  }

  return normalizeTeamUserRows(await readJsonObject(response)) as TeamMember[];
}

export async function fetchAvailableTeamUsers({
  origin,
  searchTerm,
  teamId,
}: {
  origin: string;
  searchTerm: string;
  teamId: string;
}) {
  const response = await fetch(buildAvailableTeamUsersUrl({ teamId, searchTerm, origin }));
  if (!response.ok) {
    throw new Error('Failed to load users');
  }

  return normalizeTeamUserRows(await readJsonObject(response)) as AvailableUser[];
}

export async function saveUserTeam({
  data,
  editingTeam,
  selectedTeam,
}: {
  data: TeamFormValues;
  editingTeam: UserTeam | null;
  selectedTeam: UserTeam | null;
}) {
  const { isEditing, url, method } = getTeamSaveRequest({ editingTeam, selectedTeam });
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await readJsonObject(response);

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(result, `Failed to ${isEditing ? 'update' : 'create'} team`));
  }

  return {
    isEditing,
    result: {
      message: getJsonString(result, 'message'),
      name: getJsonString(result, 'name'),
    },
  };
}

export async function deleteUserTeam(team: UserTeam) {
  const response = await fetch(`/api/settings/user-teams/${team.id}`, { method: 'DELETE' });
  if (!response.ok) {
    const errorData = await readJsonOrFallback<{ message?: string }>(response, { message: 'Failed to delete team' });
    throw new Error(errorData.message);
  }
}

export async function addUserToTeam(teamId: string, userId: string) {
  const response = await fetch(`/api/settings/user-teams/${teamId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to add user to team');
  }
}

export async function removeUserFromTeam(teamId: string, userId: string) {
  const response = await fetch(`/api/settings/user-teams/${teamId}/members?userId=${userId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to remove user from team');
  }
}
