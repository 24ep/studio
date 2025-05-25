
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../lib/db';
import type { CandidateStatus, ParsedResumeData, Candidate } from '@/lib/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const candidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];

const createCandidateSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid({ message: "Valid Position ID (UUID) is required" }),
  fitScore: z.number().min(0).max(100).optional().default(0),
  status: z.enum(candidateStatusValues).optional().default('Applied'),
  applicationDate: z.string().datetime({ message: "Invalid datetime string. Must be UTC ISO8601" }).optional(),
  parsedData: z.object({
    education: z.array(z.string()).optional().default([]),
    skills: z.array(z.string()).optional().default([]),
    experienceYears: z.number().int().min(0).optional().default(0),
    summary: z.string().optional().default(''),
  }).optional().default({ education: [], skills: [], experienceYears: 0, summary: '' }),
  resumePath: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const positionId = searchParams.get('positionId');
    const minFitScoreParam = searchParams.get('minFitScore');
    const maxFitScoreParam = searchParams.get('maxFitScore');

    let query = `
      SELECT 
        c.*, 
        p.title as "positionTitle", 
        p.department as "positionDepartment",
        COALESCE(
          (SELECT json_agg(th.* ORDER BY th.date DESC) FROM "TransitionRecord" th WHERE th."candidateId" = c.id), 
          '[]'::json
        ) as "transitionHistory"
      FROM "Candidate" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
    `;
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (name) {
      conditions.push(`c.name ILIKE $${paramIndex++}`);
      queryParams.push(`%${name}%`);
    }
    if (positionId) {
      conditions.push(`c."positionId" = $${paramIndex++}`);
      queryParams.push(positionId);
    }
    if (minFitScoreParam) {
      const minFitScore = parseInt(minFitScoreParam, 10);
      if (!isNaN(minFitScore)) {
        conditions.push(`c."fitScore" >= $${paramIndex++}`);
        queryParams.push(minFitScore);
      }
    }
    if (maxFitScoreParam) {
      const maxFitScore = parseInt(maxFitScoreParam, 10);
      if (!isNaN(maxFitScore)) {
        conditions.push(`c."fitScore" <= $${paramIndex++}`);
        queryParams.push(maxFitScore);
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY c."createdAt" DESC';

    const result = await pool.query(query, queryParams);
    
    const candidates = result.rows.map(row => ({
        ...row,
        parsedData: row.parsedData || { education: [], skills: [], experienceYears: 0, summary: '' }, // Ensure parsedData is not null
        position: { // Reconstruct position object for consistency with Prisma's include
            id: row.positionId,
            title: row.positionTitle,
            department: row.positionDepartment,
            // Add other position fields if needed and fetched
        },
        // transitionHistory is already fetched as JSON array string and parsed by pg
    }));

    return NextResponse.json(candidates, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    return NextResponse.json({ message: "Error fetching candidates", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }
  
  const validationResult = createCandidateSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const validatedData = validationResult.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const positionCheckQuery = 'SELECT id FROM "Position" WHERE id = $1';
    const positionResult = await client.query(positionCheckQuery, [validatedData.positionId]);
    if (positionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Position not found" }, { status: 404 });
    }

    const insertCandidateQuery = `
      INSERT INTO "Candidate" (name, email, phone, "positionId", "fitScore", status, "applicationDate", "parsedData", "resumePath", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *;
    `;
    const candidateValues = [
      validatedData.name,
      validatedData.email,
      validatedData.phone,
      validatedData.positionId,
      validatedData.fitScore,
      validatedData.status,
      validatedData.applicationDate ? new Date(validatedData.applicationDate) : new Date(),
      validatedData.parsedData,
      validatedData.resumePath,
    ];
    const candidateResult = await client.query(insertCandidateQuery, candidateValues);
    const newCandidate = candidateResult.rows[0];

    const insertTransitionQuery = `
      INSERT INTO "TransitionRecord" ("candidateId", date, stage, notes, "createdAt", "updatedAt")
      VALUES ($1, NOW(), $2, $3, NOW(), NOW())
      RETURNING *;
    `;
    const transitionValues = [
      newCandidate.id,
      validatedData.status,
      'Application received.',
    ];
    const transitionResult = await client.query(insertTransitionQuery, transitionValues);
    
    await client.query('COMMIT');

    // Fetch the newly created candidate with its position and transition history for the response
    const finalQuery = `
        SELECT 
            c.*, 
            p.title as "positionTitle", 
            p.department as "positionDepartment",
            (SELECT json_agg(th.* ORDER BY th.date DESC) FROM "TransitionRecord" th WHERE th."candidateId" = c.id) as "transitionHistory"
        FROM "Candidate" c
        LEFT JOIN "Position" p ON c."positionId" = p.id
        WHERE c.id = $1;
    `;
    const finalResult = await pool.query(finalQuery, [newCandidate.id]);
    const createdCandidateWithDetails = {
        ...finalResult.rows[0],
        parsedData: finalResult.rows[0].parsedData || { education: [], skills: [], experienceYears: 0, summary: '' },
        position: {
            id: finalResult.rows[0].positionId,
            title: finalResult.rows[0].positionTitle,
            department: finalResult.rows[0].positionDepartment,
        },
    };
    
    return NextResponse.json(createdCandidateWithDetails, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to create candidate:", error);
    if (error.code === '23505' && error.constraint === 'Candidate_email_key') { // Example for unique constraint
      return NextResponse.json({ message: "A candidate with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error creating candidate", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
