import { logPositionAutomationError } from './position-automation-actions';
import type { PositionActionResult } from './types';

export interface PositionAutomationRunOptions {
  positionId: string;
  actingUserId: string;
  auditAction: string;
  consoleMessage: string;
  errorMessage: string;
  execute: () => Promise<PositionActionResult>;
}

export async function runPositionAutomation({
  positionId,
  actingUserId,
  auditAction,
  consoleMessage,
  errorMessage,
  execute,
}: PositionAutomationRunOptions) {
  try {
    return await execute();
  } catch (error) {
    console.error(consoleMessage, error);
    await logPositionAutomationError(
      positionId,
      actingUserId,
      auditAction,
      errorMessage,
      error
    );
    throw error;
  }
}
