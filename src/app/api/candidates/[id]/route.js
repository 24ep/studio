var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
export async function GET(request) {
    var _a, _b;
    const id = extractIdFromUrl(request);
    const session = await getServerSession(authOptions);
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const client = await getPool().connect();
    try {
        const query = `
      SELECT 
        c.*, 
        p.title as "positionTitle", 
        r.name as "recruiterName"
      FROM "candidates" c
      LEFT JOIN "positions" p ON c."positionId" = p.id
      LEFT JOIN "User" r ON c."recruiterId" = r.id
      WHERE c.id = $1;
    `;
        const result = await client.query(query, [id]);
        if (result.rows.length === 0) {
            return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
        }
        const candidate = result.rows[0];
        const historyQuery = `
      SELECT th.*, u.name as "actingUserName"
      FROM "TransitionRecord" th
      LEFT JOIN "User" u ON th."actingUserId" = u.id
      WHERE th."candidateId" = $1
      ORDER BY th.date DESC;
    `;
        const historyResult = await client.query(historyQuery, [id]);
        candidate.transitionHistory = historyResult.rows;
        candidate.custom_attributes = candidate.customAttributes || {};
        return NextResponse.json(candidate, { status: 200 });
    }
    catch (error) {
        console.error(`Failed to fetch candidate ${id}:`, error);
        await logAudit('ERROR', `Failed to fetch candidate (ID: ${id}). Error: ${error.message}`, 'API:Candidates:GetById', (_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.id, { targetCandidateId: id });
        return NextResponse.json({ message: "Error fetching candidate", error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
export async function PUT(request) {
    var _a, _b, _c;
    const id = extractIdFromUrl(request);
    const session = await getServerSession(authOptions);
    const actingUserId = (_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id;
    const actingUserName = ((_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = session === null || session === void 0 ? void 0 : session.user) === null || _c === void 0 ? void 0 : _c.email) || 'System (API Update)';
    if (!actingUserId) {
        return NextResponse.json({ message: "Forbidden: Insufficient permissions." }, { status: 403 });
    }
    let body;
    try {
        body = await request.json();
    }
    catch (error) {
        return NextResponse.json({ message: "Error parsing request body", error: error.message }, { status: 400 });
    }
    const validationResult = updateCandidateSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: "Invalid input", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }
    const _d = validationResult.data, { transitionNotes } = _d, updateData = __rest(_d, ["transitionNotes"]);
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const existingResult = await client.query('SELECT * FROM "candidates" WHERE id = $1', [id]);
        if (existingResult.rows.length === 0) {
            return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
        }
        const existingCandidate = existingResult.rows[0];
        if (updateData.status && updateData.status !== existingCandidate.status) {
            const insertTransitionQuery = `
        INSERT INTO "TransitionRecord" (id, "candidateId", "positionId", stage, notes, "actingUserId", date)
        VALUES ($1, $2, $3, $4, $5, $6, NOW());
      `;
            await client.query(insertTransitionQuery, [
                uuidv4(), id, existingCandidate.positionId, updateData.status, transitionNotes || `Status changed from ${existingCandidate.status} to ${updateData.status}.`, actingUserId
            ]);
        }
        const fieldsToUpdate = Object.keys(updateData).filter(key => key !== 'transitionNotes');
        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ message: "No fields to update." }, { status: 400 });
        }
        const setClauses = fieldsToUpdate.map((key, index) => {
            if (key === 'custom_attributes') {
                return `"customAttributes" = $${index + 1}`;
            }
            return `"${key}" = $${index + 1}`;
        });
        const queryParams = fieldsToUpdate.map(key => updateData[key]);
        const updateQuery = `
      UPDATE "candidates"
      SET ${setClauses.join(', ')}, "updatedAt" = NOW()
      WHERE id = $${fieldsToUpdate.length + 1}
      RETURNING *;
    `;
        const updatedResult = await client.query(updateQuery, [...queryParams, id]);
        const updatedCandidate = Object.assign(Object.assign({}, updatedResult.rows[0]), { custom_attributes: updatedResult.rows[0].customAttributes || {} });
        await client.query('COMMIT');
        await logAudit('AUDIT', `Candidate '${updatedCandidate.name}' (ID: ${id}) was updated by ${actingUserName}.`, 'API:Candidates:Update', actingUserId, { targetCandidateId: id, changes: updateData });
        return NextResponse.json({ message: "Candidate updated successfully", candidate: updatedCandidate }, { status: 200 });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error(`Failed to update candidate ${id}:`, error);
        await logAudit('ERROR', `Failed to update candidate (ID: ${id}). Error: ${error.message}`, 'API:Candidates:Update', actingUserId, { targetCandidateId: id, input: body });
        return NextResponse.json({ message: "Error updating candidate", error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
export async function DELETE(request) {
    var _a, _b, _c;
    const id = extractIdFromUrl(request);
    const session = await getServerSession(authOptions);
    const actingUserId = (_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id;
    const actingUserName = ((_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.name) || ((_c = session === null || session === void 0 ? void 0 : session.user) === null || _c === void 0 ? void 0 : _c.email) || 'System';
    if (!actingUserId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    const client = await getPool().connect();
    try {
        const result = await client.query('DELETE FROM "candidates" WHERE id = $1 RETURNING name', [id]);
        if (result.rowCount === 0) {
            return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
        }
        const candidateName = result.rows[0].name;
        await logAudit('AUDIT', `Candidate '${candidateName}' (ID: ${id}) was deleted by ${actingUserName}.`, 'API:Candidates:Delete', actingUserId, { targetCandidateId: id });
        return NextResponse.json({ message: "Candidate deleted successfully" }, { status: 200 });
    }
    catch (error) {
        console.error(`Failed to delete candidate ${id}:`, error);
        await logAudit('ERROR', `Failed to delete candidate (ID: ${id}). Error: ${error.message}`, 'API:Candidates:Delete', actingUserId, { targetCandidateId: id });
        return NextResponse.json({ message: "Error deleting candidate", error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
