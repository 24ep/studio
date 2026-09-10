import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getPool, type DbClient } from '@/lib/db';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type PersonalityTrait = {
  id: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  isActive: boolean;
  sortOrder: number;
  groupId: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  group: { id: string; name: string; color: string | null } | null;
};

type PersonalityGroup = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  traits: PersonalityTrait[];
};

type PersonalityGroupRow = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

type PersonalityTraitRow = {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  is_active: boolean;
  sort_order: number;
  groupId: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  group_name: string | null;
  group_color: string | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getErrorStack(error: unknown) {
  return error instanceof Error ? error.stack : undefined;
}

/**
 * @openapi
 * /api/evaluation/personality-traits:
 *   get:
 *     summary: Get all personality traits and groups
 *     responses:
 *       200:
 *         description: List of personality traits and groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 traits:
 *                   type: array
 *                   items:
 *                     type: object
 *                 groups:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    console.error('[Personality Traits API] Unauthorized access attempt');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to view evaluation configuration
  if (!hasPermission(session.user, 'POSITIONS_VIEW')) {
    console.error(`[Personality Traits API] Forbidden access attempt by user ${session.user.id} - missing POSITIONS_VIEW permission`);
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions to view evaluation configuration' }, { status: 403 });
  }

  let client: DbClient | null = null;
  try {
    client = await getPool().connect();
  } catch (connectionError) {
    console.error(`[Personality Traits API] Failed to connect to database:`, connectionError);
    return NextResponse.json({ 
      message: 'Database connection error', 
      error: getErrorMessage(connectionError)
    }, { status: 500 });
  }

  try {
    // Get all personality groups
    const groupsQuery = `
      SELECT id, name, description, color, is_active, sort_order, "createdAt", "updatedAt"
      FROM "PersonalityGroup"
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
    `;
    const groupsResult = await client.query<PersonalityGroupRow>(groupsQuery);
    
    // Get all personality traits
    const traitsQuery = `
      SELECT 
        t.id, t.name, t.description, t.short_description, t.is_active, t.sort_order, t."groupId",
        t."createdAt", t."updatedAt",
        g.name as group_name, g.color as group_color
      FROM "PersonalityTrait" t
      LEFT JOIN "PersonalityGroup" g ON t."groupId" = g.id
      WHERE t.is_active = true
      ORDER BY t.sort_order ASC, t.name ASC
    `;
    const traitsResult = await client.query<PersonalityTraitRow>(traitsQuery);
    
    // Transform the data
    const groups: PersonalityGroup[] = groupsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      traits: [] as PersonalityTrait[] // Will be populated below
    }));
    
    const traits: PersonalityTrait[] = traitsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      shortDescription: row.short_description,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      groupId: row.groupId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      group: row.groupId ? {
        id: row.groupId,
        name: row.group_name || '',
        color: row.group_color
      } : null
    }));
    
    // Populate traits in groups
    groups.forEach(group => {
      group.traits = traits.filter(trait => trait.groupId === group.id);
    });
    
    return NextResponse.json({
      traits,
      groups
    });
  } catch (error) {
    console.error(`[Personality Traits API] Database error:`, error);
    return NextResponse.json({ 
      message: 'Error fetching personality traits', 
      error: getErrorMessage(error),
      details: process.env.NODE_ENV === 'development' ? getErrorStack(error) : undefined
    }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
