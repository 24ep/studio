import { broadcastPositionUpdateIfChanged } from "./data-change-tracker";
import type { EventPayload, TrackedRecord } from "./realtime-event-types";
import {
  broadcastDashboardRefresh,
  broadcastHighPriorityAction,
  forceBroadcastAction,
} from "./simple-broadcaster-dashboard";

export function broadcastPositionUpdate(
  position: TrackedRecord & { id?: string | number },
  actingUserId?: string,
) {
  broadcastPositionUpdateIfChanged(position, actingUserId);
  broadcastDashboardRefresh("position_updated");
}

export function broadcastPositionCreated(position: EventPayload, actingUserId?: string) {
  broadcastHighPriorityAction("position_update", {
    position,
    actingUserId,
    action: "created",
  });
  broadcastDashboardRefresh("position_created");
}

export function broadcastPositionDeleted(positionId: string, actingUserId?: string) {
  broadcastHighPriorityAction("position_update", {
    positionId,
    actingUserId,
    action: "deleted",
  });
  broadcastDashboardRefresh("position_deleted");
}

export function broadcastPositionListUpdated() {
  forceBroadcastAction("position_update", {
    action: "list_updated",
  });
  broadcastDashboardRefresh("position_list_updated");
}

export function broadcastPositionStatisticsUpdated(statistics: EventPayload) {
  broadcastPositionUpdateIfChanged({ statistics }, undefined, {
    minBroadcastInterval: 1000,
    ignoreFields: ["timestamp"],
  });
}
