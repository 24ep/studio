export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getPool, type DbClient } from '@/lib/db';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';

type PositionLevelRow = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type PositionLevelNameRow = {
  id: string;
};

type NextSortOrderRow = {
  next_sort: number | string;
};

type CreatePositionLevelBody = {
  name?: unknown;
  description?: unknown;
  color?: unknown;
  isActive?: unknown;
  sortOrder?: unknown;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown position level error';
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

function parseCreateBody(body: CreatePositionLevelBody) {
  return {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    description: typeof body.description === 'string' ? body.description : null,
    color: typeof body.color === 'string' && body.color ? body.color : '#6B7280',
    isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
    sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
  };
}

export async function GET(request: NextRequest) {
  let client: DbClient | null = null;
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view position levels
    // Users should be able to view levels if they can view positions or manage system settings
    if (!hasPermission(session.user, 'POSITIONS_VIEW') && !hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view position levels' }, { status: 403 });
    }

    const pool = getPool();
    client = await pool.connect();
    
    const query = `
      SELECT id, name, description, color, "is_active" as "isActive", "sort_order" as "sortOrder", "createdAt", "updatedAt"
      FROM "PositionLevel"
      ORDER BY "sort_order" ASC, name ASC
    `;
    const result = await client.query<PositionLevelRow>(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[PositionLevels API] Error:', error);
    return NextResponse.json({ 
      message: 'Error fetching position levels', 
      error: getErrorMessage(error),
      details: getErrorStack(error),
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let client: DbClient | null = null;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create position levels
    // Users should be able to create levels if they can manage positions or system settings
    if (!hasPermission(session.user, 'POSITIONS_CREATE') && !hasPermission(session.user, 'POSITIONS_EDIT_BASIC') && !hasPermission(session.user, 'POSITIONS_EDIT_DETAILED') && !hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
      return NextResponse.json({ message: 'Forbidden: Insufficient permissions to create position levels' }, { status: 403 });
    }

    client = await getPool().connect();
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const body = bodyResult.value as CreatePositionLevelBody;
    const { name, description, color, isActive, sortOrder } = parseCreateBody(body);

    if (!name) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existing = await client.query<PositionLevelNameRow>('SELECT id FROM "PositionLevel" WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Position level name already exists' }, { status: 409 });
    }

    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined) {
      const maxSortResult = await client.query<NextSortOrderRow>('SELECT COALESCE(MAX("sort_order"), 0) + 1 as next_sort FROM "PositionLevel"');
      finalSortOrder = Number(maxSortResult.rows[0].next_sort);
    }

    const query = `
      INSERT INTO "PositionLevel" (id, name, description, color, "is_active", "sort_order", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING id, name, description, color, "is_active" as "isActive", "sort_order" as "sortOrder", "createdAt", "updatedAt"
    `;

    const result = await client.query<PositionLevelRow>(query, [
      name, description, color, isActive, finalSortOrder
    ]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating position level:', error);
    return NextResponse.json({ message: 'Error creating position level', error: getErrorMessage(error) }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}


