// src/app/api/candidates/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { pool } from '../../../lib/db';
import type { CandidateStatus, CandidateDetails, Position, UserProfile } from '@/lib/types';
import { z } from 'zod';
import { logAudit } from '@/lib/auditLog';
import { getServerSession } from 'next-auth/next';
import { v4 as uuidv4 } from 'uuid';

// Zod schemas for validation...
const personalInfoSchema = z.object({
  title_honorific: z.string().optional().nullable(),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  nickname: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  introduction_aboutme: z.string().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
});

const contactInfoSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
});

const educationEntrySchema = z.object({
    major: z.string().optional().nullable(),
    field: z.string().optional().nullable(),
    period: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
    GPA: z.string().optional().nullable(),
    university: z.string().optional().nullable(),
    campus: z.string().optional().nullable(),
});

const experienceEntrySchema = z.object({
    company: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    period: z.string().optional().nullable(),
    duration: z.string().optional().nullable(),
    is_current_position: z.union([z.boolean(), z.string()]).optional(),
    position_level: z.string().optional().nullable(),
});

const skillEntrySchema = z.object({
    segment_skill: z.string().optional().nullable(),
    skill: z.array(z.string()).optional(),
});

const jobSuitableEntrySchema = z.object({
    suitable_career: z.string().optional().nullable(),
    suitable_job_position: z.string().optional().nullable(),
    suitable_job_level: z.string().optional().nullable(),
    suitable_salary_bath_month: z.string().optional().nullable(),
});

const candidateDetailsSchema = z.object({
  cv_language: z.string().optional().nullable(),
  personal_info: personalInfoSchema,
  contact_info: contactInfoSchema,
  education: z.array(educationEntrySchema).optional(),
  experience: z.array(experienceEntrySchema).optional(),
  skills: z.array(skillEntrySchema).optional(),
  job_suitable: z.array(jobSuitableEntrySchema).optional(),
  job_matches: z.array(z.any()).optional(), // Define more specific schema if needed
});

const createCandidateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  recruiterId: z.string().uuid().optional().nullable(),
  fitScore: z.number().min(0).max(100).optional(),
  status: z.string().min(1),
  parsedData: candidateDetailsSchema.optional().nullable(),
  custom_attributes: z.record(z.any()).optional().nullable(),
  resumePath: z.string().optional().nullable(),
});


export async function POST(request: NextRequest) {
    const session = await getServerSession();
    const actingUserId = session?.user?.id;
    const actingUserName = session?.user?.name || session?.user?.email || 'System';

    if (!actingUserId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const validationResult = createCandidateSchema.safeParse(body);
    if (!validationResult.success) {
        return NextResponse.json({ message: "Invalid input", errors: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, phone, positionId, recruiterId, fitScore, status, parsedData, custom_attributes, resumePath } = validationResult.data;
    const newCandidateId = uuidv4();

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const insertCandidateQuery = `
            INSERT INTO "Candidate" (id, name, email, phone, "positionId", "recruiterId", "fitScore", status, "parsedData", custom_attributes, "resumePath", "applicationDate", "updatedAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
            RETURNING *;
        `;
        const candidateResult = await client.query(insertCandidateQuery, [
            newCandidateId, name, email, phone, positionId, recruiterId, fitScore, status, parsedData, custom_attributes, resumePath
        ]);
        const newCandidate = candidateResult.rows[0];

        // Create initial transition record
        const insertTransitionQuery = `
            INSERT INTO "TransitionRecord" (id, "candidateId", "positionId", stage, notes, "actingUserId", date)
            VALUES ($1, $2, $3, $4, $5, $6, NOW());
        `;
        await client.query(insertTransitionQuery, [
            uuidv4(), newCandidateId, positionId, status, 'Initial creation', actingUserId
        ]);

        await client.query('COMMIT');

        await logAudit('AUDIT', `New candidate '${name}' created by ${actingUserName}.`, 'API:Candidates:Create', actingUserId, { candidateId: newCandidateId });
        return NextResponse.json({ message: "Candidate created successfully", candidate: newCandidate }, { status: 201 });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Failed to create candidate:', error);
        await logAudit('ERROR', `Failed to create candidate. Error: ${error.message}`, 'API:Candidates:Create', actingUserId, { input: body });
        if (error.code === '23505' && error.constraint === 'Candidate_email_key') {
             return NextResponse.json({ message: `A candidate with the email "${email}" already exists.` }, { status: 409 });
        }
        return NextResponse.json({ message: 'Error creating candidate', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function GET(request: NextRequest) {
    const session = await getServerSession();
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // Filtering logic...
    const filters: { [key: string]: string | undefined } = {
        status: searchParams.get('status') || undefined,
        positionId: searchParams.get('positionId') || undefined,
        recruiterId: searchParams.get('recruiterId') || undefined,
        searchTerm: searchParams.get('searchTerm') || undefined,
    };

    let whereClauses: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
        whereClauses.push(`c.status = $${paramIndex++}`);
        queryParams.push(filters.status);
    }
    if (filters.positionId) {
        whereClauses.push(`c."positionId" = $${paramIndex++}`);
        queryParams.push(filters.positionId);
    }
    if (filters.recruiterId) {
        whereClauses.push(`c."recruiterId" = $${paramIndex++}`);
        queryParams.push(filters.recruiterId);
    }
    if (filters.searchTerm) {
        whereClauses.push(`(c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`);
        queryParams.push(`%${filters.searchTerm}%`);
        paramIndex++;
    }

    // Add role-based filtering
    if (session.user.role === 'Recruiter') {
        whereClauses.push(`c."recruiterId" = $${paramIndex++}`);
        queryParams.push(session.user.id);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const client = await pool.connect();
    try {
        const candidatesQuery = `
            SELECT c.*, p.title as "positionTitle", r.name as "recruiterName"
            FROM "Candidate" c
            LEFT JOIN "Position" p ON c."positionId" = p.id
            LEFT JOIN "User" r ON c."recruiterId" = r.id
            ${whereString}
            ORDER BY c."applicationDate" DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
        `;
        const candidatesResult = await client.query(candidatesQuery, [...queryParams, limit, offset]);
        
        const totalQuery = `SELECT COUNT(*) FROM "Candidate" c ${whereString};`;
        const totalResult = await client.query(totalQuery, queryParams.slice(0, paramIndex - 1));
        const total = parseInt(totalResult.rows[0].count, 10);
        
        const candidates = candidatesResult.rows.map(row => ({
            ...row,
            position: row.positionId ? { title: row.positionTitle } : null,
            recruiter: row.recruiterId ? { name: row.recruiterName } : null,
        }));

        return NextResponse.json({
            data: candidates,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        }, { status: 200 });

    } catch (error: any) {
        console.error('Failed to fetch candidates:', error);
        return NextResponse.json({ message: 'Error fetching candidates', error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}