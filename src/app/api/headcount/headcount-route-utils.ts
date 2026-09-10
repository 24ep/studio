import { hasAnyPermission, hasPermission, type SessionLikeUser } from "../../../lib/permissions";
import {
  autoClosePositionIfHeadcountFilled,
  autoOpenPositionIfNewHeadcountAdded,
  broadcastPositionUpdates,
} from "../../../lib/headcount";

interface HeadcountRouteUser extends SessionLikeUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

export function canViewHeadcountData(user: SessionLikeUser) {
  return hasAnyPermission(user, ["POSITIONS_VIEW", "applicantS_VIEW"]);
}

export function canCreateHeadcountData(user: SessionLikeUser) {
  return hasPermission(user, "POSITIONS_EDIT_BASIC");
}

function getHeadcountActorName(user: HeadcountRouteUser) {
  return user.name || user.email || "System";
}

export async function runHeadcountCreationEffects(positionId: string, user: HeadcountRouteUser) {
  const actorName = getHeadcountActorName(user);
  let autoOpenResult = null;
  let autoCloseResult = null;

  try {
    autoOpenResult = await autoOpenPositionIfNewHeadcountAdded(positionId, user.id, actorName);
  } catch (autoOpenError) {
    console.error("Error auto-opening position:", autoOpenError);
  }

  try {
    autoCloseResult = await autoClosePositionIfHeadcountFilled(positionId, user.id, actorName);
  } catch (autoCloseError) {
    console.error("Error auto-closing position:", autoCloseError);
  }

  try {
    await broadcastPositionUpdates();
  } catch (broadcastError) {
    console.error("Failed to broadcast real-time updates:", broadcastError);
  }

  return { autoOpenResult, autoCloseResult };
}
