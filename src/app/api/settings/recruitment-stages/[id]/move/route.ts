
// src/app/api/settings/recruitment-stages/[id]/move/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../../../lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { RecruitmentStage } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { getRedisClient, CACHE_KEY_RECRUITMENT_STAGES } from '@/lib/redis';


const moveStageSchema = z.object({
  direction: z.enum(['up', 'down']),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes('RECRUITMENT_STAGES_MANAGE')) {
    await logAudit('WARN', `Forbidden attempt to move recruitment stage (ID: ${params.id}) by user ${session?.user?.email || 'Unknown'}.`, 'API:RecruitmentStages:Move', session?.user?.id, { targetStageId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = moveStageSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { direction } = validationResult.data;
  const stageIdToMove = params.id;
  const client = await pool.connect();
  const redisClient = await getRedisClient();

  try {
    await client.query('BEGIN');

    const allStagesResult = await client.query<RecruitmentStage>(
      'SELECT * FROM "RecruitmentStage" ORDER BY sort_order ASC, "createdAt" ASC FOR UPDATE'
    );
    const sortedStages = allStagesResult.rows;

    const currentIndex = sortedStages.findIndex(s => s.id === stageIdToMove);
    if (currentIndex === -1) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Stage to move not found" }, { status: 404 });
    }

    const stageToMove = sortedStages[currentIndex];
    let otherStage: RecruitmentStage | null = null;

    if (direction === 'up') {
      if (currentIndex === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: "Stage is already at the top" }, { status: 400 });
      }
      otherStage = sortedStages[currentIndex - 1];
    } else { // direction === 'down'
      if (currentIndex === sortedStages.length - 1) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: "Stage is already at the bottom" }, { status: 400 });
      }
      otherStage = sortedStages[currentIndex + 1];
    }

    if (!otherStage) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Cannot determine stage to swap with" }, { status: 500 });
    }

    const tempSortOrder = stageToMove.sort_order;
    const newSortOrderForStageToMove = otherStage.sort_order;
    const newSortOrderForOtherStage = tempSortOrder;

    await client.query(
      'UPDATE "RecruitmentStage" SET sort_order = $1, "updatedAt" = NOW() WHERE id = $2',
      [newSortOrderForStageToMove, stageToMove.id]
    );
    await client.query(
      'UPDATE "RecruitmentStage" SET sort_order = $1, "updatedAt" = NOW() WHERE id = $2',
      [newSortOrderForOtherStage, otherStage.id]
    );

    await client.query('COMMIT');

    if (redisClient) {
      try {
        await redisClient.del(CACHE_KEY_RECRUITMENT_STAGES);
        console.log('Recruitment stages cache invalidated due to MOVE.');
      } catch (cacheError) {
        console.error('Error invalidating recruitment stages cache (MOVE):', cacheError);
      }
    }

    await logAudit('AUDIT', `Recruitment stage '${stageToMove.name}' (ID: ${stageToMove.id}) moved ${direction} by ${session.user.name}.`, 'API:RecruitmentStages:Move', session.user.id, { targetStageId: stageToMove.id, direction });
    
    const finalStagesResult = await client.query<RecruitmentStage>(
        'SELECT * FROM "RecruitmentStage" ORDER BY sort_order ASC, "createdAt" ASC'
    );
    return NextResponse.json(finalStagesResult.rows, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to move recruitment stage ${stageIdToMove}:`, error);
    await logAudit('ERROR', `Failed to move recruitment stage (ID: ${stageIdToMove}) by ${session.user.name}. Error: ${error.message}`, 'API:RecruitmentStages:Move', session.user.id, { targetStageId: stageIdToMove, direction });
    return NextResponse.json({ message: "Error moving recruitment stage", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
