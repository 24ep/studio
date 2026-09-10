import { NextResponse, type NextRequest } from 'next/server';

import { logAudit } from '@/lib/auditLog';

import {
  connectClient,
  getErrorMessage,
  readPosition,
  requireEditUser,
  rollbackSafely,
} from './position-evaluation-items-route-core';
import type {
  AssignmentRouteContext,
  PositionEvaluationAssignmentDeleteRouteConfig,
} from './position-evaluation-items-route-types';

export function createPositionEvaluationAssignmentDeleteHandler(
  config: PositionEvaluationAssignmentDeleteRouteConfig
) {
  return async function DELETE(_request: NextRequest, { params }: AssignmentRouteContext) {
    const authResult = await requireEditUser();
    if (!authResult.ok) {
      return authResult.response;
    }

    const { id, assignmentId } = await params;
    const connection = await connectClient(config.apiLabel);
    if (!connection.ok) {
      return connection.response;
    }

    const { client } = connection;
    try {
      await client.query('BEGIN');

      const position = await readPosition(client, id);
      if (!position) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Position not found' }, { status: 404 });
      }

      const assignment = await config.readAssignment(client, assignmentId, id);
      if (!assignment) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: config.assignmentNotFoundMessage }, { status: 404 });
      }

      const deletedCount = await config.deleteAssignment(client, assignmentId, id);
      if (deletedCount === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: config.deleteFailedMessage }, { status: 500 });
      }

      await client.query('COMMIT');

      await logAudit(
        'AUDIT',
        config.buildAuditMessage(assignment.itemName, position.title, authResult.user.name),
        config.auditRemoveAction,
        authResult.user.id,
        { positionId: id, assignmentId }
      );

      return NextResponse.json({ message: config.successMessage });
    } catch (error: unknown) {
      await rollbackSafely(client, config.apiLabel);
      const errorMessage = getErrorMessage(error);

      await logAudit(
        'ERROR',
        `Failed to remove ${config.itemLabel} from position. Error: ${errorMessage}`,
        config.auditRemoveAction,
        authResult.user.id,
        { positionId: id, assignmentId }
      );

      return NextResponse.json(
        {
          message: config.errorMessage,
          error: errorMessage,
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  };
}
