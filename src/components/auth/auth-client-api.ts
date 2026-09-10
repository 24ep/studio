import { getJsonErrorMessage, readJsonObject } from '@/lib/response-json';

export async function postAuthJson(
  url: string,
  payload: Record<string, unknown>,
  fallbackErrorMessage: string
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await readJsonObject(response);

  if (!response.ok) {
    throw new Error(getJsonErrorMessage(data, fallbackErrorMessage));
  }

  return data;
}
