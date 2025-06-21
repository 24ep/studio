// src/app/api/n8n/create-candidate-with-matches/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../../../lib/db';
import { logAudit } from '@/lib/auditLog';

const jobMatchSchema = z.object({
  job_id: z.string().optional(),
  job_title: z.string().optional(),
  fit_score: z.number().optional(),
  match_reasons: z.array(z.string()).optional(),
  job_description_summary: z.string().optional(),
});

const candidateDataSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  status: z.string().optional().default('New'),
  avatarUrl: z.string().url().optional().nullable(),
  positionId: z.string().uuid().optional().nullable(),
  recruiterId: z.string().uuid().optional().nullable(),
  parsedData: z.record(z.any()).optional(),
  fitScore: z.number().optional().default(0),
  dataAiHint: z.string().optional().nullable(),
});

const requestSchema = z.object({
  candidate: candidateDataSchema,
  job_matches: z.array(jobMatchSchema).optional(),
});

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.N8N_API_KEY) {
    return NextResponse.json({ message: 'Unauthorized: Invalid API Key' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = requestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: 'Invalid input', errors: validation.error.flatten().fieldErrors }, { status: 400 });
  }

  const { candidate, job_matches } = validation.data;
  const newCandidateId = uuidv4();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Add job matches to parsedData if they exist
    if (job_matches && job_matches.length > 0) {
      candidate.parsedData = {
        ...candidate.parsedData,
        job_matches: job_matches,
      };
    }

    const insertCandidateQuery = `
      INSERT INTO "Candidate" (id, name, email, phone, status, "avatarUrl", "positionId", "recruiterId", "parsedData", "fitScore", "dataAiHint", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *;
    `;
    const candidateParams = [
      newCandidateId,
      candidate.name,
      candidate.email,
      candidate.phone,
      candidate.status,
      candidate.avatarUrl,
      candidate.positionId,
      candidate.recruiterId,
      candidate.parsedData ? JSON.stringify(candidate.parsedData) : null,
      candidate.fitScore,
      candidate.dataAiHint,
    ];

    const newCandidateResult = await client.query(insertCandidateQuery, candidateParams);
    const newCandidate = newCandidateResult.rows[0];

    if (job_matches && job_matches.length > 0) {
        for (const match of job_matches) {
            const insertMatchQuery = `
                INSERT INTO "JobMatch" (id, "candidateId", "jobId", "jobTitle", "fitScore", "matchReasons", "jobDescriptionSummary", "createdAt", "updatedAt")
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW());
            `;
            const matchParams = [
                uuidv4(),
                newCandidateId,
                match.job_id,
                match.job_title,
                match.fit_score,
                match.match_reasons,
                match.job_description_summary
            ];
            await client.query(insertMatchQuery, matchParams);
        }
    }
    
    await client.query('COMMIT');
    
    await logAudit('AUDIT', `New candidate '${candidate.name}' created via n8n workflow.`, 'API:n8n:CreateCandidate', 'n8n_workflow', { candidateId: newCandidateId });
    return NextResponse.json({ message: 'Candidate and matches created successfully', candidate: newCandidate }, { status: 201 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error in n8n/create-candidate-with-matches:', error);
    if (error.code === '23505' && error.constraint === 'Candidate_email_key') {
      return NextResponse.json({ message: `A candidate with email '${candidate.email}' already exists.` }, { status: 409 });
    }
    await logAudit('ERROR', `Failed to create candidate via n8n. Error: ${error.message}`, 'API:n8n:CreateCandidate', 'n8n_workflow', { input: body });
    return NextResponse.json({ message: 'Error creating candidate', error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
