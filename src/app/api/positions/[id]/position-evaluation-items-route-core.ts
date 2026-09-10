import { NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { getPool, type DbClient } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

import type {
  ActingUser,
  PositionEvaluationItemDatabaseError,
  PositionRow,
} from './position-evaluation-items-route-types';

export const positionEvaluationItemSchema = (itemIdField: string) => z.object({
  [itemIdField]: z.string().uuid(),
});

export async function readPosition(client: DbClient, positionId: string): Promise<PositionRow | null> {
  const result = await client.query<PositionRow>('SELECT id, title FROM "Position" WHERE id = $1', [positionId]);
  return result.rows[0] ?? null;
}

export function toDatabaseError(error: unknown): PositionEvaluationItemDatabaseError {
  if (error instanceof Error) {
    return error as PositionEvaluationItemDatabaseError;
  }

  return new Error(String(error)) as PositionEvaluationItemDatabaseError;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function requireViewUser(apiLabel: string) {
  const session = await auth();
  if (!session?.user?.id) {
    console.error(`[${apiLabel}] Unauthorized access attempt`);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasPermission(session.user, 'POSITIONS_VIEW')) {
    console.error(`[${apiLabel}] Forbidden access attempt by user ${session.user.id} - missing POSITIONS_VIEW permission`);
    return {
      ok: false as const,
      response: NextResponse.json({ message: 'Forbidden: Insufficient permissions to view positions' }, { status: 403 }),
    };
  }

  return { ok: true as const };
}

export async function requireEditUser(): Promise<
  | { ok: true; user: ActingUser }
  | { ok: false; response: Response }
> {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasPermission(session.user, 'POSITIONS_EDIT_BASIC') && !hasPermission(session.user, 'POSITIONS_EDIT_DETAILED')) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Forbidden: Insufficient permissions to edit positions' }, { status: 403 }),
    };
  }

  return {
    ok: true,
    user: {
      id: actingUserId,
      name: actingUserName,
      sessionUser: session.user,
    },
  };
}

export async function connectClient(apiLabel: string): Promise<
  | { ok: true; client: DbClient }
  | { ok: false; response: Response }
> {
  try {
    return {
      ok: true,
      client: await getPool().connect(),
    };
  } catch (connectionError: unknown) {
    console.error(`[${apiLabel}] Failed to connect to database:`, connectionError);
    return {
      ok: false,
      response: NextResponse.json(
        {
          message: 'Database connection error',
          error: getErrorMessage(connectionError),
        },
        { status: 500 }
      ),
    };
  }
}

export async function rollbackSafely(client: DbClient, apiLabel: string) {
  try {
    await client.query('ROLLBACK');
  } catch (rollbackError: unknown) {
    console.error(`[${apiLabel}] Error during rollback:`, rollbackError);
  }
}
