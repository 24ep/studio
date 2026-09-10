import { auth } from '@/auth';
import { fetchAllRecruitmentStagesDb } from '@/lib/apiUtils';
import { logAudit } from '@/lib/auditLog';
import { getPool } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { broadcastApplicantUpdate } from '@/lib/simple-broadcaster';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { readRequestJsonResult } from '@/lib/request-json';

import {
  moveRecruitmentStageInTransaction,
  type StageMoveDirection,
} from './recruitment-stage-move-queries';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const moveStageSchema = z.object({
  direction: z.enum(['up', 'down']),
});

function extractIdFromUrl(request: NextRequest): string | null {
  const match = request.nextUrl.pathname.match(/\/recruitment-stages\/([^/]+)\/move/);
  return match ? match[1] : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function parseMoveDirection(request: NextRequest): Promise<
  | { ok: true; direction: StageMoveDirection }
  | { ok: false; response: NextResponse }
> {
  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return {
      ok: false,
      response: NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const body = bodyResult.value;
  const validation = moveStageSchema.safeParse(body);
  if (!validation.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: 'Invalid input', errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      ),
    };
  }

  return { ok: true, direction: validation.data.direction };
}

/**
 * @openapi
 * /api/settings/recruitment-stages/{id}/move:
 *   post:
 *     summary: Move a recruitment stage up or down
 *     description: Moves a recruitment stage up or down in the order. Requires authentication and Admin or RECRUITMENT_STAGES_EDIT permission.
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
 *       400:
 *         description: Invalid input or already at boundary
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: "Forbidden: Insufficient permissions"
 *       404:
 *         description: Stage not found
 */

export async function POST(request: NextRequest) {
  const id = extractIdFromUrl(request);
  if (!id) {
    return NextResponse.json({ message: 'Invalid recruitment stage ID' }, { status: 400 });
  }

  const { validateUuid } = await import('@/lib/security');
  if (!validateUuid(id)) {
    console.error('[SECURITY] Invalid UUID format in recruitment-stages move POST request:', id);
    return NextResponse.json({ message: 'Invalid recruitment stage ID format' }, { status: 400 });
  }

  const session = await auth();
  const actingUserId = session?.user?.id;
  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!hasPermission(session.user, 'RECRUITMENT_STAGES_EDIT')) {
    await logAudit(
      'WARN',
      `Forbidden attempt to move recruitment stage by ${session.user.name || session.user.email}.`,
      'API:RecruitmentStages:Move',
      actingUserId,
    );
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  const parsedDirection = await parseMoveDirection(request);
  if (!parsedDirection.ok) {
    return parsedDirection.response;
  }

  const stageId = id;
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const moveResult = await moveRecruitmentStageInTransaction(client, stageId, parsedDirection.direction);
    if (!moveResult.ok) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: moveResult.message }, { status: moveResult.status });
    }

    await client.query('COMMIT');

    await logAudit(
      'AUDIT',
      `Recruitment stage (ID: ${stageId}) moved ${parsedDirection.direction}.`,
      'API:RecruitmentStages:Move',
      actingUserId,
      { stageId, direction: parsedDirection.direction },
    );

    const updatedStages = await fetchAllRecruitmentStagesDb();
    broadcastApplicantUpdate({ action: 'recruitment_stages_updated', stages: updatedStages }, session.user.id);

    return NextResponse.json({ message: 'Stage order updated successfully' }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    await client.query('ROLLBACK');
    console.error(`Failed to move stage ${stageId}:`, error);
    await logAudit(
      'ERROR',
      `Failed to move stage (ID: ${stageId}). Error: ${errorMessage}`,
      'API:RecruitmentStages:Move',
      actingUserId,
      { stageId },
    );

    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json({
      message: 'Error updating stage order',
      error: isDevelopment ? errorMessage : 'Internal server error',
    }, { status: 500 });
  } finally {
    client.release();
  }
}
