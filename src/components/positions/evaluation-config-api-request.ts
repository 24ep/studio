import { readJsonObject, readJsonOrFallback } from "../../lib/response-json";

export interface PositionWithCustomAttributes {
  custom_attributes?: Record<string, unknown>;
}

export async function assertEvaluationResponseOk(response: Response, label: string) {
  if (response.ok) return;

  const errorData = await readJsonObject(response);
  console.error(`Failed to ${label}:`, response.status, response.statusText, errorData);
  throw new Error(`Failed to ${label}: ${response.status} ${response.statusText}`);
}

export async function fetchEvaluationJson<T>(url: string, label: string): Promise<T> {
  const response = await fetch(url);
  await assertEvaluationResponseOk(response, label);
  return readJsonOrFallback<T>(response, {} as T);
}

export async function fetchOptionalEvaluationJson<T>(
  url: string,
  fallback: T
): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return fallback;
    }

    return readJsonOrFallback<T>(response, fallback);
  } catch {
    return fallback;
  }
}

export async function fetchPositionWithCustomAttributes(
  positionId: string
): Promise<PositionWithCustomAttributes | null> {
  const response = await fetch(`/api/positions/${positionId}`);
  if (!response.ok) {
    return null;
  }

  return readJsonOrFallback<PositionWithCustomAttributes>(response, {});
}

export async function removePositionEvaluationItem(url: string, fallbackMessage: string) {
  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await readJsonObject(response);
    const errorMessage = String(errorData.message || errorData.error || `${fallbackMessage} (${response.status})`);
    throw new Error(errorMessage);
  }
}
