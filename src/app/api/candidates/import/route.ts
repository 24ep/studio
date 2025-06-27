// src/app/api/candidates/import/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import type { CandidateStatus, CandidateDetails, PersonalInfo, ContactInfo } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { authOptions } from '@/lib/auth';
// For actual Excel parsing, you would uncomment and use a library like 'xlsx'
// import * as XLSX from 'xlsx';

export const dynamic = "force-dynamic";

// Core statuses for fallback, full list comes from DB
const coreCandidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];

// Zod schema for candidate import
const importCandidateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  recruiterId: z.string().uuid().optional().nullable(),
  fitScore: z.number().min(0).max(100).optional(),
  status: z.string().min(1),
  parsedData: z.any().optional().nullable(),
  custom_attributes: z.any().optional().nullable(),
  resumePath: z.string().optional().nullable(),
  // Add other fields as needed
});

// Schema for array of candidates
const importCandidatesArraySchema = z.array(importCandidateSchema);

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
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const actingUserId = session?.user?.id;
  const actingUserName = session?.user?.name || session?.user?.email || 'System';

  if (!actingUserId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to import candidates
  if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CANDIDATES_IMPORT')) {
    await logAudit('WARN', `Forbidden attempt to import candidates by ${actingUserName}.`, 'API:Candidates:Import', actingUserId);
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions to import candidates' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const validationResult = importCandidatesArraySchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
  }

  const candidates = validationResult.data;

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const candidate of candidates) {
      try {
        // Check if candidate already exists
        const existingResult = await client.query('SELECT id FROM "Candidate" WHERE email = $1', [candidate.email]);
        if (existingResult.rows.length > 0) {
          results.failed++;
          results.errors.push(`Candidate with email ${candidate.email} already exists`);
          continue;
        }

        // Insert candidate
        const insertQuery = `
          INSERT INTO "Candidate" (id, name, email, phone, "positionId", "recruiterId", "fitScore", status, "parsedData", "customAttributes", "resumePath", "applicationDate", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
          RETURNING *;
        `;
        const candidateId = uuidv4();
        await client.query(insertQuery, [
          candidateId, candidate.name, candidate.email, candidate.phone, candidate.positionId, 
          candidate.recruiterId, candidate.fitScore, candidate.status, candidate.parsedData, 
          candidate.custom_attributes, candidate.resumePath
        ]);

        // Create initial transition record
        const insertTransitionQuery = `
          INSERT INTO "TransitionRecord" (id, "candidateId", "positionId", stage, notes, "actingUserId", date)
          VALUES ($1, $2, $3, $4, $5, $6, NOW());
        `;
        await client.query(insertTransitionQuery, [
          uuidv4(), candidateId, candidate.positionId, candidate.status, 'Imported via bulk import', actingUserId
        ]);

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Failed to import ${candidate.email}: ${error.message}`);
      }
    }

    await client.query('COMMIT');
    await logAudit('AUDIT', `Bulk import completed by ${actingUserName}. Success: ${results.success}, Failed: ${results.failed}`, 'API:Candidates:Import', actingUserId, { results });

    return NextResponse.json({
      message: 'Import completed',
      ...results
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    await logAudit('ERROR', `Bulk import failed. Error: ${error.message}`, 'API:Candidates:Import', actingUserId, { input: body });
    return NextResponse.json({ message: 'Error during import', error: error.message }, { status: 500 });
  } finally {
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
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Check if user has permission to view candidates
  if (session.user.role !== 'Admin' && !session.user.modulePermissions?.includes('CANDIDATES_VIEW')) {
    await logAudit('WARN', `Forbidden attempt to view imported candidates by ${session.user.name || session.user.email}.`, 'API:Candidates:Import:Get', session.user.id);
    return NextResponse.json({ message: 'Forbidden: Insufficient permissions to view candidates' }, { status: 403 });
  }

  const client = await getPool().connect();
  try {
    const candidatesQuery = `
      SELECT * FROM "Candidate"
      ORDER BY "applicationDate" DESC;
    `;
    const candidatesResult = await client.query(candidatesQuery);
    return NextResponse.json({
      data: candidatesResult.rows
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Error fetching candidates', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

    