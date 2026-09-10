import { getJsonArray, readJsonObject } from '../response-json';

function buildGraphHeaders(accessToken: string) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

async function logGraphCollectionFailure(response: Response, failureLog: string) {
  const errorText = await response.text();
  console.error(failureLog, response.status, errorText);

  if (response.status === 403) {
    console.error('[GraphClient] Permission denied - ensure required permission is configured and admin consent granted');
  }
}

export async function fetchGraphCollection<T>(
  endpoint: string,
  accessToken: string,
  failureLog: string
): Promise<T[]> {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: buildGraphHeaders(accessToken),
  });

  if (!response.ok) {
    await logGraphCollectionFailure(response, failureLog);
    return [];
  }

  return (getJsonArray(await readJsonObject(response), 'value') ?? [])
    .map((item) => item as unknown as T);
}
