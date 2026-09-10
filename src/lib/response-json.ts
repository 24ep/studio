import {
  getJsonArray,
  getJsonErrorMessage,
  getJsonNumber,
  getJsonObject,
  getJsonString,
  isJsonObject,
  type JsonObject,
  type JsonValue,
} from './json-types';

type JsonReadable = Pick<Response, 'json'>;

export async function readJsonOrFallback<T>(response: JsonReadable, fallback: T): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    return fallback;
  }
}

export function readJsonObject(response: JsonReadable): Promise<JsonObject> {
  return readJsonOrFallback<unknown>(response, {}).then((value) => (
    isJsonObject(value) ? value : {}
  ));
}

export {
  getJsonArray,
  getJsonErrorMessage,
  getJsonNumber,
  getJsonObject,
  getJsonString,
  isJsonObject,
};
export type { JsonObject, JsonValue };
