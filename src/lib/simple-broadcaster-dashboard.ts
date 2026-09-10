import { broadcastHighPriority, forceBroadcast } from "./aggressive-sse-optimizer";
import { broadcastDashboardUpdateIfChanged } from "./data-change-tracker";
import type { EventPayload } from "./realtime-event-types";

export function createTimestampedPayload(data: EventPayload = {}) {
  return {
    ...data,
    timestamp: new Date().toISOString(),
  };
}

export function broadcastHighPriorityAction(
  eventType: "Applicant_update" | "position_update",
  data: EventPayload,
) {
  broadcastHighPriority(eventType, createTimestampedPayload(data));
}

export function forceBroadcastAction(
  eventType: "Applicant_update" | "position_update" | "dashboard_update",
  data: EventPayload,
) {
  forceBroadcast(eventType, createTimestampedPayload(data));
}

export function broadcastDashboardUpdate(data: EventPayload) {
  broadcastDashboardUpdateIfChanged(data, { minBroadcastInterval: 500 });
}

export function broadcastDashboardRefresh(reason: string = "data_changed") {
  forceBroadcastAction("dashboard_update", {
    type: "refresh",
    reason,
  });
}
