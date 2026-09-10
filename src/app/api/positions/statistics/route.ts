export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @openapi
 * /api/positions/statistics:
 *   get:
 *     summary: Get position statistics
 *     description: Returns statistics for positions with optional filtering.
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by title (partial match)
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: isOpen
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by open/closed status
 *       - in: query
 *         name: positionLevel
 *         schema:
 *           type: string
 *         description: Filter by position level
 *     responses:
 *       200:
 *         description: Position statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: number
 *                 open:
 *                   type: number
 *                 closed:
 *                   type: number
 */
import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { getPool } from '@/lib/db';
import { handleCors } from '@/lib/cors';

import { auth } from '@/auth';
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view positions
    if (!hasPermission(session.user, 'POSITIONS_VIEW')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view positions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const titleFilter = searchParams.get('title');
    const departmentFilter = searchParams.get('department');
    const isOpenFilter = searchParams.get('isOpen');
    const positionLevelFilter = searchParams.get('positionLevel');

    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (titleFilter) {
      conditions.push(`title ILIKE $${paramIndex++}`);
      queryParams.push(`%${titleFilter}%`);
    }
    if (departmentFilter) {
      conditions.push(`department = ANY($${paramIndex++}::text[])`);
      queryParams.push(departmentFilter.split(',').map(d => d.trim()));
    }
    if (isOpenFilter === "true") {
      conditions.push(`"isOpen" = TRUE`);
    } else if (isOpenFilter === "false") {
      conditions.push(`"isOpen" = FALSE`);
    }
    if (positionLevelFilter) {
      conditions.push(`"positionLevel" ILIKE $${paramIndex++}`);
      queryParams.push(`%${positionLevelFilter}%`);
    }

    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    // Get total count
    const totalQuery = `SELECT COUNT(*) FROM "Position"${whereClause}`;
    const totalResult = await getPool().query(totalQuery, queryParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    // Get open count
    const openQuery = `SELECT COUNT(*) FROM "Position"${whereClause}${conditions.length > 0 ? ' AND' : ' WHERE'} "isOpen" = TRUE`;
    const openResult = await getPool().query(openQuery, queryParams);
    const open = parseInt(openResult.rows[0].count, 10);

    // Get closed count
    const closedQuery = `SELECT COUNT(*) FROM "Position"${whereClause}${conditions.length > 0 ? ' AND' : ' WHERE'} "isOpen" = FALSE`;
    const closedResult = await getPool().query(closedQuery, queryParams);
    const closed = parseInt(closedResult.rows[0].count, 10);

    return NextResponse.json({
      total,
      open,
      closed
    }, {
      status: 200,
      headers: handleCors(request)
    });
  } catch (error) {
    console.error("Failed to fetch position statistics:", error);
    return NextResponse.json({
      message: "Error fetching position statistics",
      error: (error as Error).message
    }, {
      status: 500,
      headers: handleCors(request)
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new NextResponse(null, { status: 200, headers });
} 
