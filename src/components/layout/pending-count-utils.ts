import { parseSseJsonData } from "../../lib/sse-event-utils";

export const PENDING_COUNT_POLL_INTERVAL_MS = 30000;

export interface PendingCountState {
  pendingCount: number | null;
  hasPermission: boolean;
}

export function buildPendingCount(totalQueued: unknown, totalInProcess: unknown) {
  return Number(totalQueued || 0) + Number(totalInProcess || 0);
}

export function buildPendingCountStateFromHealthPayload(data: unknown): PendingCountState {
  const queueStats = data && typeof data === 'object'
    ? (data as { queue_stats?: { queued?: unknown; inprocess?: unknown } }).queue_stats
    : undefined;

  return {
    pendingCount: buildPendingCount(queueStats?.queued, queueStats?.inprocess),
    hasPermission: true,
  };
}

export function buildPendingCountNoPermissionState(): PendingCountState {
  return {
    pendingCount: null,
    hasPermission: false,
  };
}

export function shouldOpenPendingCountEventSource(hasPermission: boolean | null) {
  return hasPermission !== false;
}

export function parsePendingCountSsePayload(rawData: string) {
  const parsed = parseSseJsonData(rawData);
  if (!parsed.ok) {
    return null;
  }

  return parsePendingCountSseData(parsed.data);
}

export function parsePendingCountSseData(data: unknown) {
  if (
    data &&
    typeof data === 'object' &&
    ((data as { type?: unknown }).type === 'upload_queue_update' || (data as { type?: unknown }).type === 'queue') &&
    (data as { summary?: unknown }).summary &&
    typeof (data as { summary: unknown }).summary === 'object'
  ) {
    const summary = (data as { summary: { queued?: unknown; inprocess?: unknown } }).summary;
    return buildPendingCount(summary.queued, summary.inprocess);
  }

  return null;
}
