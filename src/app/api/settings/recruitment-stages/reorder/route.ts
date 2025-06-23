import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '../../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/auditLog';
import { z } from 'zod';
import { deleteCache, CACHE_KEY_RECRUITMENT_STAGES } from '@/lib/redis';

export const dynamic = "force-dynamic";

const reorderSchema = z.object({
  stageIds: z.array(z.string().uuid()),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const actingUserId = session?.user?.id;
  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // Optional: Add permission check for RECRUITMENT_STAGES_MANAGE
  if (
    session.user.role !== 'Admin' &&
    !session.user.modulePermissions?.includes('RECRUITMENT_STAGES_MANAGE')
  ) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = reorderSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { stageIds } = validation.data;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < stageIds.length; i++) {
      await client.query(
        'UPDATE "RecruitmentStage" SET sort_order = $1 WHERE id = $2',
        [i, stageIds[i]]
      );
    }
    await client.query('COMMIT');
    await logAudit(
      'AUDIT',
      `Recruitment stages reordered by user ${actingUserId}.`,
      'API:RecruitmentStages:Reorder',
      actingUserId,
      { newOrder: stageIds }
    );
    // Invalidate recruitment stages cache so new order is reflected
    await deleteCache(CACHE_KEY_RECRUITMENT_STAGES);
    return NextResponse.json({ message: 'Recruitment stages reordered successfully' }, { status: 200 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to reorder recruitment stages:', error);
    await logAudit(
      'ERROR',
      `Failed to reorder recruitment stages. Error: ${error.message}`,
      'API:RecruitmentStages:Reorder',
      actingUserId,
      { input: body }
    );
    return NextResponse.json({ message: 'Error reordering recruitment stages', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
} 