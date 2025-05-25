
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import type { CandidateStatus, ParsedResumeData, Candidate, UserProfile, CandidateDetails, OldParsedResumeData } from '@/lib/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (!userRole || !['Admin', 'Recruiter', 'Hiring Manager'].includes(userRole)) {
    await logAudit('WARN', `Forbidden attempt to view candidate (ID: ${params.id}) by ${session.user.name} (ID: ${session.user.id}). Required roles: Admin, Recruiter, Hiring Manager.`, 'API:Candidates', session.user.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const query = `
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
      WHERE c.id = $1;
    `;
    const result = await pool.query(query, [params.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }
    
    const candidate = {
        ...result.rows[0],
        // Adjust parsedData to new potential types if necessary
        parsedData: result.rows[0].parsedData || { personal_info: {}, contact_info: {} }, 
        position: {
            id: result.rows[0].positionId,
            title: result.rows[0].positionTitle,
            department: result.rows[0].positionDepartment,
        },
    };
    return NextResponse.json(candidate, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch candidate ${params.id}:`, error);
    await logAudit('ERROR', `Failed to fetch candidate (ID: ${params.id}). Error: ${(error as Error).message}`, 'API:Candidates', session.user.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Error fetching candidate", error: (error as Error).message }, { status: 500 });
  }
}

const candidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];

// Use the detailed CandidateDetails schema for parsedData updates
const personalInfoSchemaPartial = z.object({
  title_honorific: z.string().optional(),
  firstname: z.string().min(1, "First name is required").optional(),
  lastname: z.string().min(1, "Last name is required").optional(),
  nickname: z.string().optional(),
  location: z.string().optional(),
  introduction_aboutme: z.string().optional(),
}).deepPartial();

const contactInfoSchemaPartial = z.object({
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
}).deepPartial();

const educationEntrySchemaPartial = z.object({ /* ... all fields optional ... */ }).deepPartial();
const experienceEntrySchemaPartial = z.object({ /* ... all fields optional ... */ }).deepPartial();
const skillEntrySchemaPartial = z.object({ /* ... all fields optional ... */ }).deepPartial();
const jobSuitableEntrySchemaPartial = z.object({ /* ... all fields optional ... */ }).deepPartial();

const candidateDetailsSchemaPartial = z.object({
  cv_language: z.string().optional(),
  personal_info: personalInfoSchemaPartial.optional(),
  contact_info: contactInfoSchemaPartial.optional(),
  education: z.array(educationEntrySchemaPartial).optional(),
  experience: z.array(experienceEntrySchemaPartial).optional(),
  skills: z.array(skillEntrySchemaPartial).optional(),
  job_suitable: z.array(jobSuitableEntrySchemaPartial).optional(),
}).deepPartial();


const updateCandidateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().nullable().optional(),
  fitScore: z.number().min(0).max(100).optional(),
  status: z.enum(candidateStatusValues).optional(),
  parsedData: candidateDetailsSchemaPartial.optional(),
  resumePath: z.string().optional().nullable(),
});


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (!userRole || !['Admin', 'Recruiter'].includes(userRole)) {
    await logAudit('WARN', `Forbidden attempt to update candidate (ID: ${params.id}) by ${session.user.name} (ID: ${session.user.id}). Required roles: Admin, Recruiter.`, 'API:Candidates', session.user.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions to update candidates" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Error parsing request body for candidate update:", error);
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = updateCandidateSchema.safeParse(body);
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

    const existingCandidateQuery = 'SELECT * FROM "Candidate" WHERE id = $1';
    const existingCandidateResult = await client.query(existingCandidateQuery, [params.id]);
    if (existingCandidateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }
    const existingCandidate = existingCandidateResult.rows[0] as Candidate;

    if (validatedData.positionId) {
      const positionExistsQuery = 'SELECT id FROM "Position" WHERE id = $1';
      const positionResult = await client.query(positionExistsQuery, [validatedData.positionId]);
      if (positionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: "Position not found for new positionId" }, { status: 404 });
      }
    }
    
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) { // Check for undefined, allow nulls to be set
        if (key === 'parsedData') {
          // Deep merge for parsedData
          const existingPD = (existingCandidate.parsedData || {}) as CandidateDetails;
          const newPD = value as Partial<CandidateDetails>;
          
          const mergedParsedData: CandidateDetails = {
            cv_language: newPD.cv_language ?? existingPD.cv_language,
            personal_info: { ...(existingPD.personal_info || {}), ...(newPD.personal_info || {}) } as PersonalInfo,
            contact_info: { ...(existingPD.contact_info || {}), ...(newPD.contact_info || {}) } as ContactInfo,
            // For arrays, replace if new one is provided, otherwise keep existing. More complex merge might be needed.
            education: newPD.education ?? existingPD.education,
            experience: newPD.experience ?? existingPD.experience,
            skills: newPD.skills ?? existingPD.skills,
            job_suitable: newPD.job_suitable ?? existingPD.job_suitable,
          };
          updateFields.push(`"parsedData" = $${paramIndex++}`);
          updateValues.push(mergedParsedData);
        } else {
          updateFields.push(`"${key}" = $${paramIndex++}`);
          updateValues.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      await client.query('ROLLBACK'); 
      return NextResponse.json(existingCandidate, { status: 200 });
    }

    updateFields.push(`"updatedAt" = NOW()`);
    updateValues.push(params.id); 

    const updateQuery = `UPDATE "Candidate" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
    const updatedResult = await client.query(updateQuery, updateValues);
    let updatedCandidate = updatedResult.rows[0];

    if (validatedData.status && validatedData.status !== existingCandidate.status) {
      const insertTransitionQuery = `
        INSERT INTO "TransitionRecord" ("candidateId", date, stage, notes, "createdAt", "updatedAt")
        VALUES ($1, NOW(), $2, $3, NOW(), NOW());
      `;
      await client.query(insertTransitionQuery, [params.id, validatedData.status, `Status updated to ${validatedData.status} by ${session.user.name}.`]);
       await logAudit('AUDIT', `Candidate '${updatedCandidate.name}' (ID: ${params.id}) status changed to '${validatedData.status}' by ${session.user.name} (ID: ${session.user.id}).`, 'API:Candidates', session.user.id, { targetCandidateId: params.id, newStatus: validatedData.status, oldStatus: existingCandidate.status });
    }
    
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
    const finalResult = await pool.query(finalQuery, [params.id]);
    updatedCandidate = {
        ...finalResult.rows[0],
        parsedData: finalResult.rows[0].parsedData || { personal_info: {}, contact_info: {} },
        position: {
            id: finalResult.rows[0].positionId,
            title: finalResult.rows[0].positionTitle,
            department: finalResult.rows[0].positionDepartment,
        },
    };
    
    await logAudit('AUDIT', `Candidate '${updatedCandidate.name}' (ID: ${params.id}) updated by ${session.user.name} (ID: ${session.user.id}).`, 'API:Candidates', session.user.id, { targetCandidateId: params.id, changes: Object.keys(validatedData) });
    return NextResponse.json(updatedCandidate, { status: 200 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to update candidate ${params.id}:`, error);
    await logAudit('ERROR', `Failed to update candidate (ID: ${params.id}). Error: ${error.message}`, 'API:Candidates', session.user.id, { targetCandidateId: params.id });
    if (error.code === '23505' && error.constraint === 'Candidate_email_key') {
      return NextResponse.json({ message: "A candidate with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error updating candidate", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userRole = session.user.role;
  if (!userRole || !['Admin', 'Recruiter'].includes(userRole)) {
    await logAudit('WARN', `Forbidden attempt to delete candidate (ID: ${params.id}) by ${session.user.name} (ID: ${session.user.id}). Required roles: Admin, Recruiter.`, 'API:Candidates', session.user.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions to delete candidates" }, { status: 403 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const candidateQuery = 'SELECT name FROM "Candidate" WHERE id = $1';
    const candidateRes = await client.query(candidateQuery, [params.id]);
    if (candidateRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }
    const candidateName = candidateRes.rows[0].name;
    
    const deleteTransitionsQuery = 'DELETE FROM "TransitionRecord" WHERE "candidateId" = $1';
    await client.query(deleteTransitionsQuery, [params.id]);
    
    const deleteCandidateQuery = 'DELETE FROM "Candidate" WHERE id = $1';
    await client.query(deleteCandidateQuery, [params.id]);
    
    await client.query('COMMIT');
    
    await logAudit('AUDIT', `Candidate '${candidateName}' (ID: ${params.id}) deleted by ${session.user.name} (ID: ${session.user.id}).`, 'API:Candidates', session.user.id, { targetCandidateId: params.id, deletedCandidateName: candidateName });
    return NextResponse.json({ message: "Candidate deleted successfully" }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Failed to delete candidate ${params.id}:`, error);
    await logAudit('ERROR', `Failed to delete candidate (ID: ${params.id}). Error: ${(error as Error).message}`, 'API:Candidates', session.user.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Error deleting candidate", error: (error as Error).message }, { status: 500 });
  } finally {
    client.release();
  }
}
