import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
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
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const isOpenFilter = searchParams.get('isOpen');
        let query = 'SELECT id, title, department, description, "isOpen", position_level, "customAttributes", "createdAt", "updatedAt" FROM "positions"';
        const conditions = [];
        const queryParams = [];
        let paramIndex = 1;
        if (isOpenFilter === 'true') {
            conditions.push('"isOpen" = TRUE');
        }
        else if (isOpenFilter === 'false') {
            conditions.push('"isOpen" = FALSE');
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY "createdAt" DESC';
        const result = await getPool().query(query, queryParams);
        const positions = result.rows.map(row => (Object.assign(Object.assign({}, row), { custom_attributes: row.customAttributes || {} })));
        return NextResponse.json({ data: positions }, { status: 200 });
    }
    catch (error) {
        console.error('Failed to fetch all positions:', error);
        return NextResponse.json({ message: 'Error fetching all positions', error: error.message }, { status: 500 });
    }
}
