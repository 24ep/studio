export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { logAudit } from '@/lib/auditLog';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { getPool } from '@/lib/db';
import type { QueryResultRow } from 'pg';

/**
 * @openapi
 * /api/positions/{id}/interviewers/{userId}:
 *   delete:
 *     summary: Remove an interviewer from a position
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Interviewer removed successfully
 *       404:
 *         description: Position, interviewer, or assignment not found
 */

type PositionInterviewerPositionRow = QueryResultRow & {
  id: string;
  title: string;
};

type PositionInterviewerUserRow = QueryResultRow & {
  id: string;
  name: string | null;
  email: string | null;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await auth();
  const actingUserId = session?.user?.id;
  const actingUserName = (session?.user?.name || session?.user?.email || actingUserId || 'System') as string;

  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to edit positions
  if (!hasPermission(session.user, 'POSITIONS_EDIT_BASIC') && !hasPermission(session.user, 'POSITIONS_EDIT_DETAILED')) {
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions to edit positions' }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;
  const userId = resolvedParams.userId;

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    
    // Check if position exists
    const positionCheckQuery = 'SELECT id, title FROM "Position" WHERE id = $1';
    const positionResult = await client.query<PositionInterviewerPositionRow>(positionCheckQuery, [id]);
    
    if (positionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Position not found' }, { status: 404 });
    }

    const position = positionResult.rows[0];

    // Check if user exists
    const userCheckQuery = 'SELECT id, name, email FROM "User" WHERE id = $1';
    const userResult = await client.query<PositionInterviewerUserRow>(userCheckQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Check if interviewer assignment exists
    const assignmentCheckQuery = 'SELECT id FROM "PositionInterviewer" WHERE "positionId" = $1 AND "userId" = $2';
    const assignmentResult = await client.query(assignmentCheckQuery, [id, userId]);
    
    if (assignmentResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'User is not assigned as an interviewer for this position' }, { status: 404 });
    }

    // Remove interviewer
    const deleteQuery = 'DELETE FROM "PositionInterviewer" WHERE "positionId" = $1 AND "userId" = $2';
    const deleteResult = await client.query(deleteQuery, [id, userId]);
    
    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Failed to remove interviewer' }, { status: 500 });
    }
    
    await client.query('COMMIT');
    
    await logAudit('AUDIT', `Interviewer ${user.name} (${user.email}) removed from position '${position.title}' by ${actingUserName}.`, 'API:PositionInterviewers:Remove', actingUserId, { positionId: id, userId });
    
    return NextResponse.json({ 
      message: 'Interviewer removed successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    const errorMessage = getErrorMessage(error);
    
    await logAudit('ERROR', `Failed to remove interviewer from position. Error: ${errorMessage}`, 'API:PositionInterviewers:Remove', actingUserId, { positionId: id, userId });
    return NextResponse.json({ message: 'Error removing interviewer', error: errorMessage }, { status: 500 });
  } finally {
    client.release();
  }
}
