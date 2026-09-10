import {
  getJsonNumber,
  getJsonString,
  isJsonObject,
  type JsonObject,
} from "../../lib/response-json";
import type { QueueItem } from "./applicant-import-queue-types";

type QueueStatus = QueueItem["status"];

function normalizeQueueStatus(value: unknown): QueueStatus {
  return value === "queued" || value === "inprocess" || value === "success" || value === "failed"
    ? value
    : "queued";
}

function getQueueStringFields(item: JsonObject) {
  return {
    file_name: getJsonString(item, "file_name") ?? "",
    error: getJsonString(item, "error"),
    error_details: getJsonString(item, "error_details"),
    source: getJsonString(item, "source"),
    source_id: getJsonString(item, "source_id"),
    sub_source: getJsonString(item, "sub_source"),
    source_name: getJsonString(item, "source_name"),
    source_logo: getJsonString(item, "source_logo"),
    applicant_id: getJsonString(item, "applicant_id"),
    applicant_name: getJsonString(item, "applicant_name"),
    upload_date: getJsonString(item, "upload_date") ?? "",
    completed_date: getJsonString(item, "completed_date"),
    upload_id: getJsonString(item, "upload_id"),
    created_by: getJsonString(item, "created_by"),
    updated_at: getJsonString(item, "updated_at") ?? "",
    file_path: getJsonString(item, "file_path") ?? "",
    position_id: getJsonString(item, "position_id"),
    position_title: getJsonString(item, "position_title"),
    process_date: getJsonString(item, "process_date"),
    url: getJsonString(item, "url"),
    user_id: getJsonString(item, "user_id") ?? "",
    user_email: getJsonString(item, "user_email"),
  };
}

function getQueueNumberFields(item: JsonObject) {
  return {
    file_size: getJsonNumber(item, "file_size") ?? 0,
    progress: getJsonNumber(item, "progress"),
    total_applicants: getJsonNumber(item, "total_applicants"),
    processed_applicants: getJsonNumber(item, "processed_applicants"),
  };
}

function normalizeQueueItem(item: unknown): QueueItem[] {
  if (!isJsonObject(item)) {
    return [];
  }

  const id = getJsonString(item, "id");
  if (!id) {
    return [];
  }

  return [{
    id,
    ...getQueueStringFields(item),
    ...getQueueNumberFields(item),
    status: normalizeQueueStatus(item.status),
    webhook_payload: item.webhook_payload,
  }];
}

export function normalizeQueueItems(value: unknown): QueueItem[] {
  return (Array.isArray(value) ? value : []).flatMap(normalizeQueueItem);
}
