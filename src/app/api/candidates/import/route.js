// src/app/api/candidates/import/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from '@/lib/auditLog';
import { authOptions } from '@/lib/auth';
// For actual Excel parsing, you would uncomment and use a library like 'xlsx'
// import * as XLSX from 'xlsx';
export const dynamic = "force-dynamic";
// Core statuses for fallback, full list comes from DB
const coreCandidateStatusValues = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];
// Zod schema for candidate import
const importCandidateSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("A valid email is required"),
    phone: z.string().optional().nullable(),
    positionId: z.string().uuid().optional().nullable(),
    recruiterId: z.string().uuid().optional().nullable(),
    fitScore: z.number().min(0).max(100).optional(),
    status: z.string().min(1),
    // Add other fields as needed
});
// The overall input for the API is now a single file, not an array of candidates
// The validation below will apply to each row extracted from the Excel file.
/**
 * @openapi
 * /api/candidates/import:
 *   get:
 *     summary: Get all imported candidates
 *     responses:
 *       200:
 *         description: List of imported candidates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Candidate'
 *   post:
 *     summary: Bulk import candidates
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Candidate'
 *     responses:
 *       201:
 *         description: Import completed
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
 */
export async function POST(request) {
    var _a;
    const session = await getServerSession(authOptions);
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    let body;
    try {
        body = await request.json();
    }
    catch (_b) {
        return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }
    if (!Array.isArray(body)) {
        return NextResponse.json({ message: "Expected an array of candidates" }, { status: 400 });
    }
    const client = await getPool().connect();
    const results = [];
    try {
        await client.query('BEGIN');
        for (const item of body) {
            const validationResult = importCandidateSchema.safeParse(item);
            if (!validationResult.success) {
                results.push({ error: validationResult.error.flatten().fieldErrors, item });
                continue;
            }
            const { name, email, phone, positionId, recruiterId, fitScore, status } = validationResult.data;
            const newCandidateId = uuidv4();
            try {
                const insertQuery = `
          INSERT INTO "candidates" (id, name, email, phone, "positionId", "recruiterId", "fitScore", status, "applicationDate", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING *;
        `;
                const result = await client.query(insertQuery, [
                    newCandidateId, name, email, phone, positionId, recruiterId, fitScore, status
                ]);
                results.push({ success: true, candidate: result.rows[0] });
            }
            catch (error) {
                results.push({ error: error.message, item });
            }
        }
        await client.query('COMMIT');
        await logAudit('AUDIT', `Bulk candidate import by ${session.user.email || session.user.id}. Success: ${results.filter(r => r.success).length}, Fail: ${results.filter(r => r.error).length}.`, 'API:Candidates:Import', session.user.id, { results });
        return NextResponse.json({ message: "Import completed", results }, { status: 201 });
    }
    catch (error) {
        await client.query('ROLLBACK');
        await logAudit('ERROR', `Bulk candidate import failed by ${session.user.email || session.user.id}. Error: ${error.message}`, 'API:Candidates:Import', session.user.id, { error: error.message });
        return NextResponse.json({ message: 'Error importing candidates', error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
/**
 * @openapi
 * /api/candidates/import:
 *   get:
 *     summary: Get all imported candidates
 *     description: Returns all imported candidates. Requires authentication.
 *     responses:
 *       200:
 *         description: List of imported candidates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Candidate'
 */
export async function GET(request) {
    var _a;
    const session = await getServerSession(authOptions);
    if (!((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.id)) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const client = await getPool().connect();
    try {
        const candidatesQuery = `
      SELECT * FROM "candidates"
      ORDER BY "applicationDate" DESC;
    `;
        const candidatesResult = await client.query(candidatesQuery);
        return NextResponse.json({
            data: candidatesResult.rows
        }, { status: 200 });
    }
    catch (error) {
        return NextResponse.json({ message: 'Error fetching candidates', error: error.message }, { status: 500 });
    }
    finally {
        client.release();
    }
}
