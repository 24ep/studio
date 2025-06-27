// src/app/api/candidates/bulk-action/route.ts
import { NextResponse } from 'next/server';
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
/**
 * @openapi
 * /api/candidates/bulk-action:
 *   post:
 *     summary: Perform a bulk action on candidates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [delete, change_status, assign_recruiter]
 *               candidateIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               newStatus:
 *                 type: string
 *                 nullable: true
 *               newRecruiterId:
 *                 type: string
 *                 nullable: true
 *               notes:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Bulk action result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 successCount:
 *                   type: integer
 *                 failCount:
 *                   type: integer
 *                 failedDetails:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       candidateId:
 *                         type: string
 *                       reason:
 *                         type: string
 */
export async function POST(request) {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    const actingUserName = session?.user?.name || session?.user?.email || 'System';
    if (!actingUserId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    // Check if user has permission to manage candidates
    if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CANDIDATES_MANAGE')) {
        await logAudit('WARN', `Forbidden attempt to perform bulk candidate action by ${actingUserName}.`, 'API:Candidates:BulkAction', actingUserId);
        return NextResponse.json({ message: 'Forbidden: Insufficient permissions to perform bulk candidate actions' }, { status: 403 });
    }
    let body;
    try {
        body = await request.json();
    }
    catch {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    const validationResult = bulkActionSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const { action, candidateIds, newStatus, newRecruiterId } = validationResult.data;
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        let result;
        let auditMessage = '';
        switch (action) {
            case 'delete':
                const deleteResult = await client.query('DELETE FROM "Candidate" WHERE id = ANY($1::uuid[]) RETURNING id', [candidateIds]);
                result = { deletedCount: deleteResult.rowCount };
                auditMessage = `Bulk deleted ${deleteResult.rowCount} candidates`;
                break;
            case 'change_status':
                const oldStatusesResult = await client.query('SELECT id, status FROM "Candidate" WHERE id = ANY($1::uuid[])', [candidateIds]);
                const oldStatuses = oldStatusesResult.rows;
                const updateStatusResult = await client.query('UPDATE "Candidate" SET status = $1, "updatedAt" = NOW() WHERE id = ANY($2::uuid[]) RETURNING id', [newStatus, candidateIds]);
                // Create transition records for status changes
                for (const candidate of oldStatuses) {
                    if (candidate.status !== newStatus) {
                        await client.query('INSERT INTO "TransitionRecord" (id, "candidateId", stage, notes, "actingUserId", date) VALUES ($1, $2, $3, $4, $5, NOW())', [uuidv4(), candidate.id, newStatus, `Bulk status change from ${candidate.status} to ${newStatus}`, actingUserId]);
                    }
                }
                result = { updatedCount: updateStatusResult.rowCount };
                auditMessage = `Bulk updated status to ${newStatus} for ${updateStatusResult.rowCount} candidates`;
                break;
            case 'assign_recruiter':
                if (!newRecruiterId) {
                    throw new Error('Recruiter ID is required for assign_recruiter action');
                }
                // Verify recruiter exists and has recruiter role
                const recruiterCheck = await client.query('SELECT id FROM "User" WHERE id = $1 AND role = $2', [newRecruiterId, 'Recruiter']);
                if (recruiterCheck.rows.length === 0) {
                    throw new Error('Invalid recruiter ID or user is not a recruiter');
                }
                const assignRecruiterResult = await client.query('UPDATE "Candidate" SET "recruiterId" = $1, "updatedAt" = NOW() WHERE id = ANY($2::uuid[]) RETURNING id', [newRecruiterId, candidateIds]);
                result = { updatedCount: assignRecruiterResult.rowCount };
                auditMessage = `Bulk assigned recruiter for ${assignRecruiterResult.rowCount} candidates`;
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }
        await client.query('COMMIT');
        await logAudit('AUDIT', `${auditMessage} by ${actingUserName}.`, 'API:Candidates:BulkAction', actingUserId, {
            action,
            candidateIds,
            result
        });
        return NextResponse.json({
            message: 'Bulk action completed successfully',
            ...result
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        await logAudit('ERROR', `Bulk action failed. Error: ${error.message}`, 'API:Candidates:BulkAction', actingUserId, {
            action,
            candidateIds,
            input: body
        });
        return NextResponse.json({ message: 'Error performing bulk action', error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
