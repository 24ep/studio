import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";

/**
 * @openapi
 * /api/positions/all:
 *   get:
 *     summary: Get all positions (no pagination)
 *     description: Returns all positions, optionally filtered by isOpen (enabled/disabled). No pagination.
 *     parameters:
 *       - in: query
 *         name: isOpen
 *         schema:
 *           type: boolean
 *         description: Filter by enabled (open) or disabled (closed) positions
 *         example: true
 *     responses:
 *       200:
 *         description: List of positions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Position'
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   data:
 *                     - id: "uuid"
 *                       title: "Software Engineer"
 *                       department: "Engineering"
 *                       isOpen: true
 *                       position_level: "mid level"
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const titleFilter = searchParams.get('title');
    const departmentFilter = searchParams.get('department');
    const isOpenFilter = searchParams.get('isOpen');
    const positionLevelFilter = searchParams.get('position_level');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = 'SELECT id, title, department, description, "isOpen", position_level, "customAttributes", "createdAt", "updatedAt" FROM "Position"';
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (titleFilter) {
      conditions.push(`title ILIKE $${paramIndex++}`);
      queryParams.push(`%${titleFilter}%`);
    }
    if (departmentFilter) {
      conditions.push(`department = ANY($${paramIndex++}::text[])`);
      queryParams.push(departmentFilter.split(','));
    }
    if (isOpenFilter === "true") {
      conditions.push(`"isOpen" = TRUE`);
    } else if (isOpenFilter === "false") {
      conditions.push(`"isOpen" = FALSE`);
    }
    if (positionLevelFilter) {
      conditions.push(`position_level ILIKE $${paramIndex++}`);
      queryParams.push(`%${positionLevelFilter}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY "createdAt" DESC';
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await getPool().query(query, queryParams);
    const positions = result.rows.map(row => ({
      ...row,
      custom_attributes: row.customAttributes || {},
    }));

    return NextResponse.json({ data: positions }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch positions:", error);
    return NextResponse.json({ message: "Error fetching positions", error: (error as Error).message }, { status: 500 });
  }
} 