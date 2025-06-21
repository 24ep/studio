// src/app/api/positions/bulk-action/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import type { PositionBulkActionPayload } from '@/lib/types';
import { getRedisClient, CACHE_KEY_POSITIONS } from '@/lib/redis';

const bulkPositionActionSchema = z.object({
  action: z.enum(['delete', 'change_status']),
  positionIds: z.array(z.string().uuid()).min(1, "At least one position ID is required."),
  newIsOpenStatus: z.boolean().optional(), // Required if action is 'change_status'
});

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  const actingUserId = session?.user?.id;
  const actingUserName = session?.user?.name || session?.user?.email || 'System (Bulk Action)';

  if (!actingUserId || (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('POSITIONS_MANAGE'))) {
    await logAudit('WARN', `Forbidden attempt to perform bulk position action by ${actingUserName}.`, 'API:Positions:BulkAction', actingUserId);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = bulkPositionActionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input for bulk position action.", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { action, positionIds, newIsOpenStatus } = validationResult.data;
  const client = await pool.connect();
  let successCount = 0;
  let failCount = 0;
  const failedDetails: { positionId: string, reason: string }[] = [];
  let cacheInvalidated = false;

  try {
    await client.query('BEGIN');

    if (action === 'delete') {
      const candidateCheckQuery = 'SELECT DISTINCT "positionId" FROM "Candidate" WHERE "positionId" = ANY($1::uuid[])';
      const candidateCheckResult = await client.query(candidateCheckQuery, [positionIds]);
      const positionsWithCandidates = new Set(candidateCheckResult.rows.map(r => r.positionId));

      const positionsToDelete = positionIds.filter(id => !positionsWithCandidates.has(id));
      const positionsNotDeleted = positionIds.filter(id => positionsWithCandidates.has(id));

      positionsNotDeleted.forEach(id => {
        failedDetails.push({ positionId: id, reason: "Position has associated candidates and cannot be deleted." });
        failCount++;
      });

      if (positionsToDelete.length > 0) {
        const deleteResult = await client.query('DELETE FROM "Position" WHERE id = ANY($1::uuid[]) RETURNING id', [positionsToDelete]);
        successCount = deleteResult.rowCount;
        if (successCount > 0) cacheInvalidated = true;
      }
      
    } else if (action === 'change_status') {
      if (newIsOpenStatus === undefined) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: "New 'isOpen' status is required for 'change_status' action." }, { status: 400 });
      }
      const updateResult = await client.query(
        'UPDATE "Position" SET "isOpen" = $1, "updatedAt" = NOW() WHERE id = ANY($2::uuid[]) RETURNING id',
        [newIsOpenStatus, positionIds]
      );
      successCount = updateResult.rowCount;
      if (successCount > 0) cacheInvalidated = true;

      const updatedIds = updateResult.rows.map(r => r.id);
      failCount = positionIds.length - successCount;
      positionIds.forEach(id => {
        if (!updatedIds.includes(id)) {
          failedDetails.push({ positionId: id, reason: "Position not found or failed to update."});
        }
      });
    }

    await client.query('COMMIT');

    if (cacheInvalidated) {
        const redisClient = await getRedisClient();
        if (redisClient) {
            await redisClient.del(CACHE_KEY_POSITIONS);
            console.log('Positions cache invalidated due to bulk action.');
        }
    }

    await logAudit('AUDIT', `Bulk position action '${action}' performed by ${actingUserName}. Success: ${successCount}, Fail: ${failCount}. Target IDs: ${positionIds.join(', ')}.`, 'API:Positions:BulkAction', actingUserId, { action, successCount, failCount, positionIds, newIsOpenStatus: newIsOpenStatus, failedDetails: failCount > 0 ? failedDetails : undefined });
    
    return NextResponse.json({ 
      message: `Bulk action '${action}' processed. Success: ${successCount}, Failed: ${failCount}.`,
      successCount,
      failCount,
      failedDetails: failCount > 0 ? failedDetails : undefined,
    }, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to perform bulk position action '${action}':`, error);
    await logAudit('ERROR', `Failed bulk position action '${action}' by ${actingUserName}. Error: ${error.message}`, 'API:Positions:BulkAction', actingUserId, { action, positionIds, error: error.message });
    return NextResponse.json({ message: `Error during bulk action: ${error.message}`, error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
