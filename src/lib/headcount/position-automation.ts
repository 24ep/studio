/**
 * Position Automation Functions
 * Functions for automatically opening/closing positions based on headcount
 */

import prisma from '@/lib/prisma';
import {
  executeAutoClosePosition,
  executeAutoOpenPosition,
  executeAutoReopenPosition,
} from './position-automation-scenarios';
import { runPositionAutomation } from './position-automation-runner';
import type { BatchCloseResult, PositionActionResult } from './types';

export async function autoClosePositionIfHeadcountFilled(
  positionId: string,
  actingUserId: string,
  actingUserName: string
): Promise<PositionActionResult> {
  return runPositionAutomation({
    positionId,
    actingUserId,
    auditAction: 'SYSTEM:AutoClosePosition',
    consoleMessage: 'Error auto-closing position:',
    errorMessage: 'Failed to auto-close position',
    execute: () => executeAutoClosePosition({ positionId, actingUserId }),
  });
}

export async function reopenPositionIfHeadcountAvailable(
  positionId: string,
  actingUserId: string,
  actingUserName: string
): Promise<PositionActionResult> {
  return runPositionAutomation({
    positionId,
    actingUserId,
    auditAction: 'SYSTEM:AutoReopenPosition',
    consoleMessage: 'Error auto-reopening position:',
    errorMessage: 'Failed to auto-reopen position',
    execute: () => executeAutoReopenPosition({ positionId, actingUserId }),
  });
}

export async function autoOpenPositionIfNewHeadcountAdded(
  positionId: string,
  actingUserId: string,
  actingUserName: string
): Promise<PositionActionResult> {
  return runPositionAutomation({
    positionId,
    actingUserId,
    auditAction: 'SYSTEM:AutoOpenPosition',
    consoleMessage: 'Error auto-opening position:',
    errorMessage: 'Failed to auto-open position',
    execute: () => executeAutoOpenPosition({ positionId, actingUserId }),
  });
}

export async function checkAndAutoCloseAllPositions(
  actingUserId: string,
  actingUserName: string
): Promise<BatchCloseResult[]> {
  try {
    const openPositions = await prisma.position.findMany({
      where: { isOpen: true },
      select: { id: true, title: true },
    });

    const results: BatchCloseResult[] = [];

    for (const position of openPositions) {
      try {
        const result = await autoClosePositionIfHeadcountFilled(
          position.id,
          actingUserId,
          actingUserName
        );
        results.push({
          positionId: position.id,
          positionTitle: position.title,
          ...result,
        });
      } catch (error) {
        console.error(`Error processing position ${position.title} (${position.id}):`, error);
        results.push({
          positionId: position.id,
          positionTitle: position.title,
          success: false,
          message: `Error processing position: ${error instanceof Error ? error.message : 'Unknown error'}`,
          action: 'error',
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error checking and auto-closing positions:', error);
    throw error;
  }
}
