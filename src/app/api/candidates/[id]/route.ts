
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
  const allowedRoles: UserProfile['role'][] = ['Admin', 'Recruiter', 'Hiring Manager'];
  if (!session?.user?.id || !session.user.role || !allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
  }

  try {
    const query = `
      SELECT
        c.id, c.name, c.email, c.phone, c."resumePath", c."parsedData",
        c."positionId", c."fitScore", c.status, c."applicationDate",
        c."recruiterId", -- Select recruiterId from Candidate table
        c."createdAt", c."updatedAt",
        p.title as "positionTitle",
        p.department as "positionDepartment",
        p.position_level as "positionLevel",
        rec.name as "recruiterName", -- Select recruiter's name
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'id', th.id,
              'candidateId', th."candidateId",
              'date', th.date,
              'stage', th.stage,
              'notes', th.notes,
              'actingUserId', th."actingUserId",
              'actingUserName', u.name,
              'createdAt', th."createdAt",
              'updatedAt', th."updatedAt"
            ) ORDER BY th.date DESC
           )
           FROM "TransitionRecord" th
           LEFT JOIN "User" u ON th."actingUserId" = u.id
           WHERE th."candidateId" = c.id
          ),
          '[]'::json
        ) as "transitionHistory"
      FROM "Candidate" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
      LEFT JOIN "User" rec ON c."recruiterId" = rec.id -- Join for recruiter name
      WHERE c.id = $1;
    `;
    const result = await pool.query(query, [params.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }

    const candidateRow = result.rows[0];
    const candidate = {
        ...candidateRow,
        parsedData: candidateRow.parsedData || { personal_info: {}, contact_info: {} },
        position: candidateRow.positionId ? {
            id: candidateRow.positionId,
            title: candidateRow.positionTitle,
            department: candidateRow.positionDepartment,
            position_level: candidateRow.positionLevel,
        } : null,
        recruiter: candidateRow.recruiterId ? { // Populate recruiter object
            id: candidateRow.recruiterId,
            name: candidateRow.recruiterName,
            email: null // Email not fetched in this join
        } : null,
        transitionHistory: candidateRow.transitionHistory || [],
    };
    return NextResponse.json(candidate, { status: 200 });
  } catch (error) {
    console.error(`Failed to fetch candidate ${params.id}:`, error);
    await logAudit('ERROR', `Failed to fetch candidate (ID: ${params.id}). Error: ${(error as Error).message}`, 'API:Candidates:GetById', session?.user?.id, { targetCandidateId: params.id });
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
    postition_level: z.string().optional(),
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
  job_matches: z.array(n8nJobMatchSchemaPartial).optional(),
}).deepPartial();

const updateCandidateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().nullable().optional(),
  recruiterId: z.string().uuid().nullable().optional(), // Added recruiterId
  fitScore: z.number().min(0).max(100).optional(),
  status: z.enum(candidateStatusValues).optional(),
  parsedData: candidateDetailsSchemaPartial.optional(),
  resumePath: z.string().optional().nullable(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const allowedRoles: UserProfile['role'][] = ['Admin', 'Recruiter'];
  if (!session?.user?.id || !session.user.role || !allowedRoles.includes(session.user.role)) {
    await logAudit('WARN', `Forbidden attempt to update candidate (ID: ${params.id}) by user ${session?.user?.email || 'Unknown'} (ID: ${session?.user?.id || 'N/A'}). Required roles: Admin, Recruiter.`, 'API:Candidates:Update', session?.user?.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
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
  let oldRecruiterId: string | null = null;
  let oldStatus: CandidateStatus | undefined = undefined;


  try {
    await client.query('BEGIN');

    const existingCandidateQuery = 'SELECT * FROM "Candidate" WHERE id = $1';
    const existingCandidateResult = await client.query(existingCandidateQuery, [params.id]);
    if (existingCandidateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: "Candidate not found" }, { status: 404 });
    }
    const existingCandidate = existingCandidateResult.rows[0] as Candidate;
    oldRecruiterId = existingCandidate.recruiterId || null;
    oldStatus = existingCandidate.status;


    if (validatedData.positionId) {
      const positionExistsQuery = 'SELECT id FROM "Position" WHERE id = $1';
      const positionResult = await client.query(positionExistsQuery, [validatedData.positionId]);
      if (positionResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: "Position not found for new positionId" }, { status: 404 });
      }
    }
    if (validatedData.recruiterId) {
        const recruiterCheckQuery = 'SELECT id FROM "User" WHERE id = $1 AND role = $2';
        const recruiterResult = await client.query(recruiterCheckQuery, [validatedData.recruiterId, 'Recruiter']);
        if (recruiterResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ message: "Recruiter not found or user is not a Recruiter for new recruiterId." }, { status: 404 });
        }
    }


    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) { // Important: check for undefined, not just falsy, to allow setting nulls
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
            job_matches: newPD.job_matches ?? existingPD.job_matches,
          };
          updateFields.push(`"parsedData" = $${paramIndex++}`);
          updateValues.push(mergedParsedData);
        } else {
          updateFields.push(`"${key}" = $${paramIndex++}`);
          updateValues.push(value); // This handles null assignment correctly
        }
      }
    });

    if (updateFields.length === 0 && (!validatedData.status || validatedData.status === existingCandidate.status)) {
      await client.query('ROLLBACK'); // No actual DB update needed, release lock
      const currentCandidateQuery = `
          SELECT
              c.*,
              p.title as "positionTitle", p.department as "positionDepartment", p.position_level as "positionLevel",
              rec.name as "recruiterName",
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
          LEFT JOIN "User" rec ON c."recruiterId" = rec.id
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
        recruiter: currentResult.rows[0].recruiterId ? {
            id: currentResult.rows[0].recruiterId,
            name: currentResult.rows[0].recruiterName,
            email: null
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
        `Status updated to ${validatedData.status} by ${session.user.name || session.user.email}.`,
        session.user.id
      ]);
      await logAudit('AUDIT', `Candidate '${existingCandidate.name}' (ID: ${params.id}) status changed from '${oldStatus}' to '${validatedData.status}' by ${session.user.name}.`, 'API:Candidates:UpdateStatus', session.user.id, { targetCandidateId: params.id, newStatus: validatedData.status, oldStatus: oldStatus });
    }

    if (validatedData.recruiterId !== undefined && validatedData.recruiterId !== oldRecruiterId) {
        const newRecruiterName = validatedData.recruiterId ? (await client.query('SELECT name FROM "User" WHERE id = $1', [validatedData.recruiterId])).rows[0]?.name : 'Unassigned';
        const oldRecruiterName = oldRecruiterId ? (await client.query('SELECT name FROM "User" WHERE id = $1', [oldRecruiterId])).rows[0]?.name : 'Unassigned';
        await logAudit('AUDIT', `Candidate '${existingCandidate.name}' (ID: ${params.id}) recruiter changed from '${oldRecruiterName}' to '${newRecruiterName}' by ${session.user.name}.`, 'API:Candidates:AssignRecruiter', session.user.id, { targetCandidateId: params.id, newRecruiterId: validatedData.recruiterId, oldRecruiterId: oldRecruiterId });
    }


    await client.query('COMMIT');

    const finalQuery = `
        SELECT
            c.id, c.name, c.email, c.phone, c."resumePath", c."parsedData",
            c."positionId", c."fitScore", c.status, c."applicationDate",
            c."recruiterId", c."createdAt", c."updatedAt",
            p.title as "positionTitle",
            p.department as "positionDepartment",
            p.position_level as "positionLevel",
            rec.name as "recruiterName",
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
        LEFT JOIN "User" rec ON c."recruiterId" = rec.id
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
        recruiter: finalResult.rows[0].recruiterId ? {
            id: finalResult.rows[0].recruiterId,
            name: finalResult.rows[0].recruiterName,
            email: null
        } : null,
        transitionHistory: finalResult.rows[0].transitionHistory || [],
    };

    await logAudit('AUDIT', `Candidate '${updatedCandidateWithDetails.name}' (ID: ${params.id}) updated by ${session.user.name}.`, 'API:Candidates:Update', session.user.id, { targetCandidateId: params.id, changes: Object.keys(validatedData) });
    return NextResponse.json(updatedCandidateWithDetails, { status: 200 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(`Failed to update candidate ${params.id}:`, error);
    await logAudit('ERROR', `Failed to update candidate (ID: ${params.id}) by ${session.user.name}. Error: ${error.message}`, 'API:Candidates:Update', session.user.id, { targetCandidateId: params.id });
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
  const allowedRoles: UserProfile['role'][] = ['Admin', 'Recruiter'];
   if (!session?.user?.id || !session.user.role || !allowedRoles.includes(session.user.role)) {
    await logAudit('WARN', `Forbidden attempt to delete candidate (ID: ${params.id}) by user ${session?.user?.email || 'Unknown'} (ID: ${session?.user?.id || 'N/A'}). Required roles: Admin, Recruiter.`, 'API:Candidates:Delete', session?.user?.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Forbidden: Insufficient permissions" }, { status: 403 });
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

    const deleteCandidateQuery = 'DELETE FROM "Candidate" WHERE id = $1';
    await client.query(deleteCandidateQuery, [params.id]);

    await client.query('COMMIT');

    await logAudit('AUDIT', `Candidate '${candidateName}' (ID: ${params.id}) deleted by ${session.user.name}.`, 'API:Candidates:Delete', session.user.id, { targetCandidateId: params.id, deletedCandidateName: candidateName });
    return NextResponse.json({ message: "Candidate deleted successfully" }, { status: 200 });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Failed to delete candidate ${params.id}:`, error);
    await logAudit('ERROR', `Failed to delete candidate (ID: ${params.id}) by ${session.user.name}. Error: ${(error as Error).message}`, 'API:Candidates:Delete', session.user.id, { targetCandidateId: params.id });
    return NextResponse.json({ message: "Error deleting candidate", error: (error as Error).message }, { status: 500 });
  } finally {
    client.release();
  }
}
