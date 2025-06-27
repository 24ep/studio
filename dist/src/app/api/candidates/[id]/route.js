// src/app/api/candidates/[id]/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
export const dynamic = "force-dynamic";
/**
 * @openapi
 * /api/candidates/{id}:
 *   get:
 *     summary: Get a candidate by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidate details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       404:
 *         description: Candidate not found
 *   put:
 *     summary: Update a candidate by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Candidate'
 *     responses:
 *       200:
 *         description: Candidate updated
 *   delete:
 *     summary: Delete a candidate by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Candidate deleted
 *       404:
 *         description: Candidate not found
 */
// Define Zod schemas for validation...
const updateCandidateSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional().nullable(),
    positionId: z.string().uuid().nullable().optional(),
    recruiterId: z.string().uuid().nullable().optional(),
    fitScore: z.number().min(0).max(100).optional(),
    status: z.string().min(1).optional(),
    parsedData: z.record(z.any()).optional().nullable(),
    custom_attributes: z.record(z.any()).optional().nullable(),
    resumePath: z.string().optional().nullable(),
    transitionNotes: z.string().optional().nullable(),
});
function extractIdFromUrl(request) {
    const match = request.nextUrl.pathname.match(/\/candidates\/([^/]+)/);
    return match ? match[1] : null;
}
export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const client = await getPool().connect();
    try {
        // Get candidate with position and recruiter info
        const candidateQuery = `
      SELECT c.*, p.title as "positionTitle", p.department as "positionDepartment", r.name as "recruiterName"
      FROM "Candidate" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
      LEFT JOIN "User" r ON c."recruiterId" = r.id
      WHERE c.id = $1;
    `;
        const candidateResult = await client.query(candidateQuery, [id]);
        if (candidateResult.rows.length === 0) {
            return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
        }
        const candidate = candidateResult.rows[0];
        // Get job matches for this candidate
        const jobMatchesQuery = `
      SELECT jm.*, p.title as "positionTitle"
      FROM "JobMatch" jm
      LEFT JOIN "Position" p ON jm."jobId" = p.id
      WHERE jm."candidateId" = $1
      ORDER BY jm."fitScore" DESC;
    `;
        const jobMatchesResult = await client.query(jobMatchesQuery, [id]);
        // Get resume history for this candidate
        const resumeHistoryQuery = `
      SELECT rh.*, u.name as "uploadedByUserName"
      FROM "ResumeHistory" rh
      LEFT JOIN "User" u ON rh."uploadedByUserId" = u.id
      WHERE rh."candidateId" = $1
      ORDER BY rh."uploadedAt" DESC;
    `;
        const resumeHistoryResult = await client.query(resumeHistoryQuery, [id]);
        return NextResponse.json({
            ...candidate,
            custom_attributes: candidate.customAttributes || {},
            position: candidate.positionId ? {
                title: candidate.positionTitle,
                department: candidate.positionDepartment
            } : null,
            recruiter: candidate.recruiterId ? { name: candidate.recruiterName } : null,
            jobMatches: jobMatchesResult.rows,
            resumeHistory: resumeHistoryResult.rows,
        });
    }
    catch (error) {
        return NextResponse.json({ message: 'Error fetching candidate', error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    const actingUserName = session?.user?.name || session?.user?.email || 'System';
    if (!actingUserId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    let body;
    try {
        body = await request.json();
    }
    catch {
        return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }
    const validationResult = updateCandidateSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const { name, email, phone, positionId, recruiterId, fitScore, status, parsedData, custom_attributes, resumePath } = validationResult.data;
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        // Check if candidate exists
        const existingResult = await client.query('SELECT * FROM "Candidate" WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
        }
        const existingCandidate = existingResult.rows[0];
        const oldStatus = existingCandidate.status;
        // Update candidate
        const updateQuery = `
      UPDATE "Candidate" 
      SET name = $1, email = $2, phone = $3, "positionId" = $4, "recruiterId" = $5, 
          "fitScore" = $6, status = $7, "parsedData" = $8, "customAttributes" = $9, 
          "resumePath" = $10, "updatedAt" = NOW()
      WHERE id = $11
      RETURNING *;
    `;
        const updateResult = await client.query(updateQuery, [
            name, email, phone, positionId, recruiterId, fitScore, status, parsedData, custom_attributes, resumePath, id
        ]);
        // Create transition record if status changed
        if (oldStatus !== status) {
            const insertTransitionQuery = `
        INSERT INTO "TransitionRecord" (id, "candidateId", "positionId", stage, notes, "actingUserId", date)
        VALUES ($1, $2, $3, $4, $5, $6, NOW());
      `;
            await client.query(insertTransitionQuery, [
                uuidv4(), id, positionId, status, `Status changed from ${oldStatus} to ${status}`, actingUserId
            ]);
        }
        await client.query('COMMIT');
        await logAudit('AUDIT', `Candidate '${name}' updated by ${actingUserName}.`, 'API:Candidates:Update', actingUserId, { candidateId: id, oldStatus, newStatus: status });
        const updatedCandidate = updateResult.rows[0];
        return NextResponse.json({
            message: 'Candidate updated successfully',
            candidate: {
                ...updatedCandidate,
                custom_attributes: updatedCandidate.customAttributes || {},
            }
        });
    }
    catch (error) {
        await client.query('ROLLBACK');
        await logAudit('ERROR', `Failed to update candidate. Error: ${error.message}`, 'API:Candidates:Update', actingUserId, { candidateId: id, input: body });
        if (error.code === '23505' && error.constraint === 'Candidate_email_key') {
            return NextResponse.json({ message: `A candidate with the email "${email}" already exists.` }, { status: 409 });
        }
        return NextResponse.json({ message: 'Error updating candidate', error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id;
    const actingUserName = session?.user?.name || session?.user?.email || 'System';
    if (!actingUserId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        // Get candidate name for audit log
        const result = await client.query('DELETE FROM "Candidate" WHERE id = $1 RETURNING name', [id]);
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json({ message: 'Candidate not found' }, { status: 404 });
        }
        const candidateName = result.rows[0].name;
        await client.query('COMMIT');
        await logAudit('AUDIT', `Candidate '${candidateName}' deleted by ${actingUserName}.`, 'API:Candidates:Delete', actingUserId, { candidateId: id });
        return NextResponse.json({ message: 'Candidate deleted successfully' });
    }
    catch (error) {
        await client.query('ROLLBACK');
        await logAudit('ERROR', `Failed to delete candidate. Error: ${error.message}`, 'API:Candidates:Delete', actingUserId, { candidateId: id });
        return NextResponse.json({ message: 'Error deleting candidate', error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
