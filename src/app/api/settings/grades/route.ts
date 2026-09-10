export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import type { QueryResultRow } from 'pg';
import { getPool, type DbClient } from '@/lib/db';
import { readRequestJsonObject } from '@/lib/request-json';

import { auth } from '@/auth';

type GradeRow = QueryResultRow & {
  id: string;
  name: string;
  label: string | null;
  description: string | null;
  minLevel: number;
  maxLevel: number;
  slaDays: number;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type GradeIdRow = QueryResultRow & {
  id: string;
};

type NextSortRow = QueryResultRow & {
  next_sort: number;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const client = await getPool().connect();
  try {
    const query = `
      SELECT id, name, label, description, "min_level" as "minLevel", "max_level" as "maxLevel", "sla_days" as "slaDays", color, "is_active" as "isActive", "sort_order" as "sortOrder", "createdAt", "updatedAt"
      FROM "Grade"
      ORDER BY "sort_order" ASC, name ASC
    `;
    const result = await client.query<GradeRow>(query);
    
    return NextResponse.json(result.rows);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Error fetching grades:', error);
    return NextResponse.json({ message: 'Error fetching grades', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const client: DbClient = await getPool().connect();
  try {
    const body = await readRequestJsonObject(request);
    const { name, label, description, minLevel, maxLevel, slaDays, color, isActive, sortOrder } = body;

    // Validate required fields
    if (!isString(name) || !isNumber(minLevel) || !isNumber(maxLevel) || !isNumber(slaDays)) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Check if name already exists
    const existingGrade = await client.query<GradeIdRow>('SELECT id FROM "Grade" WHERE name = $1', [name]);
    if (existingGrade.rows.length > 0) {
      return NextResponse.json({ message: 'Grade name already exists' }, { status: 409 });
    }

    // Get next sort order if not provided
    let finalSortOrder = isNumber(sortOrder) ? sortOrder : undefined;
    if (finalSortOrder === undefined) {
      const maxSortResult = await client.query<NextSortRow>('SELECT COALESCE(MAX("sort_order"), 0) + 1 as next_sort FROM "Grade"');
      finalSortOrder = maxSortResult.rows[0].next_sort;
    }

    const query = `
      INSERT INTO "Grade" (id, name, label, description, "min_level", "max_level", "sla_days", color, "is_active", "sort_order", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING id, name, label, description, "min_level" as "minLevel", "max_level" as "maxLevel", "sla_days" as "slaDays", color, "is_active" as "isActive", "sort_order" as "sortOrder", "createdAt", "updatedAt"
    `;
    
    const result = await client.query<GradeRow>(query, [
      name,
      isString(label) ? label : null,
      isString(description) ? description : null,
      minLevel,
      maxLevel,
      slaDays,
      isString(color) && color ? color : '#3B82F6',
      typeof isActive === 'boolean' ? isActive : true,
      finalSortOrder
    ]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Error creating grade:', error);
    return NextResponse.json({ message: 'Error creating grade', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
