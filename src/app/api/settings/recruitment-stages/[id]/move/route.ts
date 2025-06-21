// src/app/api/settings/recruitment-stages/[id]/move/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { pool } from '../../../../../../lib/db';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';

const moveStageSchema = z.object({
  newOrder: z.number().int().min(0, "Order must be a non-negative integer."),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    if (!actingUserId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const validation = moveStageSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { newOrder } = validation.data;
    const stageId = params.id;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const stageToMoveResult = await client.query('SELECT "order", "positionId" FROM "RecruitmentStage" WHERE id = $1', [stageId]);
        if (stageToMoveResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Stage not found" }, { status: 404 });
        }
        const { order: oldOrder, positionId } = stageToMoveResult.rows[0];

        if (newOrder > oldOrder) {
            // Moving down
            await client.query(
                'UPDATE "RecruitmentStage" SET "order" = "order" - 1 WHERE "order" > $1 AND "order" <= $2 AND "positionId" = $3',
                [oldOrder, newOrder, positionId]
            );
        } else {
            // Moving up
            await client.query(
                'UPDATE "RecruitmentStage" SET "order" = "order" + 1 WHERE "order" >= $1 AND "order" < $2 AND "positionId" = $3',
                [newOrder, oldOrder, positionId]
            );
        }

        await client.query('UPDATE "RecruitmentStage" SET "order" = $1 WHERE id = $2', [newOrder, stageId]);

        await client.query('COMMIT');

        await logAudit('AUDIT', `Recruitment stage (ID: ${stageId}) moved from order ${oldOrder} to ${newOrder}.`, 'API:RecruitmentStages:Move', actingUserId, { stageId, oldOrder, newOrder });
        return NextResponse.json({ message: 'Stage order updated successfully' }, { status: 200 });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error(`Failed to move stage ${stageId}:`, error);
        await logAudit('ERROR', `Failed to move stage (ID: ${stageId}). Error: ${error.message}`, 'API:RecruitmentStages:Move', actingUserId, { stageId });
        return NextResponse.json({ message: 'Error updating stage order', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
