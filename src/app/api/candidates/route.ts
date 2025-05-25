
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../lib/db';
import type { CandidateStatus, CandidateDetails, OldParsedResumeData, UserProfile, Position } from '@/lib/types'; 
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { v4 as uuidv4 } from 'uuid';

const candidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];

const personalInfoSchema = z.object({
  title_honorific: z.string().optional().default(''),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  nickname: z.string().optional().default(''),
  location: z.string().optional().default(''),
  introduction_aboutme: z.string().optional().default(''),
});

const contactInfoSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().default(''),
});

const educationEntrySchema = z.object({
  major: z.string().optional().default(''),
  field: z.string().optional().default(''),
  period: z.string().optional().default(''),
  duration: z.string().optional().default(''),
  GPA: z.string().optional().default(''),
  university: z.string().optional().default(''),
  campus: z.string().optional().default(''),
});

const experienceEntrySchema = z.object({
  company: z.string().optional().default(''),
  position: z.string().optional().default(''),
  description: z.string().optional().default(''),
  period: z.string().optional().default(''),
  duration: z.string().optional().default(''),
  is_current_position: z.boolean().optional().default(false),
  postition_level: z.enum(['entry level', 'mid level', 'senior level', 'lead', 'manager', 'executive']).optional(),
});

const skillEntrySchema = z.object({
  segment_skill: z.string().optional().default(''),
  skill: z.array(z.string()).optional().default([]),
});

const jobSuitableEntrySchema = z.object({
  suitable_career: z.string().optional().default(''),
  suitable_job_position: z.string().optional().default(''),
  suitable_job_level: z.string().optional().default(''),
  suitable_salary_bath_month: z.string().optional().default(''), 
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
  name: z.string().min(1, { message: "Name is required" }).optional(), // Will be derived if not provided
  email: z.string().email({ message: "Invalid email address" }).optional(), // Will be derived if not provided
  phone: z.string().optional().nullable(), // Will be derived if not provided
  positionId: z.string().uuid({ message: "Valid Position ID (UUID) is required" }).nullable(),
  fitScore: z.number().min(0).max(100).optional().default(0),
  status: z.enum(candidateStatusValues).optional().default('Applied'),
  applicationDate: z.string().datetime({ message: "Invalid datetime string. Must be UTC ISO8601" }).optional(),
  // parsedData is now expected to be the detailed CandidateDetails structure
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
    const nameFilter = searchParams.get('name');
    const positionIdFilter = searchParams.get('positionId');
    const educationFilter = searchParams.get('education');
    const minFitScoreParam = searchParams.get('minFitScore');
    const maxFitScoreParam = searchParams.get('maxFitScore');

    let query = `
      SELECT 
        c.id, c.name, c.email, c.phone, c."resumePath", c."parsedData",
        c."positionId", c."fitScore", c.status, c."applicationDate",
        c."createdAt", c."updatedAt",
        p.title as "positionTitle", 
        p.department as "positionDepartment",
        COALESCE(
          (SELECT json_agg(tr.* ORDER BY tr.date DESC) 
           FROM "TransitionRecord" tr 
           WHERE tr."candidateId" = c.id), 
          '[]'::json
        ) as "transitionHistory"
      FROM "Candidate" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
    `;
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (nameFilter) {
      conditions.push(`c.name ILIKE $${paramIndex++}`);
      queryParams.push(`%${nameFilter}%`);
    }
    if (positionIdFilter) {
      conditions.push(`c."positionId" = $${paramIndex++}`);
      queryParams.push(positionIdFilter);
    }
    if (educationFilter) {
      // Simple text search within the parsedData JSONB, converted to text
      conditions.push(`c."parsedData"::text ILIKE $${paramIndex++}`);
      queryParams.push(`%${educationFilter}%`);
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
        transitionHistory: row.transitionHistory || [], // Ensure it's always an array
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
  const candidatePhone = rawData.phone || (rawData.parsedData?.contact_info?.phone ? rawData.parsedData.contact_info.phone : null);

  if (!candidateName && (!rawData.parsedData || !rawData.parsedData.personal_info.firstname || !rawData.parsedData.personal_info.lastname)) {
     return NextResponse.json(
      { message: "Invalid input", errors: { name: ["Name is required if not derivable from parsedData.personal_info (firstname, lastname)"]}},
      { status: 400 }
    );
  }
  if (!candidateEmail) {
     return NextResponse.json(
      { message: "Invalid input", errors: { email: ["Email is required either at top level or in parsedData.contact_info"]}},
      { status: 400 }
    );
  }
  
  // Ensure parsedData has the full structure even if only partial was sent
  const finalParsedData: CandidateDetails = {
    cv_language: rawData.parsedData?.cv_language || '',
    personal_info: {
        title_honorific: rawData.parsedData?.personal_info?.title_honorific || '',
        firstname: rawData.parsedData?.personal_info?.firstname || candidateName.split(' ')[0] || '',
        lastname: rawData.parsedData?.personal_info?.lastname || candidateName.split(' ').slice(1).join(' ') || '',
        nickname: rawData.parsedData?.personal_info?.nickname || '',
        location: rawData.parsedData?.personal_info?.location || '',
        introduction_aboutme: rawData.parsedData?.personal_info?.introduction_aboutme || '',
    },
    contact_info: {
        email: candidateEmail,
        phone: candidatePhone || '',
    },
    education: rawData.parsedData?.education || [],
    experience: rawData.parsedData?.experience || [],
    skills: rawData.parsedData?.skills || [],
    job_suitable: rawData.parsedData?.job_suitable || [],
  };


  const client = await pool.connect();
  const newCandidateId = uuidv4(); // Generate UUID for the candidate

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
      INSERT INTO "Candidate" (id, name, email, phone, "positionId", "fitScore", status, "applicationDate", "parsedData", "resumePath", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *;
    `;
    const candidateValues = [
      newCandidateId,
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

    // Create initial transition record
    const insertTransitionQuery = `
      INSERT INTO "TransitionRecord" (id, "candidateId", date, stage, notes, "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), $3, $4, NOW(), NOW())
      RETURNING *;
    `;
    const transitionValues = [
      uuidv4(), // Generate UUID for the transition record
      newCandidate.id,
      rawData.status,
      'Application received.',
    ];
    await client.query(insertTransitionQuery, transitionValues);
    
    await client.query('COMMIT');

    // Fetch the newly created candidate with its position details and transition history
    const finalQuery = `
        SELECT 
            c.id, c.name, c.email, c.phone, c."resumePath", c."parsedData",
            c."positionId", c."fitScore", c.status, c."applicationDate",
            c."createdAt", c."updatedAt",
            p.title as "positionTitle", 
            p.department as "positionDepartment",
            (SELECT json_agg(tr.* ORDER BY tr.date DESC) 
             FROM "TransitionRecord" tr 
             WHERE tr."candidateId" = c.id) as "transitionHistory"
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
        transitionHistory: finalResult.rows[0].transitionHistory || [],
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
