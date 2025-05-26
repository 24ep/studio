
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import type { CandidateStatus, Candidate, CandidateDetails, PersonalInfo, ContactInfo, PositionLevel, UserProfile } from '@/lib/types';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  // if (!session?.user?.id) { // Public for now
  //   return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  // }
  // RBAC: Allow Admin, Recruiter, Hiring Manager to view
  // const allowedRoles: UserProfile['role'][] = ['Admin', 'Recruiter', 'Hiring Manager'];
  // if (!session.user.role || !allowedRoles.includes(session.user.role)) {
  //   return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  // }

  try {
    const query = `
      SELECT
        c.id, c.name, c.email, c.phone, c."resumePath", c."parsedData",
        c."positionId", c."fitScore", c.status, c."applicationDate",
        c."createdAt", c."updatedAt",
        p.title as "positionTitle",
        p.department as "positionDepartment",
        p.position_level as "positionLevel",
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', th.id,
              'candidateId', th."candidateId",
              'date', th.date,
              'stage', th.stage,
              'notes', th.notes,
              'actingUserId', th."actingUserId",
              'actingUserName', u.name, -- Get the user's name
              'createdAt', th."createdAt",
              'updatedAt', th."updatedAt"
            ) ORDER BY th.date DESC
           )
           FROM "TransitionRecord" th
           LEFT JOIN "User" u ON th."actingUserId" = u.id -- Join with User table
           WHERE th."candidateId" = c.id
          ),
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

    const candidateRow = result.rows[0];
    const candidate = {
        ...candidateRow,
        parsedData: candidateRow.parsedData || { personal_info: {}, contact_info: {} }, // Ensure parsedData is at least an empty object
        position: candidateRow.positionId ? {
            id: candidateRow.positionId,
            title: candidateRow.positionTitle,
            department: candidateRow.positionDepartment,
            position_level: candidateRow.positionLevel,
        } : null,
        transitionHistory: candidateRow.transitionHistory || [],
    };
    return NextResponse.json(candidate, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch candidate ${params.id}:`, error);
    await logAudit('ERROR', `Failed to fetch candidate (ID: ${params.id}). Error: ${(error as Error).message}`, 'API:Candidates', session?.user?.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Error fetching candidate", error: (error as Error).message }, { status: 500 });
  }
}

const candidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];
const positionLevelEnumValuesForZod: [PositionLevel, ...PositionLevel[]] = [
    'entry level', 'mid level', 'senior level', 'lead', 'manager', 'executive', 'officer', 'leader'
];


const personalInfoSchemaPartial = z.object({
  title_honorific: z.string().optional(),
  firstname: z.string().min(1, "First name is required").optional(),
  lastname: z.string().min(1, "Last name is required").optional(),
  nickname: z.string().optional(),
  location: z.string().optional(),
  introduction_aboutme: z.string().optional(),
  avatar_url: z.string().url().optional().nullable(),
}).deepPartial();

const contactInfoSchemaPartial = z.object({
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().optional(),
}).deepPartial();

const educationEntrySchemaPartial = z.object({
    major: z.string().optional(),
    field: z.string().optional(),
    period: z.string().optional(),
    duration: z.string().optional(),
    GPA: z.string().optional(),
    university: z.string().optional(),
    campus: z.string().optional(),
}).deepPartial();

const experienceEntrySchemaPartial = z.object({
    company: z.string().optional(),
    position: z.string().optional(),
    description: z.string().optional(),
    period: z.string().optional(),
    duration: z.string().optional(),
    is_current_position: z.union([z.boolean(), z.string()]).optional(),
    postition_level: z.string().optional(), // Allow any string
}).deepPartial();

const skillEntrySchemaPartial = z.object({
    segment_skill: z.string().optional(),
    skill: z.array(z.string()).optional(),
}).deepPartial();

const jobSuitableEntrySchemaPartial = z.object({
    suitable_career: z.string().optional(),
    suitable_job_position: z.string().optional(),
    suitable_job_level: z.string().optional(),
    suitable_salary_bath_month: z.string().optional(),
}).deepPartial();

const n8nJobMatchSchemaPartial = z.object({
  job_id: z.string().optional(),
  job_title: z.string().min(1, "Job title is required").optional(),
  fit_score: z.number().min(0).max(100, "Fit score must be between 0 and 100").optional(),
  match_reasons: z.array(z.string()).optional(),
}).deepPartial();


const candidateDetailsSchemaPartial = z.object({
  cv_language: z.string().optional(),
  personal_info: personalInfoSchemaPartial.optional(),
  contact_info: contactInfoSchemaPartial.optional(),
  education: z.array(educationEntrySchemaPartial).optional(),
  experience: z.array(experienceEntrySchemaPartial).optional(),
  skills: z.array(skillEntrySchemaPartial).optional(),
  job_suitable: z.array(jobSuitableEntrySchemaPartial).optional(),
  associatedMatchDetails: z.object({
    jobTitle: z.string(),
    fitScore: z.number(),
    reasons: z.array(z.string()),
    n8nJobId: z.string().optional(),
  }).optional(),
  job_matches: z.array(n8nJobMatchSchemaPartial).optional(), // For storing all matches
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
  // const allowedRoles: UserProfile['role'][] = ['Admin', 'Recruiter'];
  // if (!session?.user?.id || !session.user.role || !allowedRoles.includes(session.user.role)) {
  //   await logAudit('WARN', `Forbidden attempt to update candidate (ID: ${params.id}) by user ${session?.user?.email || 'Unknown/Public'} (ID: ${session?.user?.id || 'N/A'}). Required roles: Admin, Recruiter.`, 'API:Candidates', session?.user?.id, { targetCandidateId: params.id });
  //   return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  // }

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
      if (value !== undefined) {
        if (key === 'parsedData') {
          const existingPD = (existingCandidate.parsedData || {}) as CandidateDetails;
          const newPD = value as Partial<CandidateDetails>;

          const mergedParsedData: CandidateDetails = {
            cv_language: newPD.cv_language ?? existingPD.cv_language,
            personal_info: { ...(existingPD.personal_info || {}), ...(newPD.personal_info || {}) } as PersonalInfo,
            contact_info: { ...(existingPD.contact_info || {}), ...(newPD.contact_info || {}) } as ContactInfo,
            education: newPD.education ?? existingPD.education,
            experience: newPD.experience ?? existingPD.experience,
            skills: newPD.skills ?? existingPD.skills,
            job_suitable: newPD.job_suitable ?? existingPD.job_suitable,
            associatedMatchDetails: newPD.associatedMatchDetails ?? existingPD.associatedMatchDetails,
            job_matches: newPD.job_matches ?? existingPD.job_matches, // Merge job_matches
          };
          updateFields.push(`"parsedData" = $${paramIndex++}`);
          updateValues.push(mergedParsedData);
        } else {
          updateFields.push(`"${key}" = $${paramIndex++}`);
          updateValues.push(value);
        }
      }
    });

    if (updateFields.length === 0 && (!validatedData.status || validatedData.status === existingCandidate.status)) {
      // No actual fields to update and status hasn't changed, so no new transition needed.
      // Just refetch and return to ensure client has latest, especially if only notes were changed on a transition record directly.
      await client.query('ROLLBACK');
      const currentCandidateQuery = `
          SELECT
              c.*,
              p.title as "positionTitle",
              p.department as "positionDepartment",
              p.position_level as "positionLevel",
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', th.id, 'candidateId', th."candidateId", 'date', th.date, 'stage', th.stage, 'notes', th.notes,
                    'actingUserId', th."actingUserId", 'actingUserName', u.name,
                    'createdAt', th."createdAt", 'updatedAt', th."updatedAt"
                  ) ORDER BY th.date DESC
                 ) FROM "TransitionRecord" th LEFT JOIN "User" u ON th."actingUserId" = u.id WHERE th."candidateId" = c.id),
                '[]'::json
              ) as "transitionHistory"
          FROM "Candidate" c
          LEFT JOIN "Position" p ON c."positionId" = p.id
          WHERE c.id = $1;
      `;
      const currentResult = await client.query(currentCandidateQuery, [params.id]);
      const currentCandidateWithDetails = {
        ...currentResult.rows[0],
        parsedData: currentResult.rows[0].parsedData || { personal_info: {}, contact_info: {} },
         position: currentResult.rows[0].positionId ? {
            id: currentResult.rows[0].positionId,
            title: currentResult.rows[0].positionTitle,
            department: currentResult.rows[0].positionDepartment,
            position_level: currentResult.rows[0].positionLevel,
        } : null,
        transitionHistory: currentResult.rows[0].transitionHistory || [],
      };
      return NextResponse.json(currentCandidateWithDetails, { status: 200 });
    }

    if (updateFields.length > 0) {
      updateFields.push(`"updatedAt" = NOW()`);
      updateValues.push(params.id);
      const updateQuery = `UPDATE "Candidate" SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
      await client.query(updateQuery, updateValues);
    }


    if (validatedData.status && validatedData.status !== existingCandidate.status) {
      const insertTransitionQuery = `
        INSERT INTO "TransitionRecord" (id, "candidateId", date, stage, notes, "actingUserId", "createdAt", "updatedAt")
        VALUES ($1, $2, NOW(), $3, $4, $5, NOW(), NOW());
      `;
      await client.query(insertTransitionQuery, [
        uuidv4(),
        params.id,
        validatedData.status,
        `Status updated to ${validatedData.status} by ${session?.user?.name || session?.user?.email || 'System/Public'}.`,
        session?.user?.id || null // If public, no acting user ID
      ]);
      await logAudit('AUDIT', `Candidate '${existingCandidate.name}' (ID: ${params.id}) status changed to '${validatedData.status}'.`, 'API:Candidates', session?.user?.id, { targetCandidateId: params.id, newStatus: validatedData.status, oldStatus: existingCandidate.status });
    }

    await client.query('COMMIT');

    // Refetch the candidate to include all latest data, especially transition history with acting user names
    const finalQuery = `
        SELECT
            c.id, c.name, c.email, c.phone, c."resumePath", c."parsedData",
            c."positionId", c."fitScore", c.status, c."applicationDate",
            c."createdAt", c."updatedAt",
            p.title as "positionTitle",
            p.department as "positionDepartment",
            p.position_level as "positionLevel",
            COALESCE(
              (SELECT json_agg(
                json_build_object(
                  'id', th.id, 'candidateId', th."candidateId", 'date', th.date, 'stage', th.stage, 'notes', th.notes,
                  'actingUserId', th."actingUserId", 'actingUserName', u.name,
                  'createdAt', th."createdAt", 'updatedAt', th."updatedAt"
                ) ORDER BY th.date DESC
               ) FROM "TransitionRecord" th LEFT JOIN "User" u ON th."actingUserId" = u.id WHERE th."candidateId" = c.id),
              '[]'::json
            ) as "transitionHistory"
        FROM "Candidate" c
        LEFT JOIN "Position" p ON c."positionId" = p.id
        WHERE c.id = $1;
    `;
    const finalResult = await client.query(finalQuery, [params.id]);
    const updatedCandidateWithDetails = {
        ...finalResult.rows[0],
        parsedData: finalResult.rows[0].parsedData || { personal_info: {}, contact_info: {} },
        position: finalResult.rows[0].positionId ? {
            id: finalResult.rows[0].positionId,
            title: finalResult.rows[0].positionTitle,
            department: finalResult.rows[0].positionDepartment,
            position_level: finalResult.rows[0].positionLevel,
        } : null,
        transitionHistory: finalResult.rows[0].transitionHistory || [],
    };

    await logAudit('AUDIT', `Candidate '${updatedCandidateWithDetails.name}' (ID: ${params.id}) updated.`, 'API:Candidates', session?.user?.id, { targetCandidateId: params.id, changes: Object.keys(validatedData) });
    return NextResponse.json(updatedCandidateWithDetails, { status: 200 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to update candidate ${params.id}:`, error);
    await logAudit('ERROR', `Failed to update candidate (ID: ${params.id}). Error: ${error.message}`, 'API:Candidates', session?.user?.id, { targetCandidateId: params.id });
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
  // const allowedRoles: UserProfile['role'][] = ['Admin', 'Recruiter'];
  //  if (!session?.user?.id || !session.user.role || !allowedRoles.includes(session.user.role)) {
  //   await logAudit('WARN', `Forbidden attempt to delete candidate (ID: ${params.id}) by user ${session?.user?.email || 'Unknown/Public'} (ID: ${session?.user?.id || 'N/A'}). Required roles: Admin, Recruiter.`, 'API:Candidates', session?.user?.id, { targetCandidateId: params.id });
  //   return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  // }

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

    // Deleting transition records is handled by ON DELETE CASCADE constraint in DB
    // const deleteTransitionsQuery = 'DELETE FROM "TransitionRecord" WHERE "candidateId" = $1';
    // await client.query(deleteTransitionsQuery, [params.id]);

    const deleteCandidateQuery = 'DELETE FROM "Candidate" WHERE id = $1';
    await client.query(deleteCandidateQuery, [params.id]);

    await client.query('COMMIT');

    await logAudit('AUDIT', `Candidate '${candidateName}' (ID: ${params.id}) deleted.`, 'API:Candidates', session?.user?.id, { targetCandidateId: params.id, deletedCandidateName: candidateName });
    return NextResponse.json({ message: "Candidate deleted successfully" }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Failed to delete candidate ${params.id}:`, error);
    await logAudit('ERROR', `Failed to delete candidate (ID: ${params.id}). Error: ${(error as Error).message}`, 'API:Candidates', session?.user?.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Error deleting candidate", error: (error as Error).message }, { status: 500 });
  } finally {
    client.release();
  }
}
