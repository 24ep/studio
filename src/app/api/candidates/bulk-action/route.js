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
    var _a, _b, _c, _d, _e, _f, _g;
    const session = await getServerSession(authOptions);
    const actingUserId = (_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id;
    const actingUserName = ((_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = session === null || session === void 0 ? void 0 : session.user) === null || _c === void 0 ? void 0 : _c.email) || 'System (Bulk Action)';
    if (!actingUserId || (session.user.role !== 'Admin' && !((_d = session.user.modulePermissions) === null || _d === void 0 ? void 0 : _d.includes('CANDIDATES_MANAGE')))) {
        await logAudit('WARN', `Forbidden attempt to perform bulk candidate action by ${actingUserName}.`, 'API:Candidates:BulkAction', actingUserId);
        return NextResponse.json({ message: "Forbidden: Insufficient permissions." }, { status: 403 });
    }
    let body;
    try {
        body = await request.json();
    }
    catch (error) {
        return NextResponse.json({ message: "Error parsing request body", error: error.message }, { status: 400 });
    }
    const validationResult = bulkActionSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: "Invalid input for bulk action.", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const { action, candidateIds, newStatus, newRecruiterId, notes } = validationResult.data;
    const client = await getPool().connect();
    let successCount = 0;
    let failCount = 0;
    const failedDetails = [];
    try {
        await client.query('BEGIN');
        if (action === 'delete') {
            await client.query('DELETE FROM "ResumeHistory" WHERE "candidateId" = ANY($1::uuid[])', [candidateIds]);
            await client.query('DELETE FROM "TransitionRecord" WHERE "candidateId" = ANY($1::uuid[])', [candidateIds]);
            const deleteResult = await client.query('DELETE FROM "candidates" WHERE id = ANY($1::uuid[]) RETURNING id', [candidateIds]);
            successCount = (_e = deleteResult.rowCount) !== null && _e !== void 0 ? _e : 0;
            const deletedIds = deleteResult.rows.map((r) => r.id);
            failCount = candidateIds.length - successCount;
            candidateIds.forEach(id => {
                if (!deletedIds.includes(id)) {
                    failedDetails.push({ candidateId: id, reason: "Candidate not found or already deleted." });
                }
            });
        }
        else if (action === 'change_status') {
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
            const oldStatusesMap = new Map(oldStatusesResult.rows.map((r) => [r.id, r.status]));
            const updateResult = await client.query('UPDATE "candidates" SET status = $1, "updatedAt" = NOW() WHERE id = ANY($2::uuid[]) RETURNING id, name', [newStatus, candidateIds]);
            successCount = (_f = updateResult.rowCount) !== null && _f !== void 0 ? _f : 0;
            const updatedIds = updateResult.rows.map((r) => r.id);
            failCount = candidateIds.length - successCount;
            candidateIds.forEach(id => {
                if (!updatedIds.includes(id)) {
                    failedDetails.push({ candidateId: id, reason: "Candidate not found or failed to update." });
                }
            });
            const transitionNotes = notes || `Bulk status change to ${newStatus} by ${actingUserName}.`;
            for (const updatedRow of updateResult.rows) {
                const oldStatusForCandidate = oldStatusesMap.get(updatedRow.id) || 'Unknown';
                if (newStatus !== oldStatusForCandidate) {
                    await client.query('INSERT INTO "TransitionRecord" (id, "candidateId", date, stage, notes, "actingUserId", "createdAt", "updatedAt") VALUES ($1, $2, NOW(), $3, $4, $5, NOW(), NOW())', [uuidv4(), updatedRow.id, newStatus, transitionNotes, actingUserId]);
                }
            }
        }
        else if (action === 'assign_recruiter') {
            if (newRecruiterId) {
                const recruiterCheck = await client.query('SELECT id FROM "User" WHERE id = $1 AND role = $2', [newRecruiterId, 'Recruiter']);
                if (recruiterCheck.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return NextResponse.json({ message: "Invalid recruiter ID or user is not a Recruiter." }, { status: 400 });
                }
            }
            const updateResult = await client.query('UPDATE "candidates" SET "recruiterId" = $1, "updatedAt" = NOW() WHERE id = ANY($2::uuid[]) RETURNING id', [newRecruiterId, candidateIds]);
            successCount = (_g = updateResult.rowCount) !== null && _g !== void 0 ? _g : 0;
            const updatedIds = updateResult.rows.map((r) => r.id);
            failCount = candidateIds.length - successCount;
            candidateIds.forEach(id => {
                if (!updatedIds.includes(id)) {
                    failedDetails.push({ candidateId: id, reason: "Candidate not found or failed to update." });
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error(`Failed to perform bulk candidate action '${action}':`, error);
        await logAudit('ERROR', `Failed bulk candidate action '${action}' by ${actingUserName}. Error: ${error.message}`, 'API:Candidates:BulkAction', actingUserId, { action, candidateIds, error: error.message });
        return NextResponse.json({ message: `Error during bulk action: ${error.message}`, error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
