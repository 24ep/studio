// src/app/api/candidates/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../lib/db';
import type { CandidateStatus, CandidateDetails, Position, UserProfile } from '@/lib/types';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Core statuses for fallback or specific logic, full list comes from DB
const coreCandidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];

const personalInfoSchema = z.object({
  title_honorific: z.string().optional().default(''),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  nickname: z.string().optional().default(''),
  location: z.string().optional().default(''),
  introduction_aboutme: z.string().optional().default(''),
  avatar_url: z.string().url().optional().nullable(),
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
  postition_level: z.string().optional(),
});

const skillEntrySchema = z.object({
  segment_skill: z.string().optional().default(''),
  skill: z.array(z.string()).optional().default([]),
});

const jobSuitableEntrySchema = z.object({
  suitable_career: z.string().optional().default(''),
  suitable_job_position: z.string().optional().default(''),
  suitable_job_level: z.string().optional().default(''),
  suitable_salary_bath_month: z.string().optional(),
});

const n8nJobMatchSchemaForCandidate = z.object({
  job_id: z.string().optional().nullable(), // Made optional
  job_title: z.string().min(1, "Job title is required").optional(), // Made optional
  fit_score: z.number().min(0).max(100, "Fit score must be between 0 and 100"),
  match_reasons: z.array(z.string()).optional().default([]),
});

const candidateDetailsSchema = z.object({
  cv_language: z.string().optional().default(''),
  personal_info: personalInfoSchema,
  contact_info: contactInfoSchema,
  education: z.array(educationEntrySchema).optional().default([]),
  experience: z.array(experienceEntrySchema).optional().default([]),
  skills: z.array(skillEntrySchema).optional().default([]),
  job_suitable: z.array(jobSuitableEntrySchema).optional().default([]),
  associatedMatchDetails: z.object({
    jobTitle: z.string(),
    fitScore: z.number(),
    reasons: z.array(z.string()),
    n8nJobId: z.string().optional(),
  }).optional(),
  job_matches: z.array(n8nJobMatchSchemaForCandidate).optional().default([]),
});

const createCandidateSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).optional(), // Will be derived if not provided
  email: z.string().email({ message: "Invalid email address" }).optional(), // Will be derived if not provided
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid({ message: "Valid Position ID (UUID) is required" }).nullable().optional(),
  recruiterId: z.string().uuid().nullable().optional(),
  fitScore: z.number().min(0).max(100).optional().default(0),
  status: z.string().min(1).default('Applied'), // Changed from z.enum to z.string
  applicationDate: z.string().datetime({ message: "Invalid datetime string. Must be UTC ISO8601" }).optional(),
  parsedData: candidateDetailsSchema.optional(),
  custom_attributes: z.record(z.any()).optional().nullable(),
  resumePath: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  try {
    const { searchParams } = new URL(request.url);
    const nameFilter = searchParams.get('name');
    const positionIdFilter = searchParams.get('positionId');
    const educationFilter = searchParams.get('education'); // This uses ILIKE on text cast of JSONB.
    const minFitScoreParam = searchParams.get('minFitScore');
    const maxFitScoreParam = searchParams.get('maxFitScore');
    const assignedRecruiterIdParam = searchParams.get('assignedRecruiterId');

    let query = `
      SELECT
        c.id, c.name, c.email, c.phone, c."resumePath", c."parsedData", c.custom_attributes,
        c."positionId", c."fitScore", c.status, c."applicationDate",
        c."recruiterId", 
        c."createdAt", c."updatedAt",
        p.title as "positionTitle",
        p.department as "positionDepartment",
        p.position_level as "positionLevel",
        rec.name as "recruiterName", 
        COALESCE(th_data.history, '[]'::json) as "transitionHistory"
      FROM "Candidate" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
      LEFT JOIN "User" rec ON c."recruiterId" = rec.id
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', th.id, 'candidateId', th."candidateId", 'date', th.date, 'stage', th.stage, 
            'notes', th.notes, 'actingUserId', th."actingUserId", 'actingUserName', u_th.name, 
            'createdAt', th."createdAt", 'updatedAt', th."updatedAt"
          ) ORDER BY th.date DESC
        ) AS history
        FROM "TransitionRecord" th
        LEFT JOIN "User" u_th ON th."actingUserId" = u_th.id
        WHERE th."candidateId" = c.id
      ) AS th_data ON true
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
      // Example of specific JSONB filtering (if educationFilter was a university name to match exactly):
      // conditions.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(c."parsedData"->'education') as edu WHERE edu->>'university' = $${paramIndex++})`);
      // queryParams.push(educationFilter);
      // For now, keeping the existing general text search within parsedData for education:
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

    if (assignedRecruiterIdParam) {
      if (assignedRecruiterIdParam === 'me') {
        if (!session?.user?.id) {
          return NextResponse.json({ message: "Unauthorized: User session required for 'me' filter." }, { status: 401 });
        }
        conditions.push(`c."recruiterId" = $${paramIndex++}`);
        queryParams.push(session.user.id);
      } else if (z.string().uuid().safeParse(assignedRecruiterIdParam).success) {
        if (userRole !== 'Admin') {
          return NextResponse.json({ message: "Forbidden: Only Admins can filter by specific recruiter ID." }, { status: 403 });
        }
        conditions.push(`c."recruiterId" = $${paramIndex++}`);
        queryParams.push(assignedRecruiterIdParam);
      } else if (assignedRecruiterIdParam === 'ALL_CANDIDATES_ADMIN') {
        if (userRole !== 'Admin') {
          return NextResponse.json({ message: "Forbidden: Only Admins can view all candidates without recruiter filter." }, { status: 403 });
        }
        // No condition added, Admin sees all
      }
    } else {
      // Default filtering by role if no specific assignedRecruiterIdParam is given
      if (userRole === 'Recruiter') {
         if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized: User session required for Recruiter view." }, { status: 401 });
        }
        conditions.push(`c."recruiterId" = $${paramIndex++}`);
        queryParams.push(session.user.id);
      } else if (userRole === 'Hiring Manager') {
        // Default behavior for Hiring Manager (can be adjusted, e.g., show no candidates by default unless filtered)
        // For now, they see all candidates unless a specific filter is applied by them (if UI allows).
        // To restrict by default: conditions.push('FALSE'); // Effectively shows no candidates
      }
      // Admin sees all by default if no assignedRecruiterIdParam
    }


    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY c."createdAt" DESC';

    const result = await pool.query(query, queryParams);

    const candidates = result.rows.map(row => ({
        ...row,
        parsedData: row.parsedData || { personal_info: {}, contact_info: {} },
        custom_attributes: row.custom_attributes || {},
        position: row.positionId ? {
            id: row.positionId,
            title: row.positionTitle,
            department: row.positionDepartment,
            position_level: row.positionLevel,
        } : null,
        recruiter: row.recruiterId ? { 
            id: row.recruiterId,
            name: row.recruiterName,
            email: null 
        } : null,
        transitionHistory: row.transitionHistory || [],
    }));

    return NextResponse.json(candidates, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60', // Added Cache-Control header
      },
    });
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    await logAudit('ERROR', `Failed to fetch candidates. Error: ${(error as Error).message}`, 'API:Candidates:GetAll', session?.user?.id);
    return NextResponse.json({ message: "Error fetching candidates", error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  if (!userRole || !['Admin', 'Recruiter'].includes(userRole)) {
    await logAudit('WARN', `Forbidden attempt to create candidate by user ${session?.user?.email || 'Unknown'} (ID: ${session?.user?.id || 'N/A'}). Required roles: Admin, Recruiter.`, 'API:Candidates:Create', session?.user?.id);
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
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

  const candidateName = rawData.name || (rawData.parsedData ? `${rawData.parsedData.personal_info.firstname} ${rawData.parsedData.personal_info.lastname}`.trim() : '');
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

  const finalParsedData: CandidateDetails = rawData.parsedData ? {
    cv_language: rawData.parsedData.cv_language || '',
    personal_info: {
        ...(rawData.parsedData.personal_info),
        firstname: rawData.parsedData.personal_info.firstname || candidateName.split(' ')[0] || '',
        lastname: rawData.parsedData.personal_info.lastname || candidateName.split(' ').slice(1).join(' ') || '',
    },
    contact_info: {
        ...(rawData.parsedData.contact_info),
        email: candidateEmail,
        phone: candidatePhone || '',
    },
    education: rawData.parsedData.education || [],
    experience: rawData.parsedData.experience || [],
    skills: rawData.parsedData.skills || [],
    job_suitable: rawData.parsedData.job_suitable || [],
    associatedMatchDetails: rawData.parsedData.associatedMatchDetails,
    job_matches: rawData.parsedData.job_matches || [],
  } : {
    personal_info: { firstname: candidateName.split(' ')[0] || '', lastname: candidateName.split(' ').slice(1).join(' ') || '' },
    contact_info: { email: candidateEmail, phone: candidatePhone || '' },
    education: [],
    experience: [],
    skills: [],
    job_suitable: [],
    job_matches: [],
  };


  const client = await pool.connect();
  const newCandidateId = uuidv4();

  try {
    await client.query('BEGIN');

    // Validate status against RecruitmentStage table
    const stageCheck = await client.query('SELECT id FROM "RecruitmentStage" WHERE name = $1', [rawData.status]);
    if (stageCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: `Invalid candidate status: '${rawData.status}'. Stage not found.` }, { status: 400 });
    }


    if (rawData.positionId) {
        const positionCheckQuery = 'SELECT id FROM "Position" WHERE id = $1';
        const positionResult = await client.query(positionCheckQuery, [rawData.positionId]);
        if (positionResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ message: "Position not found" }, { status: 404 });
        }
    }
    if (rawData.recruiterId) {
        const recruiterCheckQuery = 'SELECT id FROM "User" WHERE id = $1 AND role = $2';
        const recruiterResult = await client.query(recruiterCheckQuery, [rawData.recruiterId, 'Recruiter']);
        if (recruiterResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ message: "Recruiter not found or user is not a Recruiter." }, { status: 404 });
        }
    }


    const insertCandidateQuery = `
      INSERT INTO "Candidate" (id, name, email, phone, "positionId", "recruiterId", "fitScore", status, "applicationDate", "parsedData", "custom_attributes", "resumePath", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *;
    `;
    const candidateValues = [
      newCandidateId,
      candidateName,
      candidateEmail,
      candidatePhone,
      rawData.positionId || null,
      rawData.recruiterId || null, 
      rawData.fitScore,
      rawData.status,
      rawData.applicationDate ? new Date(rawData.applicationDate) : new Date(),
      finalParsedData,
      rawData.custom_attributes || {},
      rawData.resumePath,
    ];
    const candidateResult = await client.query(insertCandidateQuery, candidateValues);
    const newCandidate = candidateResult.rows[0];

    const insertTransitionQuery = `
      INSERT INTO "TransitionRecord" (id, "candidateId", date, stage, notes, "actingUserId", "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), $3, $4, $5, NOW(), NOW())
      RETURNING *;
    `;
    const transitionValues = [
      uuidv4(),
      newCandidate.id,
      rawData.status,
      `Application received by ${session?.user?.name || session?.user?.email || 'System'}.`, 
      session?.user?.id || null, 
    ];
    await client.query(insertTransitionQuery, transitionValues);

    await client.query('COMMIT');

    const finalQuery = `
        SELECT
            c.id, c.name, c.email, c.phone, c."resumePath", c."parsedData", c.custom_attributes,
            c."positionId", c."fitScore", c.status, c."applicationDate",
            c."recruiterId", c."createdAt", c."updatedAt",
            p.title as "positionTitle",
            p.department as "positionDepartment",
            p.position_level as "positionLevel",
            rec.name as "recruiterName",
            COALESCE(th_data.history, '[]'::json) as "transitionHistory"
        FROM "Candidate" c
        LEFT JOIN "Position" p ON c."positionId" = p.id
        LEFT JOIN "User" rec ON c."recruiterId" = rec.id
        LEFT JOIN LATERAL (
            SELECT json_agg(
                json_build_object(
                'id', th.id, 'candidateId', th."candidateId", 'date', th.date, 'stage', th.stage, 
                'notes', th.notes, 'actingUserId', th."actingUserId", 'actingUserName', u_th.name, 
                'createdAt', th."createdAt", 'updatedAt', th."updatedAt"
                ) ORDER BY th.date DESC
            ) AS history
            FROM "TransitionRecord" th
            LEFT JOIN "User" u_th ON th."actingUserId" = u_th.id
            WHERE th."candidateId" = c.id
        ) AS th_data ON true
        WHERE c.id = $1;
    `;
    const finalResult = await client.query(finalQuery, [newCandidate.id]);
    const createdCandidateWithDetails = {
        ...finalResult.rows[0],
        parsedData: finalResult.rows[0].parsedData || { personal_info: {}, contact_info: {} },
        custom_attributes: finalResult.rows[0].custom_attributes || {},
        position: finalResult.rows[0].positionId ? {
            id: finalResult.rows[0].positionId,
            title: finalResult.rows[0].positionTitle,
            department: finalResult.rows[0].positionDepartment,
            position_level: finalResult.rows[0].positionLevel,
        } : null,
        recruiter: finalResult.rows[0].recruiterId ? {
            id: finalResult.rows[0].recruiterId,
            name: finalResult.rows[0].recruiterName,
            email: null
        } : null,
        transitionHistory: finalResult.rows[0].transitionHistory || [],
    };
    
    const actingUserName = session?.user?.name || session?.user?.email || 'System';
    await logAudit('AUDIT', `Candidate '${newCandidate.name}' (ID: ${newCandidate.id}) created by ${actingUserName}.`, 'API:Candidates:Create', session?.user?.id, { targetCandidateId: newCandidate.id, name: newCandidate.name, email: newCandidate.email });
    return NextResponse.json(createdCandidateWithDetails, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("Failed to create candidate:", error);
    const actingUserName = session?.user?.name || session?.user?.email || 'System';
    await logAudit('ERROR', `Failed to create candidate '${candidateName}' by ${actingUserName}. Error: ${error.message}`, 'API:Candidates:Create', session?.user?.id, { name: candidateName, email: candidateEmail });
    if (error.code === '23505' && error.constraint === 'Candidate_email_key') {
      return NextResponse.json({ message: "A candidate with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error creating candidate", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
