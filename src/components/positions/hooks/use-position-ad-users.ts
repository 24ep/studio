import { useCallback, useEffect, useState } from 'react';
import { getJsonArray, getJsonString, isJsonObject, readJsonObject } from '../../../lib/response-json';
import type { AzureAdPositionUser } from '../PositionMicrosoftAdTab';

interface UsePositionAdUsersInput {
  enabled: boolean;
  positionId?: string | null;
}

function normalizeAzureAdPositionUsers(value: unknown): AzureAdPositionUser[] {
  const users = Array.isArray(value) ? value : [];

  return users.flatMap((user) => {
    if (!isJsonObject(user)) return [];

    const id = getJsonString(user, 'id');
    if (!id) return [];

    return [{
      id,
      displayName: getJsonString(user, 'displayName') ?? null,
      jobTitle: getJsonString(user, 'jobTitle') ?? null,
      department: getJsonString(user, 'department') ?? null,
      mail: getJsonString(user, 'mail') ?? null,
    }];
  });
}

export function usePositionAdUsers({ enabled, positionId }: UsePositionAdUsersInput) {
  const [users, setUsers] = useState<AzureAdPositionUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdUsers = useCallback(async () => {
    if (!positionId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/positions/${encodeURIComponent(positionId)}/employees`);

      if (!response.ok) {
        const responseBody = await readJsonObject(response);
        throw new Error(
          getJsonString(responseBody, 'error')
            ?? getJsonString(responseBody, 'message')
            ?? 'Failed to fetch existing employees'
        );
      }

      const data = await readJsonObject(response);
      const errorMessage = getJsonString(data, 'error');

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      setUsers(normalizeAzureAdPositionUsers(getJsonArray(data, 'employees')));
    } catch (requestError) {
      console.error('Error fetching existing employees:', requestError);
      setError(requestError instanceof Error ? requestError.message : 'Failed to fetch existing employees');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [positionId]);

  useEffect(() => {
    if (enabled && positionId) {
      fetchAdUsers();
    }
  }, [enabled, positionId, fetchAdUsers]);

  return {
    adUsers: users,
    adUsersError: error,
    fetchAdUsers,
    isLoadingAdUsers: isLoading,
  };
}
