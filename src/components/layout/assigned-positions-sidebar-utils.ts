import type { AssignedPosition, AssignedPositionsResponse } from "./AssignedPositionsSidebarTypes";

export function normalizeAssignedPositionsResponse(
  payload: AssignedPositionsResponse,
): AssignedPosition[] {
  return Array.isArray(payload.data) ? payload.data : [];
}

export function isAssignedPositionsRefreshEvent(event: { type: string }) {
  return event.type === "position_update" || event.type === "dashboard_update";
}
