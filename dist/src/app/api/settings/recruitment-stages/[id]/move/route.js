// src/app/api/settings/recruitment-stages/[id]/move/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '../../../../../../lib/db';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
export const dynamic = "force-dynamic";
const moveStageSchema = z.object({
    direction: z.enum(['up', 'down']),
});
function extractIdFromUrl(request) {
    const match = request.nextUrl.pathname.match(/\/recruitment-stages\/([^/]+)\/move/);
    return match ? match[1] : null;
}
/**
 * @openapi
 * /api/settings/recruitment-stages/{id}/move:
 *   post:
 *     summary: Move a recruitment stage up or down
 *     description: Moves a recruitment stage up or down in the order. Requires authentication and Admin or RECRUITMENT_STAGES_MANAGE permission.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the recruitment stage
 *         example: "uuid"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               direction:
 *                 type: string
 *                 enum: [up, down]
 *                 description: Direction to move the stage
 *           examples:
 *             example:
 *               summary: Example request
 *               value:
 *                 direction: "up"
 *     responses:
 *       200:
 *         description: Stage order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             examples:
 *               success:
 *                 summary: Example response
 *                 value:
 *                   message: "Stage order updated successfully"
 *       400:
 *         description: Invalid input or already at boundary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: "Forbidden: Insufficient permissions"
 *       404:
 *         description: Stage not found
 */
export async function POST(request) {
    var _a;
    const id = extractIdFromUrl(request);
    const session = await getServerSession(authOptions);
    const actingUserId = (_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!actingUserId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    let body;
    try {
        body = await request.json();
    }
    catch (e) {
        return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    const validation = moveStageSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { direction } = validation.data;
    const stageId = id;
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        // Get current stage and its order
        const stageToMoveResult = await client.query('SELECT sort_order FROM "RecruitmentStage" WHERE id = $1', [stageId]);
        if (stageToMoveResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Stage not found" }, { status: 404 });
        }
        const currentOrder = stageToMoveResult.rows[0].sort_order;
        if (direction === 'up') {
            // Get the stage above this one
            const aboveStageResult = await client.query('SELECT id, sort_order FROM "RecruitmentStage" WHERE sort_order < $1 ORDER BY sort_order DESC LIMIT 1', [currentOrder]);
            if (aboveStageResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: "Stage is already at the top" }, { status: 400 });
            }
            const aboveStage = aboveStageResult.rows[0];
            const newOrder = aboveStage.sort_order;
            // Swap the orders
            await client.query('UPDATE "RecruitmentStage" SET sort_order = $1 WHERE id = $2', [newOrder, stageId]);
            await client.query('UPDATE "RecruitmentStage" SET sort_order = $1 WHERE id = $2', [currentOrder, aboveStage.id]);
        }
        else {
            // Get the stage below this one
            const belowStageResult = await client.query('SELECT id, sort_order FROM "RecruitmentStage" WHERE sort_order > $1 ORDER BY sort_order ASC LIMIT 1', [currentOrder]);
            if (belowStageResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ message: "Stage is already at the bottom" }, { status: 400 });
            }
            const belowStage = belowStageResult.rows[0];
            const newOrder = belowStage.sort_order;
            // Swap the orders
            await client.query('UPDATE "RecruitmentStage" SET sort_order = $1 WHERE id = $2', [newOrder, stageId]);
            await client.query('UPDATE "RecruitmentStage" SET sort_order = $1 WHERE id = $2', [currentOrder, belowStage.id]);
        }
        await client.query('COMMIT');
        await logAudit('AUDIT', `Recruitment stage (ID: ${stageId}) moved ${direction}.`, 'API:RecruitmentStages:Move', actingUserId, { stageId, direction });
        return NextResponse.json({ message: 'Stage order updated successfully' }, { status: 200 });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error(`Failed to move stage ${stageId}:`, error);
        await logAudit('ERROR', `Failed to move stage (ID: ${stageId}). Error: ${error.message}`, 'API:RecruitmentStages:Move', actingUserId, { stageId });
        return NextResponse.json({ message: 'Error updating stage order', error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
