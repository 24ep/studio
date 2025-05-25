
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../lib/db';
import type { CandidateStatus, CandidateDetails, OldParsedResumeData, UserProfile } from '@/lib/types'; 
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';

const candidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];

const personalInfoSchema = z.object({
  title_honorific: z.string().optional(),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  nickname: z.string().optional(),
  location: z.string().optional(),
  introduction_aboutme: z.string().optional(),
});

const contactInfoSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

const educationEntrySchema = z.object({
  major: z.string().optional(),
  field: z.string().optional(),
  period: z.string().optional(),
  duration: z.string().optional(),
  GPA: z.string().optional(),
  university: z.string().optional(),
  campus: z.string().optional(),
});

const experienceEntrySchema = z.object({
  company: z.string().optional(),
  position: z.string().optional(),
  description: z.string().optional(),
  period: z.string().optional(),
  duration: z.string().optional(),
  is_current_position: z.boolean().optional(),
  postition_level: z.enum(['entry level', 'mid level', 'senior level', 'lead', 'manager', 'executive']).optional(),
});

const skillEntrySchema = z.object({
  segment_skill: z.string().optional(),
  skill: z.array(z.string()).optional(),
});

const jobSuitableEntrySchema = z.object({
  suitable_career: z.string().optional(),
  suitable_job_position: z.string().optional(),
  suitable_job_level: z.string().optional(),
  suitable_salary_bath_month: z.string().optional(),
});

const candidateDetailsSchema = z.object({
  cv_language: z.string().optional().default(''),
  personal_info: personalInfoSchema,
  contact_info: contactInfoSchema,
  education: z.array(educationEntrySchema).optional().default([]),
  experience: z.array(experienceEntrySchema).optional().default([]),
  skills: z.array(skillEntrySchema).optional().default([]),
  job_suitable: z.array(jobSuitableEntrySchema).optional().default([]),
});

const createCandidateSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid({ message: "Valid Position ID (UUID) is required" }).nullable(),
  fitScore: z.number().min(0).max(100).optional().default(0),
  status: z.enum(candidateStatusValues).optional().default('Applied'),
  applicationDate: z.string().datetime({ message: "Invalid datetime string. Must be UTC ISO8601" }).optional(),
  parsedData: candidateDetailsSchema.optional(),
  resumePath: z.string().optional().nullable(),
});


export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (!userRole || !['Admin', 'Recruiter', 'Hiring Manager'].includes(userRole)) {
    await logAudit('WARN', `Forbidden attempt to list candidates by ${session.user.name} (ID: ${session.user.id}). Required roles: Admin, Recruiter, Hiring Manager.`, 'API:Candidates', session.user.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
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
        parsedData: row.parsedData || { personal_info: {}, contact_info: {} }, 
        position: row.positionId ? { 
            id: row.positionId,
            title: row.positionTitle,
            department: row.positionDepartment,
        } : null,
    }));

    return NextResponse.json(candidates, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    await logAudit('ERROR', `Failed to fetch candidates. Error: ${(error as Error).message}`, 'API:Candidates', session?.user?.id);
    return NextResponse.json({ message: "Error fetching candidates", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (!userRole || !['Admin', 'Recruiter'].includes(userRole)) {
    await logAudit('WARN', `Forbidden attempt to create candidate by ${session.user.name} (ID: ${session.user.id}). Required roles: Admin, Recruiter.`, 'API:Candidates', session.user.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions to create candidates" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Error parsing request body for new candidate:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }
  
  const validationResult = createCandidateSchema.safeParse(body);
  if (!validationResult.success) {
    console.error("Validation failed for new candidate:", validationResult.error.flatten().fieldErrors);
    return NextResponse.json(
      { message: "Invalid input", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const rawData = validationResult.data;
  
  const candidateName = rawData.name || (rawData.parsedData ? `${rawData.parsedData.personal_info.firstname} ${rawData.parsedData.personal_info.lastname}`.trim() : 'Unknown Candidate');
  const candidateEmail = rawData.email || (rawData.parsedData ? rawData.parsedData.contact_info.email : '');
  const candidatePhone = rawData.phone || (rawData.parsedData ? rawData.parsedData.contact_info.phone : null);

  if (!candidateEmail) {
     return NextResponse.json(
      { message: "Invalid input", errors: { email: ["Email is required either at top level or in parsedData.contact_info"]}},
      { status: 400 }
    );
  }
  
  const finalParsedData = rawData.parsedData || {
    personal_info: { firstname: candidateName.split(' ')[0] || '', lastname: candidateName.split(' ').slice(1).join(' ') || '' },
    contact_info: { email: candidateEmail, phone: candidatePhone || undefined },
  };

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (rawData.positionId) {
        const positionCheckQuery = 'SELECT id FROM "Position" WHERE id = $1';
        const positionResult = await client.query(positionCheckQuery, [rawData.positionId]);
        if (positionResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ message: "Position not found" }, { status: 404 });
        }
    }

    const insertCandidateQuery = `
      INSERT INTO "Candidate" (name, email, phone, "positionId", "fitScore", status, "applicationDate", "parsedData", "resumePath", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *;
    `;
    const candidateValues = [
      candidateName,
      candidateEmail,
      candidatePhone,
      rawData.positionId,
      rawData.fitScore,
      rawData.status,
      rawData.applicationDate ? new Date(rawData.applicationDate) : new Date(),
      finalParsedData, 
      rawData.resumePath,
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
      rawData.status,
      'Application received.',
    ];
    await client.query(insertTransitionQuery, transitionValues);
    
    await client.query('COMMIT');

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
        parsedData: finalResult.rows[0].parsedData || { personal_info: {}, contact_info: {} },
        position: finalResult.rows[0].positionId ? {
            id: finalResult.rows[0].positionId,
            title: finalResult.rows[0].positionTitle,
            department: finalResult.rows[0].positionDepartment,
        } : null,
    };
    
    await logAudit('AUDIT', `Candidate '${newCandidate.name}' (ID: ${newCandidate.id}) created by ${session.user.name} (ID: ${session.user.id}).`, 'API:Candidates', session.user.id, { targetCandidateId: newCandidate.id, name: newCandidate.name, email: newCandidate.email });
    return NextResponse.json(createdCandidateWithDetails, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to create candidate:", error);
    await logAudit('ERROR', `Failed to create candidate '${candidateName}'. Error: ${error.message}`, 'API:Candidates', session.user.id, { name: candidateName, email: candidateEmail });
    if (error.code === '23505' && error.constraint === 'Candidate_email_key') {
      return NextResponse.json({ message: "A candidate with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error creating candidate", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
