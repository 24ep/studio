import {
  getJsonArray,
  getJsonNumber,
  getJsonString,
  isJsonObject,
  type JsonObject,
} from "../../lib/response-json";
import type { QueueResponse } from "./applicant-import-queue-types";
import { normalizeQueueItems } from "./applicant-import-upload-queue-item-normalizers";

export type PositionOption = { id: string; title: string };
export type SourceOption = { id: string; name: string; logo?: string };
type QueueOptionKeys<T> = {
  idKey: string;
  labelKey: string;
  labelProperty: keyof T;
};

export interface UploadQueueActionData {
  ok?: boolean;
  error?: string;
  successCount?: number;
  failedDetails?: Array<{ reason?: string }>;
}

function getJsonBoolean(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "boolean" ? field : undefined;
}

function normalizeOption<T extends { id: string }>(
  item: unknown,
  { idKey, labelKey, labelProperty }: QueueOptionKeys<T>,
  extraFields: (value: JsonObject) => Partial<T> = () => ({})
): T[] {
    if (!isJsonObject(item)) {
      return [];
    }

  const id = getJsonString(item, idKey);
  const label = getJsonString(item, labelKey);
  if (!id || !label) {
    return [];
  }

  return [{ id, [labelProperty]: label, ...extraFields(item) } as T];
}

export function normalizePositionOptions(value: unknown): PositionOption[] {
  const items = isJsonObject(value) ? getJsonArray(value, "data") : undefined;
  return (items ?? []).flatMap(item => normalizeOption<PositionOption>(item, {
    idKey: "id",
    labelKey: "title",
    labelProperty: "title",
  }));
}

export function normalizeSourceOptions(value: unknown): SourceOption[] {
  return (Array.isArray(value) ? value : []).flatMap(item => normalizeOption<SourceOption>(item, {
    idKey: "id",
    labelKey: "name",
    labelProperty: "name",
  }, source => ({ logo: getJsonString(source, "logo") })));
}

function normalizeQueueSummary(value: unknown): QueueResponse["summary"] {
  if (!isJsonObject(value)) {
    return undefined;
  }

  return {
    queued: getJsonNumber(value, "queued") ?? 0,
    inprocess: getJsonNumber(value, "inprocess") ?? 0,
    success: getJsonNumber(value, "success") ?? 0,
    error: getJsonNumber(value, "error") ?? 0,
    total: getJsonNumber(value, "total"),
  };
}

export function normalizeQueueResponse(value: unknown): QueueResponse {
  if (!isJsonObject(value)) {
    return { data: [], total: 0 };
  }

  return {
    data: normalizeQueueItems(getJsonArray(value, "data")),
    total: getJsonNumber(value, "total") ?? 0,
    summary: normalizeQueueSummary(value.summary),
  };
}

function normalizeFailedDetails(value: unknown): Array<{ reason?: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((detail) => (
    isJsonObject(detail)
      ? { reason: getJsonString(detail, "reason") }
      : {}
  ));
}

export function normalizeUploadQueueActionData(value: unknown): UploadQueueActionData {
  if (!isJsonObject(value)) {
    return {};
  }

  const data: UploadQueueActionData = {};
  const ok = getJsonBoolean(value, "ok");
  const error = getJsonString(value, "error") ?? getJsonString(value, "message");
  const successCount = getJsonNumber(value, "successCount");

  if (ok !== undefined) {
    data.ok = ok;
  }
  if (error) {
    data.error = error;
  }
  if (successCount !== undefined) {
    data.successCount = successCount;
  }
  if (Array.isArray(value.failedDetails)) {
    data.failedDetails = normalizeFailedDetails(value.failedDetails);
  }

  return data;
}
