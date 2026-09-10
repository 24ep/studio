export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '../../../../../lib/db';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/auditLog';
import { z } from 'zod';
import { broadcastApplicantUpdate } from '@/lib/simple-broadcaster';
import { fetchAllRecruitmentStagesDb } from '@/lib/apiUtils';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
const reorderSchema = z.object({
  stageIds: z.array(z.string().uuid()),
});

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @openapi
 * /api/settings/recruitment-stages/reorder:
 *   post:
 *     summary: Reorder recruitment stages
 *     description: Reorders the recruitment stages by the given array of stage IDs. Requires authentication and Admin or RECRUITMENT_STAGES_EDIT permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of recruitment stage IDs in the new order
 *           examples:
 *             example:
 *               summary: Example request
 *               value:
 *                 stageIds: ["uuid1", "uuid2", "uuid3"]
 *     responses:
 *       200:
 *         description: Recruitment stages reordered successfully
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
 *                   message: "Recruitment stages reordered successfully"
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: "Forbidden: Insufficient permissions"
 */

export async function POST(request: NextRequest) {
  const session = await auth();
  const actingUserId = session?.user?.id;
  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // Check permissions for RECRUITMENT_STAGES_EDIT
  if (!hasPermission(session.user, 'RECRUITMENT_STAGES_EDIT')) {
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const body = bodyResult.value;
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
    // Remove: await deleteCache(CACHE_KEY_RECRUITMENT_STAGES);
    
    // Broadcast the updated stages list to all connected clients
    const updatedStages = await fetchAllRecruitmentStagesDb();
    broadcastApplicantUpdate({ action: 'recruitment_stages_updated', stages: updatedStages }, session.user.id);
    
    return NextResponse.json({ message: 'Recruitment stages reordered successfully' }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    await client.query('ROLLBACK');
    console.error('Failed to reorder recruitment stages:', error);
    await logAudit(
      'ERROR',
      `Failed to reorder recruitment stages. Error: ${errorMessage}`,
      'API:RecruitmentStages:Reorder',
      actingUserId,
      { input: body }
    );
    return NextResponse.json({ message: 'Error reordering recruitment stages', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
} 
