export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function getJsonString(value: JsonObject, key: string): string | undefined {
  const field = value[key];
  return typeof field === 'string' ? field : undefined;
}

export function getJsonNumber(value: JsonObject, key: string): number | undefined {
  const field = value[key];
  return typeof field === 'number' ? field : undefined;
}

export function getJsonArray(value: JsonObject, key: string): JsonValue[] | undefined {
  const field = value[key];
  return Array.isArray(field) ? field : undefined;
}

export function getJsonObject(value: JsonObject, key: string): JsonObject | undefined {
  const field = value[key];
  return isJsonObject(field) ? field : undefined;
}

export function getJsonErrorMessage(
  value: JsonObject,
  fallback = 'Request failed',
): string {
  return getJsonString(value, 'error') ?? getJsonString(value, 'message') ?? fallback;
}
