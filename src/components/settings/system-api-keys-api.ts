import { getJsonArray, getJsonErrorMessage, getJsonObject, isJsonObject, readJsonObject } from '../../lib/response-json';
import type { SystemApiKey } from './system-api-keys-utils';

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data = await readJsonObject(response);

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(data, fallbackMessage));
  }

  return data as T;
}

export async function fetchSystemApiKeys() {
  const response = await fetch('/api/settings/system-api-keys');
  if (!response.ok) {
    throw new Error('Failed to fetch API keys');
  }

  const data = await readJsonObject(response);
  const payload = getJsonObject(data, 'data');
  if (data.success !== true || !payload) {
    return [];
  }

  return (getJsonArray(payload, 'apiKeys') ?? [])
    .filter(isJsonObject)
    .map((apiKey) => apiKey as unknown as SystemApiKey);
}

export async function createSystemApiKey(payload: {
  name: string;
  description: string | null;
  expiresAt: string | null;
}) {
  const response = await fetch('/api/settings/system-api-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<{ apiKey: string }>(response, 'Failed to create API key');
}

export async function updateSystemApiKeyActiveState(apiKeyId: string, isActive: boolean) {
  const response = await fetch(`/api/settings/system-api-keys/${apiKeyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    throw new Error('Failed to update API key');
  }
}

export async function deleteSystemApiKey(apiKeyId: string) {
  const response = await fetch(`/api/settings/system-api-keys/${apiKeyId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete API key');
  }
}
