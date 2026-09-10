import { logAudit } from '@/lib/auditLog';
import prisma from '@/lib/prisma';
import { broadcastPositionListUpdated, broadcastPositionUpdate } from '@/lib/simple-broadcaster';
import { broadcastPositionStats } from './broadcast';
import type { HeadcountStatus, PositionActionResult, PositionAutomationSummary } from './types';

const POSITION_SELECT = {
  id: true,
  title: true,
  isOpen: true,
  department: true,
  customAttributes: true,
};

const UPDATED_POSITION_SELECT = {
  ...POSITION_SELECT,
  updatedAt: true,
};

export function noHeadcountsResult(): PositionActionResult {
  return {
    success: false,
    message: 'Position has no headcounts defined',
    action: 'none',
  };
}

export function positionNotFoundResult(positionId: string): PositionActionResult {
  console.error(`Position ${positionId} not found`);
  return {
    success: false,
    message: 'Position not found',
    action: 'none',
  };
}

export async function getAutomationPosition(positionId: string) {
  return prisma.position.findUnique({
    where: { id: positionId },
    select: POSITION_SELECT,
  });
}

export async function completePositionStateChange({
  positionId,
  actingUserId,
  headcountStatus,
  targetIsOpen,
  auditAction,
  auditMessage,
  previousStatus,
  newStatus,
  successMessage,
  action,
}: {
  positionId: string;
  actingUserId: string;
  headcountStatus: HeadcountStatus;
  targetIsOpen: boolean;
  auditAction: string;
  auditMessage: string;
  previousStatus: string;
  newStatus: string;
  successMessage: string;
  action: PositionActionResult['action'];
}): Promise<PositionActionResult> {
  const updatedPosition = await prisma.position.update({
    where: { id: positionId },
    data: { isOpen: targetIsOpen },
    select: UPDATED_POSITION_SELECT,
  });

  await logAudit(
    'AUDIT',
    auditMessage,
    auditAction,
    actingUserId,
    {
      positionId,
      headcountStatus,
      previousStatus,
      newStatus,
    }
  );

  const positionWithCustomAttrs = withCustomAttributes(updatedPosition);
  broadcastPositionUpdate(positionWithCustomAttrs, actingUserId);
  broadcastPositionListUpdated();
  await broadcastPositionStats();

  return {
    success: true,
    message: successMessage,
    action,
    headcountStatus,
    position: positionWithCustomAttrs,
  };
}

export async function logPositionAutomationError(
  positionId: string,
  actingUserId: string,
  auditAction: string,
  messagePrefix: string,
  error: unknown
) {
  await logAudit(
    'ERROR',
    `${messagePrefix} ${positionId}. Error: ${getErrorMessage(error)}`,
    auditAction,
    actingUserId,
    { positionId, error: getErrorMessage(error) }
  );
}

function withCustomAttributes<TPosition extends {
  id: string;
  title: string;
  isOpen: boolean;
  department: string | null;
  customAttributes?: unknown;
}>(position: TPosition): PositionAutomationSummary {
  return {
    ...position,
    custom_attributes: position.customAttributes || {},
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}
