import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getPool } from '@/lib/db';
export const dynamic = "force-dynamic";
/**
 * @openapi
 * /api/positions/{id}:
 *   get:
 *     summary: Get a position by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Position details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Position'
 *       404:
 *         description: Position not found
 *   put:
 *     summary: Update a position by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Position'
 *     responses:
 *       200:
 *         description: Position updated
 *   delete:
 *     summary: Delete a position by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Position deleted
 *       404:
 *         description: Position not found
 */
function extractIdFromUrl(request) {
    const match = request.nextUrl.pathname.match(/\/positions\/([^/]+)/);
    return match ? match[1] : null;
}
export async function GET(request, { params }) {
    var _a;
    const session = await getServerSession(authOptions);
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const client = await getPool().connect();
    try {
        const query = 'SELECT id, title, department, description, "isOpen", position_level, "customAttributes", "createdAt", "updatedAt" FROM "Position" WHERE id = $1';
        const result = await client.query(query, [id]);
        if (result.rows.length === 0) {
            return NextResponse.json({ message: 'Position not found' }, { status: 404 });
        }
        const position = result.rows[0];
        return NextResponse.json(Object.assign(Object.assign({}, position), { custom_attributes: position.customAttributes || {} }));
    }
    catch (error) {
        return NextResponse.json({ message: 'Error fetching position', error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
const updatePositionSchema = z.object({
    title: z.string().min(1).optional(),
    department: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    isOpen: z.boolean().optional(),
    position_level: z.string().optional().nullable(),
    custom_attributes: z.record(z.any()).optional().nullable(), // New
});
export async function PUT(request, { params }) {
    var _a, _b, _c;
    const session = await getServerSession(authOptions);
    const actingUserId = (_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id;
    const actingUserName = ((_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = session === null || session === void 0 ? void 0 : session.user) === null || _c === void 0 ? void 0 : _c.email) || 'System';
    if (!actingUserId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    let body;
    try {
        body = await request.json();
    }
    catch (_d) {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    const validationResult = updatePositionSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const { title, department, description, isOpen, position_level, custom_attributes } = validationResult.data;
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        // Check if position exists
        const positionExistsQuery = 'SELECT id, "customAttributes" FROM "Position" WHERE id = $1';
        const existingResult = await client.query(positionExistsQuery, [id]);
        if (existingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Position not found' }, { status: 404 });
        }
        // Update position
        const updateQuery = `
      UPDATE "Position" 
      SET title = $1, department = $2, description = $3, "isOpen" = $4, 
          position_level = $5, "customAttributes" = $6, "updatedAt" = NOW()
      WHERE id = $7
      RETURNING *;
    `;
        const updateResult = await client.query(updateQuery, [
            title, department, description, isOpen, position_level, custom_attributes || {}, id
        ]);
        await client.query('COMMIT');
        await logAudit('AUDIT', `Position '${title}' updated by ${actingUserName}.`, 'API:Positions:Update', actingUserId, { positionId: id });
        const updatedPosition = updateResult.rows[0];
        return NextResponse.json({
            message: 'Position updated successfully',
            position: Object.assign(Object.assign({}, updatedPosition), { custom_attributes: updatedPosition.customAttributes || {} })
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        await logAudit('ERROR', `Failed to update position. Error: ${error.message}`, 'API:Positions:Update', actingUserId, { positionId: id, input: body });
        return NextResponse.json({ message: 'Error updating position', error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
export async function DELETE(request, { params }) {
    var _a, _b, _c, _d;
    const session = await getServerSession(authOptions);
    const actingUserId = (_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id;
    const actingUserName = ((_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = session === null || session === void 0 ? void 0 : session.user) === null || _c === void 0 ? void 0 : _c.email) || 'System';
    if (!actingUserId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        // Check if position has candidates
        const currentPosition = await getPool().query('SELECT * FROM "Position" WHERE id = $1', [id]);
        if (currentPosition.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Position not found' }, { status: 404 });
        }
        const positionQuery = 'SELECT p.id, p.title, COUNT(c.id) as "candidateCount" FROM "Position" p LEFT JOIN "Candidate" c ON p.id = c."positionId" WHERE p.id = $1 GROUP BY p.id, p.title;';
        const candidateCountResult = await client.query(positionQuery, [id]);
        const candidateCount = parseInt(((_d = candidateCountResult.rows[0]) === null || _d === void 0 ? void 0 : _d.candidateCount) || '0', 10);
        if (candidateCount > 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({
                message: `Cannot delete position. It has ${candidateCount} associated candidate(s).`
            }, { status: 409 });
        }
        // Delete position
        const deleteQuery = 'DELETE FROM "Position" WHERE id = $1';
        const deleteResult = await client.query(deleteQuery, [id]);
        if (deleteResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Position not found' }, { status: 404 });
        }
        await client.query('COMMIT');
        await logAudit('AUDIT', `Position '${currentPosition.rows[0].title}' deleted by ${actingUserName}.`, 'API:Positions:Delete', actingUserId, { positionId: id });
        return NextResponse.json({ message: 'Position deleted successfully' });
    }
    catch (error) {
        await client.query('ROLLBACK');
        await logAudit('ERROR', `Failed to delete position. Error: ${error.message}`, 'API:Positions:Delete', actingUserId, { positionId: id });
        return NextResponse.json({ message: 'Error deleting position', error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
