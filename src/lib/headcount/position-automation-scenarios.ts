import {
  completePositionStateChange,
  getAutomationPosition,
  noHeadcountsResult,
  positionNotFoundResult,
} from './position-automation-actions';
import { checkPositionHeadcountStatus } from './status';
import type { PositionActionResult } from './types';

interface PositionAutomationScenarioOptions {
  positionId: string;
  actingUserId: string;
}

export async function executeAutoClosePosition({
  positionId,
  actingUserId,
}: PositionAutomationScenarioOptions): Promise<PositionActionResult> {
  const headcountStatus = await checkPositionHeadcountStatus(positionId);

  if (!headcountStatus.hasHeadcounts) {
    return noHeadcountsResult();
  }

  if (!headcountStatus.isFilled) {
    return {
      success: false,
      message: 'Position still has vacant headcounts',
      action: 'none',
      headcountStatus,
    };
  }

  const position = await getAutomationPosition(positionId);
  if (!position) {
    return positionNotFoundResult(positionId);
  }

  if (!position.isOpen) {
    return {
      success: true,
      message: 'Position is already closed',
      action: 'none',
      headcountStatus,
    };
  }

  return completePositionStateChange({
    positionId,
    actingUserId,
    headcountStatus,
    targetIsOpen: false,
    auditAction: 'SYSTEM:AutoClosePosition',
    auditMessage: `Position '${position.title}' automatically closed due to all headcounts being filled. Total headcounts: ${headcountStatus.totalHeadcounts}, Filled: ${headcountStatus.filledHeadcounts}`,
    previousStatus: 'open',
    newStatus: 'closed',
    successMessage: 'Position automatically closed successfully',
    action: 'closed',
  });
}

export async function executeAutoReopenPosition({
  positionId,
  actingUserId,
}: PositionAutomationScenarioOptions): Promise<PositionActionResult> {
  const headcountStatus = await checkPositionHeadcountStatus(positionId);

  if (!headcountStatus.hasHeadcounts) {
    return noHeadcountsResult();
  }

  if (headcountStatus.isFilled) {
    return {
      success: false,
      message: 'Position still has all headcounts filled',
      action: 'none',
      headcountStatus,
    };
  }

  const position = await getAutomationPosition(positionId);
  if (!position) {
    return positionNotFoundResult(positionId);
  }

  if (position.isOpen) {
    return {
      success: true,
      message: 'Position is already open',
      action: 'none',
      headcountStatus,
    };
  }

  return completePositionStateChange({
    positionId,
    actingUserId,
    headcountStatus,
    targetIsOpen: true,
    auditAction: 'SYSTEM:AutoReopenPosition',
    auditMessage: `Position '${position.title}' automatically reopened due to headcount becoming available. Total headcounts: ${headcountStatus.totalHeadcounts}, Vacant: ${headcountStatus.vacantHeadcounts}`,
    previousStatus: 'closed',
    newStatus: 'open',
    successMessage: 'Position automatically reopened successfully',
    action: 'reopened',
  });
}

export async function executeAutoOpenPosition({
  positionId,
  actingUserId,
}: PositionAutomationScenarioOptions): Promise<PositionActionResult> {
  const position = await getAutomationPosition(positionId);
  if (!position) {
    return positionNotFoundResult(positionId);
  }

  if (position.isOpen) {
    return {
      success: true,
      message: 'Position is already open',
      action: 'none',
    };
  }

  const headcountStatus = await checkPositionHeadcountStatus(positionId);
  if (!headcountStatus.hasHeadcounts) {
    return noHeadcountsResult();
  }

  return completePositionStateChange({
    positionId,
    actingUserId,
    headcountStatus,
    targetIsOpen: true,
    auditAction: 'SYSTEM:AutoOpenPosition',
    auditMessage: `Position '${position.title}' automatically opened due to new headcount being added. Total headcounts: ${headcountStatus.totalHeadcounts}`,
    previousStatus: 'closed',
    newStatus: 'open',
    successMessage: 'Position automatically opened successfully',
    action: 'opened',
  });
}
