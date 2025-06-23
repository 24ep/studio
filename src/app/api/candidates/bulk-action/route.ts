// src/app/api/candidates/bulk-action/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const dynamic = "force-dynamic";

const bulkActionSchema = z.object({
  action: z.enum(['delete', 'change_status', 'assign_recruiter']),
  candidateIds: z.array(z.string().uuid()).min(1, "At least one candidate ID is required."),
  newStatus: z.string().optional(), // Required if action is 'change_status'
  newRecruiterId: z.string().uuid().nullable().optional(), // Required if action is 'assign_recruiter'
  notes: z.string().optional().nullable(), // Optional for 'change_status'
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const actingUserId = session?.user?.id;
  const actingUserName = session?.user?.name || session?.user?.email || 'System (Bulk Action)';

  if (!actingUserId || (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CANDIDATES_MANAGE'))) {
    await logAudit('WARN', `Forbidden attempt to perform bulk candidate action by ${actingUserName}.`, 'API:Candidates:BulkAction', actingUserId);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = bulkActionSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input for bulk action.", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { action, candidateIds, newStatus, newRecruiterId, notes } = validationResult.data;
  const client = await getPool().connect();
  let successCount = 0;
  let failCount = 0;
  const failedDetails: { candidateId: string, reason: string }[] = [];

  try {
    await client.query('BEGIN');

    if (action === 'delete') {
      await client.query('DELETE FROM "ResumeHistory" WHERE "candidateId" = ANY($1::uuid[])', [candidateIds]);
      await client.query('DELETE FROM "TransitionRecord" WHERE "candidateId" = ANY($1::uuid[])', [candidateIds]);
      const deleteResult = await client.query('DELETE FROM "candidates" WHERE id = ANY($1::uuid[]) RETURNING id', [candidateIds]);
      successCount = deleteResult.rowCount ?? 0;
      const deletedIds = deleteResult.rows.map((r: { id: string }) => r.id);
      failCount = candidateIds.length - successCount;
      candidateIds.forEach(id => {
        if (!deletedIds.includes(id)) {
          failedDetails.push({ candidateId: id, reason: "Candidate not found or already deleted."});
        }
      });
    } else if (action === 'change_status') {
      if (!newStatus) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: "New status is required for 'change_status' action." }, { status: 400 });
      }
      const stageCheck = await client.query('SELECT id FROM "RecruitmentStage" WHERE name = $1', [newStatus]);
      if (stageCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: `Invalid new status: '${newStatus}'. Stage not found.` }, { status: 400 });
      }

      const oldStatusesResult = await client.query('SELECT id, status FROM "candidates" WHERE id = ANY($1::uuid[])', [candidateIds]);
      const oldStatusesMap = new Map<string, string>(oldStatusesResult.rows.map((r: { id: string, status: string }) => [r.id, r.status]));

      const updateResult = await client.query(
        'UPDATE "candidates" SET status = $1, "updatedAt" = NOW() WHERE id = ANY($2::uuid[]) RETURNING id, name',
        [newStatus, candidateIds]
      );
      successCount = updateResult.rowCount ?? 0;
      const updatedIds = updateResult.rows.map((r: { id: string }) => r.id);
      failCount = candidateIds.length - successCount;
      candidateIds.forEach(id => {
        if (!updatedIds.includes(id)) {
          failedDetails.push({ candidateId: id, reason: "Candidate not found or failed to update."});
        }
      });

      const transitionNotes = notes || `Bulk status change to ${newStatus} by ${actingUserName}.`;
      for (const updatedRow of updateResult.rows as { id: string }[]) {
        const oldStatusForCandidate = oldStatusesMap.get(updatedRow.id) || 'Unknown';
        if (newStatus !== oldStatusForCandidate) {
             await client.query(
                'INSERT INTO "TransitionRecord" (id, "candidateId", date, stage, notes, "actingUserId", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), $3, $4, $5, NOW(), NOW())',
                [uuidv4(), updatedRow.id, newStatus, transitionNotes, actingUserId]
            );
        }
      }
    } else if (action === 'assign_recruiter') {
      if (newRecruiterId) {
         const recruiterCheck = await client.query('SELECT id FROM "User" WHERE id = $1 AND role = $2', [newRecruiterId, 'Recruiter']);
         if (recruiterCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: "Invalid recruiter ID or user is not a Recruiter." }, { status: 400 });
         }
      }
      const updateResult = await client.query(
        'UPDATE "candidates" SET "recruiterId" = $1, "updatedAt" = NOW() WHERE id = ANY($2::uuid[]) RETURNING id',
        [newRecruiterId, candidateIds]
      );
      successCount = updateResult.rowCount ?? 0;
      const updatedIds = updateResult.rows.map((r: { id: string }) => r.id);
      failCount = candidateIds.length - successCount;
       candidateIds.forEach(id => {
        if (!updatedIds.includes(id)) {
          failedDetails.push({ candidateId: id, reason: "Candidate not found or failed to update."});
        }
      });
    }

    await client.query('COMMIT');
    await logAudit('AUDIT', `Bulk candidate action '${action}' performed by ${actingUserName}. Success: ${successCount}, Fail: ${failCount}. Target IDs: ${candidateIds.join(', ')}.`, 'API:Candidates:BulkAction', actingUserId, { action, successCount, failCount, candidateIds, failedDetails: failCount > 0 ? failedDetails : undefined, newStatus: newStatus, newRecruiterId: newRecruiterId, notes: notes });
    
    return NextResponse.json({ 
      message: `Bulk action '${action}' processed. Success: ${successCount}, Failed: ${failCount}.`,
      successCount,
      failCount,
      failedDetails: failCount > 0 ? failedDetails : undefined,
    }, { status: 200 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to perform bulk candidate action '${action}':`, error);
    await logAudit('ERROR', `Failed bulk candidate action '${action}' by ${actingUserName}. Error: ${error.message}`, 'API:Candidates:BulkAction', actingUserId, { action, candidateIds, error: error.message });
    return NextResponse.json({ message: `Error during bulk action: ${error.message}`, error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
