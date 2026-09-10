import {
  getJsonArray,
  getJsonNumber,
  getJsonObject,
  isJsonObject,
  type JsonObject,
} from "@/lib/response-json";

export function getWebhookResponseArray(value: unknown, key: string) {
  return isJsonObject(value) ? getJsonArray(value, key) ?? [] : [];
}

export function getWebhookResponseNumber(value: unknown, key: string, fallback = 0) {
  return isJsonObject(value) ? getJsonNumber(value, key) ?? fallback : fallback;
}

export function getWebhookPaginationTotal(value: unknown, key: "total" | "totalPages") {
  if (!isJsonObject(value)) {
    return 0;
  }

  const pagination = getJsonObject(value, "pagination") as JsonObject | undefined;
  return pagination ? getJsonNumber(pagination, key) ?? 0 : 0;
}
