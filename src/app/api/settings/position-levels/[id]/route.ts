import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getPool, type DbClient } from '@/lib/db';
import { readRequestJsonResult } from '@/lib/request-json';

type RouteContext = { params: Promise<{ id: string }> };

type PositionLevelRow = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type PositionLevelNameRow = {
  name: string;
};

type CountRow = {
  count: string | number;
};

type UpdatePositionLevelBody = {
  name?: unknown;
  description?: unknown;
  color?: unknown;
  isActive?: unknown;
  sortOrder?: unknown;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function parseUpdateBody(body: unknown): UpdatePositionLevelBody {
  return body && typeof body === 'object' && !Array.isArray(body)
    ? body as UpdatePositionLevelBody
    : {};
}

function getOptionalString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function getOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  let client: DbClient | null = null;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    client = await getPool().connect();
    
    const query = `
      SELECT id, name, description, color, "is_active" as "isActive", "sort_order" as "sortOrder", "createdAt", "updatedAt"
      FROM "PositionLevel"
      WHERE id = $1
    `;
    const result = await client.query<PositionLevelRow>(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Position level not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error fetching position level:', error);
    return NextResponse.json({ message: 'Error fetching position level', error: getErrorMessage(error) }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  let client: DbClient | null = null;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    client = await getPool().connect();
    
    const bodyResult = await readRequestJsonResult(request);
    if (!bodyResult.ok) {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const body = parseUpdateBody(bodyResult.value);
    const name = getOptionalString(body.name);
    const description = getOptionalString(body.description);
    const color = getOptionalString(body.color);
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;
    const sortOrder = getOptionalNumber(body.sortOrder);

    if (!name) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existing = await client.query<{ id: string }>('SELECT id FROM "PositionLevel" WHERE name = $1 AND id != $2', [name, id]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Position level name already exists' }, { status: 409 });
    }

    const query = `
      UPDATE "PositionLevel"
      SET name = $1, description = $2, color = $3, "is_active" = $4, "sort_order" = COALESCE($5, "sort_order"), "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, name, description, color, "is_active" as "isActive", "sort_order" as "sortOrder", "createdAt", "updatedAt"
    `;

    const result = await client.query<PositionLevelRow>(query, [
      name, description, color || '#6B7280', isActive ?? true, sortOrder, id
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Position level not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: unknown) {
    console.error('Error updating position level:', error);
    return NextResponse.json({ message: 'Error updating position level', error: getErrorMessage(error) }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  let client: DbClient | null = null;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    client = await getPool().connect();
    
    // Prevent deletion if the level is in use by any position (matching by name field)
    const levelResult = await client.query<PositionLevelNameRow>('SELECT name FROM "PositionLevel" WHERE id = $1', [id]);
    if (levelResult.rows.length === 0) {
      return NextResponse.json({ message: 'Position level not found' }, { status: 404 });
    }
    const levelName = levelResult.rows[0].name;

    const usage = await client.query<CountRow>('SELECT COUNT(*) FROM "Position" WHERE "positionLevel" = $1', [levelName]);
    if (parseInt(String(usage.rows[0].count), 10) > 0) {
      return NextResponse.json({ message: 'Cannot delete position level. It is currently assigned to one or more positions.' }, { status: 400 });
    }

    const result = await client.query<{ id: string }>('DELETE FROM "PositionLevel" WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Position level not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Position level deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting position level:', error);
    return NextResponse.json({ message: 'Error deleting position level', error: getErrorMessage(error) }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}


