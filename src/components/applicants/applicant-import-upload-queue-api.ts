import {
  readJsonOrFallback,
} from "../../lib/response-json";
import type { QueueResponse } from "./applicant-import-queue-types";
import {
  normalizePositionOptions,
  normalizeQueueResponse,
  normalizeSourceOptions,
  normalizeUploadQueueActionData,
  type PositionOption,
  type SourceOption,
  type UploadQueueActionData,
} from "./applicant-import-upload-queue-normalizers";

type UploadQueueFetcher = typeof fetch;

export type UploadQueueBulkAction = "delete" | "retry";

export type { PositionOption, SourceOption, UploadQueueActionData };

export function getUploadQueueActionError(data: UploadQueueActionData | null, fallback: string) {
  return data?.error || fallback;
}

export async function fetchUploadQueuePositions(fetcher: UploadQueueFetcher = fetch): Promise<PositionOption[]> {
  const response = await fetcher("/api/positions?limit=1000");
  if (!response.ok) {
    return [];
  }

  return normalizePositionOptions(await readJsonOrFallback<unknown>(response, {}));
}

export async function fetchUploadQueueSources(fetcher: UploadQueueFetcher = fetch): Promise<SourceOption[]> {
  const response = await fetcher("/api/applicant-sources");
  if (!response.ok) {
    return [];
  }

  return normalizeSourceOptions(await readJsonOrFallback<unknown>(response, []));
}

export async function fetchUploadQueueData(
  params: URLSearchParams,
  fetcher: UploadQueueFetcher = fetch,
): Promise<QueueResponse> {
  const response = await fetcher(`/api/upload-queue?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[ProcessQueue] API Error ${response.status}:`, errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }

  return normalizeQueueResponse(await readJsonOrFallback<unknown>(response, {}));
}

export async function retryUploadQueueItem(itemId: string, fetcher: UploadQueueFetcher = fetch) {
  const response = await fetcher(`/api/upload-queue/${itemId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    cache: "no-store",
  });

  return {
    ok: response.ok,
    data: normalizeUploadQueueActionData(await readJsonOrFallback<unknown>(response, {})),
  };
}

export async function deleteUploadQueueItem(itemId: string, fetcher: UploadQueueFetcher = fetch) {
  const response = await fetcher(`/api/upload-queue/${itemId}`, {
    method: "DELETE",
    cache: "no-store",
  });

  return {
    ok: response.ok,
    data: response.ok
      ? null
      : normalizeUploadQueueActionData(await readJsonOrFallback<unknown>(response, {})),
  };
}

export async function runUploadQueueBulkAction(
  action: UploadQueueBulkAction,
  itemIds: string[],
  fetcher: UploadQueueFetcher = fetch,
) {
  const response = await fetcher("/api/upload-queue/bulk-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, itemIds }),
  });

  return {
    ok: response.ok,
    data: normalizeUploadQueueActionData(await readJsonOrFallback<unknown>(response, {})),
  };
}
