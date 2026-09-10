import {
  autoClosePositionIfHeadcountFilled,
  autoOpenPositionIfNewHeadcountAdded,
  broadcastPositionUpdates,
} from '@/lib/headcount';
import { getHeadcountActorName } from './headcount-detail-auth';
import type { HeadcountDetailSessionUser } from './headcount-detail-types';

export async function runHeadcountPositionAutomation(positionId: string, user: HeadcountDetailSessionUser) {
  const actorName = getHeadcountActorName(user);
  let autoOpenResult = null;
  let autoCloseResult = null;

  try {
    autoOpenResult = await autoOpenPositionIfNewHeadcountAdded(positionId, user.id, actorName);
  } catch (autoOpenError) {
    console.error('Error auto-opening position:', autoOpenError);
  }

  try {
    autoCloseResult = await autoClosePositionIfHeadcountFilled(positionId, user.id, actorName);
  } catch (autoCloseError) {
    console.error('Error auto-closing position:', autoCloseError);
  }

  return { autoOpenResult, autoCloseResult };
}

export async function broadcastHeadcountDetailChanges() {
  try {
    await broadcastPositionUpdates();
  } catch (broadcastError) {
    console.error('Failed to broadcast real-time updates:', broadcastError);
  }
}
