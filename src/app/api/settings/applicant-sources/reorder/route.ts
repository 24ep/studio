export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getPool } from '@/lib/db';
import { logAudit } from '@/lib/auditLog';
import { hasPermission } from '@/lib/permissions';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
const reorderApplicantSourcesSchema = z.object({
  sourceIds: z.array(z.string().uuid()),
});

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @openapi
 * /api/settings/applicant-sources/reorder:
 *   post:
 *     summary: Reorder Applicant sources
 *     description: Updates the sort order of Applicant sources based on the provided array of IDs. Requires Admin or SYSTEM_SETTINGS_MANAGE permission.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Applicant sources reordered successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient permissions)
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Check permissions
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const bodyResult = await readRequestJsonResult(request);
    const { sourceIds } = reorderApplicantSourcesSchema.parse(bodyResult.ok ? bodyResult.value : undefined);

    if (sourceIds.length === 0) {
      return NextResponse.json({ message: "No source IDs provided" }, { status: 400 });
    }

    // Update sort order for each source
    for (let i = 0; i < sourceIds.length; i++) {
      await getPool().query(
        'UPDATE "ApplicantSource" SET sort_order = $1, "updatedAt" = NOW() WHERE id = $2',
        [i + 1, sourceIds[i]]
      );
    }

    await logAudit('INFO', `Reordered ${sourceIds.length} Applicant sources`, 'API:ApplicantSources:Reorder', session.user.id);
    
    return NextResponse.json({ message: "Applicant sources reordered successfully" }, { status: 200 });
  } catch (error) {
    console.error("Failed to reorder Applicant sources:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    const errorMessage = getErrorMessage(error);
    await logAudit('ERROR', `Failed to reorder Applicant sources. Error: ${errorMessage}`, 'API:ApplicantSources:Reorder', session.user.id);
    return NextResponse.json({ message: "Error reordering Applicant sources", error: errorMessage }, { status: 500 });
  }
}
