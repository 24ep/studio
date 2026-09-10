import { isJsonObject, type JsonObject } from './json-types';

type JsonReadableRequest = Pick<Request, 'json'>;

export async function readRequestJsonOrFallback<T>(request: JsonReadableRequest, fallback: T): Promise<T> {
  try {
    return await request.json() as T;
  } catch {
    return fallback;
  }
}

export async function readRequestJsonResult(
  request: JsonReadableRequest,
): Promise<{ ok: true; value: unknown } | { ok: false; error: unknown }> {
  try {
    return { ok: true, value: await request.json() as unknown };
  } catch (error) {
    return { ok: false, error };
  }
}

export function readRequestJsonObject(request: JsonReadableRequest): Promise<JsonObject> {
  return readRequestJsonOrFallback<unknown>(request, {}).then((value) => (
    isJsonObject(value) ? value : {}
  ));
}

export type { JsonObject };
