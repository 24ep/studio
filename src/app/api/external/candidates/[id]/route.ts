import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { z } from 'zod';
import { verifyApiToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

const updateCandidateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  positionId: z.string().uuid().nullable().optional(),
  recruiterId: z.string().uuid().nullable().optional(),
  fitScore: z.number().min(0).max(100).optional(),
  status: z.string().min(1).optional(),
  parsedData: z.record(z.any()).optional().nullable(),
  custom_attributes: z.record(z.any()).optional().nullable(),
  resumePath: z.string().optional().nullable(),
  transitionNotes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const { id } = params;
  const client = await getPool().connect();
  try {
    const candidateQuery = `
      SELECT c.*, p.title as "positionTitle", p.department as "positionDepartment", r.name as "recruiterName"
      FROM "Candidate" c
      LEFT JOIN "Position" p ON c."positionId" = p.id
      LEFT JOIN "User" r ON c."recruiterId" = r.id
      WHERE c.id = $1;
    `;
    const candidateResult = await client.query(candidateQuery, [id]);
    if (candidateResult.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Candidate not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    const candidate = candidateResult.rows[0];
    // Get job matches for this candidate
    const jobMatchesQuery = `
      SELECT jm.*, p.title as "positionTitle"
      FROM "JobMatch" jm
      LEFT JOIN "Position" p ON jm."jobId" = p.id
      WHERE jm."candidateId" = $1
      ORDER BY jm."fitScore" DESC;
    `;
    const jobMatchesResult = await client.query(jobMatchesQuery, [id]);
    // Get resume history for this candidate
    const resumeHistoryQuery = `
      SELECT rh.*, u.name as "uploadedByUserName"
      FROM "ResumeHistory" rh
      LEFT JOIN "User" u ON rh."uploadedByUserId" = u.id
      WHERE rh."candidateId" = $1
      ORDER BY rh."uploadedAt" DESC;
    `;
    const resumeHistoryResult = await client.query(resumeHistoryQuery, [id]);
    return new Response(JSON.stringify({
      ...candidate,
      custom_attributes: candidate.customAttributes || {},
      position: candidate.positionId ? {
        title: candidate.positionTitle,
        department: candidate.positionDepartment
      } : null,
      recruiter: candidate.recruiterId ? { name: candidate.recruiterName } : null,
      jobMatches: jobMatchesResult.rows,
      resumeHistory: resumeHistoryResult.rows,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error fetching candidate', details: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } finally {
    client.release();
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  if (!user || (user.role !== 'Admin' && !user.modulePermissions?.includes('CANDIDATES_MANAGE'))) {
    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  const { id } = params;
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const validationResult = updateCandidateSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(JSON.stringify({ error: 'Invalid input', details: validationResult.error.flatten().fieldErrors }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const { name, email, phone, positionId, recruiterId, fitScore, status, parsedData, custom_attributes, resumePath } = validationResult.data;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const existingResult = await client.query('SELECT * FROM "Candidate" WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return new Response(JSON.stringify({ error: 'Candidate not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    const existingCandidate = existingResult.rows[0];
    const oldStatus = existingCandidate.status;
    const updateQuery = `
      UPDATE "Candidate" 
      SET name = $1, email = $2, phone = $3, "positionId" = $4, "recruiterId" = $5, 
          "fitScore" = $6, status = $7, "parsedData" = $8, "customAttributes" = $9, 
          "resumePath" = $10, "updatedAt" = NOW()
      WHERE id = $11
      RETURNING *;
    `;
    const updateResult = await client.query(updateQuery, [
      name, email, phone, positionId, recruiterId, fitScore, status, parsedData, custom_attributes, resumePath, id
    ]);
    // Create transition record if status changed
    if (oldStatus !== status) {
      const insertTransitionQuery = `
        INSERT INTO "TransitionRecord" (id, "candidateId", "positionId", stage, notes, "actingUserId", date)
        VALUES ($1, $2, $3, $4, $5, $6, NOW());
      `;
      await client.query(insertTransitionQuery, [
        uuidv4(), id, positionId, status, 'Status changed via API', user.id
      ]);
    }
    await client.query('COMMIT');
    const updatedCandidate = updateResult.rows[0];
    return new Response(JSON.stringify({
      message: 'Candidate updated successfully',
      candidate: {
        ...updatedCandidate,
        custom_attributes: updatedCandidate.customAttributes || {},
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    await client.query('ROLLBACK');
    return new Response(JSON.stringify({ error: 'Error updating candidate', details: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } finally {
    client.release();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  const user = token ? await verifyApiToken(token) : null;
  if (!user || (user.role !== 'Admin' && !user.modulePermissions?.includes('CANDIDATES_MANAGE'))) {
    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  const { id } = params;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const existingResult = await client.query('SELECT * FROM "Candidate" WHERE id = $1', [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return new Response(JSON.stringify({ error: 'Candidate not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    await client.query('DELETE FROM "Candidate" WHERE id = $1', [id]);
    await client.query('COMMIT');
    return new Response(JSON.stringify({ message: 'Candidate deleted successfully' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    await client.query('ROLLBACK');
    return new Response(JSON.stringify({ error: 'Error deleting candidate', details: (error as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  } finally {
    client.release();
  }
} 