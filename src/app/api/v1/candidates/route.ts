import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { verifyApiToken } from '@/lib/auth';
import { handleCors } from '@/lib/cors';

const candidateDetailsSchema = z.object({
  cv_language: z.string().optional().nullable(),
  personal_info: z.object({
    title_honorific: z.string().optional().nullable(),
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    nickname: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    introduction_aboutme: z.string().optional().nullable(),
    avatar_url: z.string().url().optional().nullable(),
  }),
  contact_info: z.object({
    email: z.string().email(),
    phone: z.string().optional().nullable(),
  }),
  education: z.array(z.any()).optional(),
  experience: z.array(z.any()).optional(),
  skills: z.array(z.any()).optional(),
  job_suitable: z.array(z.any()).optional(),
  job_matches: z.array(z.any()).optional(),
});

const createCandidateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  recruiterId: z.string().uuid().optional().nullable(),
  fitScore: z.number().min(0).max(100).optional(),
  status: z.string().min(1),
  parsedData: candidateDetailsSchema.optional().nullable(),
  custom_attributes: z.record(z.any()).optional().nullable(),
  resumePath: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (user.role !== 'Admin' && !user.modulePermissions?.includes('CANDIDATES_VIEW')) {
    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to view candidates' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;
  const filters = {
    status: searchParams.get('status') || undefined,
    positionId: searchParams.get('positionId') || undefined,
    recruiterId: searchParams.get('recruiterId') || searchParams.get('assignedRecruiterId') || undefined,
    searchTerm: searchParams.get('searchTerm') || undefined,
  };
  let whereClauses = [];
  let queryParams = [];
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
    if (filters.recruiterId === 'unassigned') {
      whereClauses.push(`c."recruiterId" IS NULL`);
    } else {
      whereClauses.push(`c."recruiterId" = $${paramIndex++}`);
      queryParams.push(filters.recruiterId);
    }
  }
  if (filters.searchTerm) {
    whereClauses.push(`(c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`);
    queryParams.push(`%${filters.searchTerm}%`);
    paramIndex++;
  }
  // If user is a Recruiter, only show their assigned candidates
  if (user.role === 'Recruiter') {
    whereClauses.push(`c."recruiterId" = $${paramIndex++}`);
    queryParams.push(user.id);
  }
  let query = 'SELECT c.* FROM "Candidate" c';
  let countQuery = 'SELECT COUNT(*) FROM "Candidate" c';
  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
    countQuery += ' WHERE ' + whereClauses.join(' AND ');
  }
  query += ' ORDER BY c."updatedAt" DESC';
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(limit, offset);
  const client = await getPool().connect();
  try {
    const result = await client.query(query, queryParams);
    const countResult = await client.query(countQuery, queryParams.slice(0, paramIndex - 1));
    const total = parseInt(countResult.rows[0].count, 10);
    const candidates = result.rows.map(row => ({
      ...row,
      custom_attributes: row.customAttributes || {},
    }));
    return new Response(JSON.stringify({ candidates, total, page, limit }), { status: 200, headers: handleCors(req) });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error fetching candidates', details: (error as Error).message }), { status: 500, headers: handleCors(req) });
  } finally {
    client.release();
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  if (user.role !== 'Admin' && !user.modulePermissions?.includes('CANDIDATES_MANAGE')) {
    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions to create candidates' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const validationResult = createCandidateSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid input', details: validationResult.error.flatten().fieldErrors }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const { name, email, phone, positionId, recruiterId, fitScore, status, parsedData, custom_attributes, resumePath } = validationResult.data;
  const newCandidateId = uuidv4();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const insertCandidateQuery = `
      INSERT INTO "Candidate" (id, name, email, phone, "positionId", "recruiterId", "fitScore", status, "parsedData", "customAttributes", "resumePath", "applicationDate", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *;
    `;
    const candidateResult = await client.query(insertCandidateQuery, [
      newCandidateId, name, email, phone, positionId, recruiterId, fitScore, status, parsedData, custom_attributes, resumePath
    ]);
    const newCandidate = candidateResult.rows[0];
    // Create initial transition record
    const insertTransitionQuery = `
      INSERT INTO "TransitionRecord" (id, "candidateId", "positionId", stage, notes, "actingUserId", date, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW());
    `;
    await client.query(insertTransitionQuery, [
      uuidv4(), newCandidateId, positionId, status, 'Initial creation', user.id
    ]);
    await client.query('COMMIT');
    return new Response(JSON.stringify({ message: 'Candidate created successfully', candidate: newCandidate }), { status: 201, headers: handleCors(req) });
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as any).code === '23505' && (error as any).constraint === 'Candidate_email_key') {
      return new Response(JSON.stringify({ error: `A candidate with the email "${email}" already exists.` }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ error: 'Error creating candidate', details: (error as Error).message }), { status: 500, headers: handleCors(req) });
  } finally {
    client.release();
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = handleCors(request);
  return new Response(null, { status: 200, headers });
} 