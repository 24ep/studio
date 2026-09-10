import type { NextRequest } from 'next/server';
import { getPool, type DbClient } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import {
  getV1PositionBulkActionActingUserName,
  requireV1PositionBulkActionUser,
} from './positions-v1-bulk-action-auth';
import { buildV1PositionBulkActionQuery } from './positions-v1-bulk-action-data';
import { broadcastV1PositionBulkActionUpdates } from './positions-v1-bulk-action-realtime';
import { parseV1PositionBulkActionRequest } from './positions-v1-bulk-action-request';
import {
  getErrorMessage,
  v1PositionBulkActionResponse,
} from './positions-v1-bulk-action-response';

const AUDIT_SOURCE = 'API:V1:Positions:BulkAction';

export async function handleV1PositionBulkAction(request: NextRequest) {
  const auth = await requireV1PositionBulkActionUser(request);
  if (!auth.ok) {
    return auth.response;
  }

  const parsedRequest = await parseV1PositionBulkActionRequest(request);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const { input } = parsedRequest;
  const actingUserName = getV1PositionBulkActionActingUserName(auth.user);
  let client: DbClient | null = null;

  try {
    client = await getPool().connect();
    await client.query('BEGIN');

    const actionQuery = await buildV1PositionBulkActionQuery(client, input);
    if (!actionQuery.ok) {
      await client.query('ROLLBACK');
      await logAudit(
        actionQuery.auditLevel,
        `${actionQuery.auditMessage} by ${actingUserName}.`,
        AUDIT_SOURCE,
        auth.user.id,
        actionQuery.auditDetails
      );
      return v1PositionBulkActionResponse(request, { error: actionQuery.error }, actionQuery.status);
    }

    const result = await client.query(actionQuery.actionQuery.query, actionQuery.actionQuery.params);
    const affectedCount = result.rowCount ?? 0;
    await client.query('COMMIT');

    await broadcastV1PositionBulkActionUpdates(client, input.action, affectedCount);
    await logAudit(
      'AUDIT',
      `Bulk action '${input.action}' performed by ${actingUserName}. Affected: ${affectedCount}.`,
      AUDIT_SOURCE,
      auth.user.id,
      {
        action: input.action,
        positionIds: input.positionIds,
        data: input.data,
        affectedCount,
      }
    );

    return v1PositionBulkActionResponse(
      request,
      {
        message: `Bulk action '${input.action}' completed successfully`,
        affectedCount,
      },
      200
    );
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    await rollbackV1PositionBulkAction(client);
    console.error(`Bulk action '${input.action}' failed:`, error);
    await logAudit(
      'ERROR',
      `Bulk action '${input.action}' failed by ${actingUserName}. Error: ${errorMessage}`,
      AUDIT_SOURCE,
      auth.user.id,
      {
        action: input.action,
        positionIds: input.positionIds,
        data: input.data,
        error: errorMessage,
      }
    );
    return v1PositionBulkActionResponse(
      request,
      { error: `Bulk action '${input.action}' failed: ${errorMessage}` },
      500
    );
  } finally {
    releaseV1PositionBulkActionClient(client);
  }
}

async function rollbackV1PositionBulkAction(client: DbClient | null) {
  if (!client) return;

  try {
    await client.query('ROLLBACK');
  } catch (rollbackError) {
    console.error('Error rolling back transaction:', rollbackError);
  }
}

function releaseV1PositionBulkActionClient(client: DbClient | null) {
  if (!client) return;

  try {
    client.release();
  } catch (releaseError) {
    console.error('Error releasing database client:', releaseError);
  }
}
