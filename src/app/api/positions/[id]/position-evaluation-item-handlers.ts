import { NextResponse, type NextRequest } from 'next/server';
import type { QueryResultRow } from 'pg';

import { logAudit } from '@/lib/auditLog';
import { readRequestJsonResult } from '@/lib/request-json';

import {
  connectClient,
  positionEvaluationItemSchema,
  readPosition,
  requireEditUser,
  requireViewUser,
  rollbackSafely,
  toDatabaseError,
} from './position-evaluation-items-route-core';
import type {
  PositionEvaluationItemRouteConfig,
  RouteContext,
} from './position-evaluation-items-route-types';

export function createPositionEvaluationItemHandlers<TListRow extends QueryResultRow>(
  config: PositionEvaluationItemRouteConfig<TListRow>
) {
  async function GET(_request: NextRequest, { params }: RouteContext) {
    const authResult = await requireViewUser(config.apiLabel);
    if (!authResult.ok) {
      return authResult.response;
    }

    const { id } = await params;
    if (!id || id === 'null' || id === 'undefined') {
      return NextResponse.json({ message: 'Invalid position ID' }, { status: 400 });
    }

    const connection = await connectClient(config.apiLabel);
    if (!connection.ok) {
      return connection.response;
    }

    const { client } = connection;
    try {
      const position = await readPosition(client, id);
      if (!position) {
        return NextResponse.json({ message: 'Position not found' }, { status: 404 });
      }

      const result = await client.query<TListRow>(config.listQuery, [id]);
      return NextResponse.json(result.rows.map(config.mapListRow));
    } catch (error: unknown) {
      const dbError = toDatabaseError(error);
      console.error(`[${config.apiLabel}] Database error fetching ${config.itemLabel}s for position ${id}:`, {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        hint: dbError.hint,
        stack: dbError.stack,
        positionId: id,
      });
      return NextResponse.json(
        {
          message: config.fetchErrorMessage,
          error: dbError.message,
          code: dbError.code,
          details: process.env.NODE_ENV === 'development' ? dbError.stack : undefined,
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  }

  async function POST(request: NextRequest, { params }: RouteContext) {
    const authResult = await requireEditUser();
    if (!authResult.ok) {
      return authResult.response;
    }

    const { id } = await params;
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    const body = bodyResult.value;

    const validationResult = positionEvaluationItemSchema(config.itemIdField).safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const itemId = validationResult.data[config.itemIdField] as string;
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

      const item = await config.readItem(client, itemId);
      if (!item) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: config.itemNotFoundMessage }, { status: 404 });
      }

      if (await config.readExistingAssignment(client, id, itemId)) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: config.duplicateMessage }, { status: 409 });
      }

      const assignment = await config.insertAssignment(client, id, itemId);
      await client.query('COMMIT');

      try {
        await logAudit(
          'AUDIT',
          config.buildAuditMessage(item.name, position.title, authResult.user.name),
          config.auditAddAction,
          authResult.user.id,
          { positionId: id, [config.itemIdField]: itemId }
        );
      } catch (auditError: unknown) {
        console.error(`[${config.apiLabel}] Failed to log audit (non-blocking):`, auditError);
      }

      return NextResponse.json(
        {
          message: config.addSuccessMessage,
          assignment: config.buildSuccessAssignment({ assignment, positionId: id, itemId, item }),
        },
        { status: 201 }
      );
    } catch (error: unknown) {
      await rollbackSafely(client, config.apiLabel);
      const dbError = toDatabaseError(error);

      const mappedError = config.mapPostError?.(dbError);
      if (mappedError) {
        return mappedError;
      }

      config.logPostError?.(dbError, { positionId: id, itemId, body });

      try {
        await logAudit(
          'ERROR',
          `Failed to add ${config.itemLabel} to position. Error: ${dbError.message}`,
          config.auditAddAction,
          authResult.user.id,
          { positionId: id, input: body, code: dbError.code }
        );
      } catch (auditError: unknown) {
        console.error(`[${config.apiLabel}] Failed to log audit:`, auditError);
      }

      return NextResponse.json(
        {
          message: config.addErrorMessage,
          error: dbError.message,
          code: dbError.code,
          details: process.env.NODE_ENV === 'development' ? dbError.detail : undefined,
        },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  }

  return { GET, POST };
}
