export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { syncAllRecruiter, syncRecruiterForPosition } from '@/lib/recruiterSync';
import { z } from 'zod';

import { auth } from '@/auth';
import { readRequestJsonResult } from '@/lib/request-json';
const syncRequestSchema = z.object({
  positionId: z.string().uuid().optional(),
  syncAll: z.boolean().optional().default(false)
});

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * @openapi
 * /api/settings/recruiter-sync:
 *   post:
 *     summary: Sync recruiter assignments between positions and Applicants
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               positionId:
 *                 type: string
 *                 format: uuid
 *                 description: Position ID to sync (optional if syncAll is true)
 *               syncAll:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to sync all positions
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has admin permissions
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
    return NextResponse.json({ message: 'Insufficient permissions. Admin access required.' }, { status: 403 });
  }

  const bodyResult = await readRequestJsonResult(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const body = bodyResult.value;
  const validationResult = syncRequestSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ 
      message: 'Invalid input', 
      errors: validationResult.error.flatten().fieldErrors 
    }, { status: 400 });
  }

  const validatedData = validationResult.data;
  const positionId = validatedData.positionId;
  const syncAll = validatedData.syncAll;

  try {
    if (syncAll) {
      // Sync all positions
      const results = await syncAllRecruiter(actingUserId, actingUserName);
      
      const summary = {
        totalPositions: results.length,
        totalApplicantsUpdated: results.reduce((sum, r) => sum + r.applicantsUpdated, 0),
        totalApplicantsSkipped: results.reduce((sum, r) => sum + r.applicantsSkipped, 0),
        totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
        results
      };

      return NextResponse.json({
        message: 'Bulk recruiter sync completed',
        summary,
        details: results
      });
    } else if (positionId) {
      // Sync specific position
      const result = await syncRecruiterForPosition(positionId, actingUserId, actingUserName);
      
      return NextResponse.json({
        message: 'Position recruiter sync completed',
        result
      });
    } else {
      return NextResponse.json({ 
        message: 'Either positionId or syncAll must be provided' 
      }, { status: 400 });
    }
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    console.error('Recruiter sync error:', error);
    return NextResponse.json({ 
      message: 'Failed to sync recruiters', 
      error: errorMessage 
    }, { status: 500 });
  }
}
