import { NextRequest, NextResponse } from 'next/server';
import { hasPermission } from '@/lib/permissions';
import { checkAndAutoCloseAllPositions } from '@/lib/headcountUtils';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

/**
 * @openapi
 * /api/positions/auto-close:
 *   post:
 *     summary: Manually trigger auto-close check for all positions
 *     description: Checks all open positions and automatically closes those where all headcounts are filled
 *     responses:
 *       200:
 *         description: Auto-close check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       positionId:
 *                         type: string
 *                       positionTitle:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       message:
 *                         type: string
 *                       action:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin permissions
 */
export async function POST(request: NextRequest) {
  try {

    const session = await auth();
    if (!session?.user) {
      // console.log('Auto-close API: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    if (!hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT')) {
      // console.log(`Auto-close API: Forbidden access attempt by ${session.user.name} (role: ${session.user.role})`);
      return NextResponse.json({ 
        error: 'Forbidden - Admin permissions required' 
      }, { status: 403 });
    }

    // console.log(`Auto-close API: Starting auto-close check for user ${session.user.name}`);

    const results = await checkAndAutoCloseAllPositions(
      session.user.id,
      session.user.name || session.user.email || 'System'
    );

    const closedCount = results.filter(r => r.action === 'closed').length;
    const totalProcessed = results.length;
    const errorCount = results.filter(r => r.action === 'error').length;
    const noActionCount = results.filter(r => r.action === 'none').length;

    // console.log(`Auto-close API: Completed. Processed: ${totalProcessed}, Closed: ${closedCount}, Errors: ${errorCount}, No Action: ${noActionCount}`);

    return NextResponse.json({
      message: `Auto-close check completed. Processed ${totalProcessed} positions, closed ${closedCount} positions.`,
      results,
      summary: {
        totalProcessed,
        closedCount,
        errorCount,
        noActionCount,
      }
    });

  } catch (error) {
    console.error('Error in auto-close API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
