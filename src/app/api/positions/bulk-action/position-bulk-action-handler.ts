import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import {
  getPositionBulkActionActingUser,
  getPositionBulkActionSession,
  requirePositionBulkActionPermission,
} from './position-bulk-action-auth';
import {
  connectPositionBulkActionClient,
  runPositionBulkAction,
  type DbClient,
} from './position-bulk-action-data';
import { broadcastPositionBulkActionUpdates } from './position-bulk-action-realtime';
import {
  parsePositionBulkActionBody,
  validatePositionBulkActionBody,
} from './position-bulk-action-request';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown bulk position action error';
}

function isMissingPositionBulkActionInput(error: unknown): error is Error {
  return error instanceof Error && error.name === 'MissingPositionBulkActionInput';
}

export async function handlePositionBulkAction(request: NextRequest) {
  const session = await getPositionBulkActionSession();
  const { actingUserId, actingUserName } = getPositionBulkActionActingUser(session);

  const parsedBody = await parsePositionBulkActionBody(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const actionType = (parsedBody.body as { action?: unknown })?.action;
  const permissionError = await requirePositionBulkActionPermission(
    session,
    actionType,
    actingUserId,
    actingUserName
  );
  if (permissionError) {
    return permissionError;
  }

  const validation = validatePositionBulkActionBody(parsedBody.body);
  if (!validation.ok) {
    return validation.response;
  }

  const input = validation.input;
  const connection = await connectPositionBulkActionClient();
  if (!connection.ok) {
    return NextResponse.json(connection.responseBody, { status: 500 });
  }

  const { client } = connection;
  try {
    await client.query('BEGIN');
    const result = await runPositionBulkAction(client, input);
    await client.query('COMMIT');

    await broadcastPositionBulkActionUpdates(client, {
      action: input.action,
      successCount: result.successCount,
      cacheInvalidated: result.cacheInvalidated,
    });

    await logAudit(
      'AUDIT',
      `Bulk position action '${input.action}' performed by ${actingUserName}. Success: ${result.successCount}, Fail: ${result.failCount}. Target IDs: ${input.positionIds.join(', ')}.`,
      'API:Positions:BulkAction',
      actingUserId,
      {
        action: input.action,
        successCount: result.successCount,
        failCount: result.failCount,
        positionIds: input.positionIds,
        newIsOpenStatus: input.newIsOpenStatus,
        failedDetails: result.failCount > 0 ? result.failedDetails : undefined,
      }
    );

    return NextResponse.json(
      {
        message: `Bulk action '${input.action}' processed. Success: ${result.successCount}, Failed: ${result.failCount}.`,
        successCount: result.successCount,
        failCount: result.failCount,
        failedDetails: result.failCount > 0 ? result.failedDetails : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    await rollbackPositionBulkAction(client);

    if (isMissingPositionBulkActionInput(error)) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const errorMessage = getErrorMessage(error);
    console.error(`Failed to perform bulk position action '${input.action}':`, error);
    await logAudit(
      'ERROR',
      `Failed bulk position action '${input.action}' by ${actingUserName}. Error: ${errorMessage}`,
      'API:Positions:BulkAction',
      actingUserId,
      { action: input.action, positionIds: input.positionIds, error: errorMessage }
    );
    return NextResponse.json(
      { message: `Error during bulk action: ${errorMessage}`, error: errorMessage },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

async function rollbackPositionBulkAction(client: DbClient) {
  try {
    await client.query('ROLLBACK');
  } catch (rollbackError) {
    console.error('[Position Bulk Action API] Error during rollback:', rollbackError);
  }
}
