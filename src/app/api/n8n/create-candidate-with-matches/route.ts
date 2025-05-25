// src/app/api/n8n/create-candidate-with-matches/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { z } from 'zod';
import type { N8NWebhookPayload, CandidateDetails, Position, CandidateStatus, N8NJobMatch, PersonalInfo, ContactInfo, EducationEntry, ExperienceEntry, SkillEntry, JobSuitableEntry } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { v4 as uuidv4 } from 'uuid';

// Zod schemas for validation, mirroring types.ts
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
}).passthrough();

const experienceEntrySchema = z.object({
  company: z.string().optional().default(''),
  position: z.string().optional().default(''),
  description: z.string().optional().default(''),
  period: z.string().optional().default(''),
  duration: z.string().optional().default(''),
  is_current_position: z.boolean().optional().default(false),
  postition_level: z.enum(['entry level', 'mid level', 'senior level', 'lead', 'manager', 'executive']).optional(),
}).passthrough();

const skillEntrySchema = z.object({
  segment_skill: z.string().optional().default(''),
  skill: z.array(z.string()).optional().default([]),
}).passthrough();

const jobSuitableEntrySchema = z.object({
  suitable_career: z.string().optional().default(''),
  suitable_job_position: z.string().optional().default(''),
  suitable_job_level: z.string().optional().default(''),
  suitable_salary_bath_month: z.string().optional().nullable(),
}).passthrough();

const candidateDetailsSchemaForN8N = z.object({
  cv_language: z.string().optional().default(''),
  personal_info: personalInfoSchema,
  contact_info: contactInfoSchema,
  education: z.array(educationEntrySchema).optional().default([]),
  experience: z.array(experienceEntrySchema).optional().default([]),
  skills: z.array(skillEntrySchema).optional().default([]),
  job_suitable: z.array(jobSuitableEntrySchema).optional().default([]),
  // associatedMatchDetails is NOT expected from n8n directly in this part of the payload
  // it's constructed by this API if a match is found
}).passthrough();


const n8nJobMatchSchema = z.object({
  job_id: z.string(),
  job_title: z.string(),
  fit_score: z.number(),
  match_reasons: z.array(z.string()),
});

// Updated n8nWebhookPayloadSchema to directly reflect the new JSON structure
const n8nWebhookPayloadSchema = candidateDetailsSchemaForN8N.extend({
  job_matches: z.array(n8nJobMatchSchema).optional(),
});


const candidateStatusValues: [CandidateStatus, ...CandidateStatus[]] = ['Applied', 'Screening', 'Shortlisted', 'Interview Scheduled', 'Interviewing', 'Offer Extended', 'Offer Accepted', 'Hired', 'Rejected', 'On Hold'];


export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("N8N Webhook: Error parsing request body:", error);
    await logAudit('ERROR', 'N8N Webhook: Error parsing request body.', 'API:N8N:CreateCandidate', null, { error: (error as Error).message });
    return NextResponse.json({ message: "Error parsing request body", error: (error as Error).message }, { status: 400 });
  }

  const validationResult = n8nWebhookPayloadSchema.safeParse(body);
  if (!validationResult.success) {
    console.error("N8N Webhook: Invalid input:", validationResult.error.flatten().fieldErrors);
    await logAudit('ERROR', 'N8N Webhook: Invalid input.', 'API:N8N:CreateCandidate', null, { errors: validationResult.error.flatten().fieldErrors });
    return NextResponse.json(
      { message: "Invalid input for n8n candidate creation", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const payload = validationResult.data;
  const { personal_info, contact_info, job_matches, ...otherDetails } = payload;

  const name = `${personal_info.firstname} ${personal_info.lastname}`.trim();
  const email = contact_info.email;
  const phone = contact_info.phone || null;

  let positionId: string | null = null;
  let fitScore: number = 0;
  let finalParsedData: CandidateDetails = { ...otherDetails, personal_info, contact_info }; // This will be stored in the DB

  const client = await pool.connect();
  const newCandidateId = uuidv4();

  try {
    await client.query('BEGIN');

    const existingCandidateQuery = 'SELECT id FROM "Candidate" WHERE email = $1';
    const existingCandidateResult = await client.query(existingCandidateQuery, [email]);
    if (existingCandidateResult.rows.length > 0) {
      await client.query('ROLLBACK');
      const existingId = existingCandidateResult.rows[0].id;
      await logAudit('WARN', `N8N Webhook: Candidate with email '${email}' already exists (ID: ${existingId}). Creation skipped.`, 'API:N8N:CreateCandidate', null, { email });
      return NextResponse.json({ message: `Candidate with email ${email} already exists.`, candidateId: existingId }, { status: 409 });
    }

    if (job_matches && job_matches.length > 0) {
      const topMatch = job_matches[0]; 

      const positionQuery = 'SELECT id FROM "Position" WHERE title ILIKE $1 AND "isOpen" = TRUE LIMIT 1'; // Using ILIKE for case-insensitive match
      const positionResult = await client.query(positionQuery, [topMatch.job_title]);

      if (positionResult.rows.length > 0) {
        positionId = positionResult.rows[0].id;
        fitScore = topMatch.fit_score;
        finalParsedData.associatedMatchDetails = {
          jobTitle: topMatch.job_title,
          fitScore: topMatch.fit_score,
          reasons: topMatch.match_reasons,
          n8nJobId: topMatch.job_id,
        };
        await logAudit('INFO', `N8N Webhook: Matched candidate '${name}' to position '${topMatch.job_title}' (ID: ${positionId}) with fit score ${fitScore}.`, 'API:N8N:CreateCandidate');
      } else {
        await logAudit('INFO', `N8N Webhook: No open position found matching title '${topMatch.job_title}' for candidate '${name}'. Candidate will be created without position assignment.`, 'API:N8N:CreateCandidate');
      }
    }

    const insertCandidateQuery = `
      INSERT INTO "Candidate" (id, name, email, phone, "positionId", "fitScore", status, "applicationDate", "parsedData", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *;
    `;
    const candidateValues = [
      newCandidateId,
      name,
      email,
      phone,
      positionId,
      fitScore,
      'Applied' as CandidateStatus, 
      new Date().toISOString(),
      finalParsedData, 
    ];
    const candidateResult = await client.query(insertCandidateQuery, candidateValues);
    const newCandidate = candidateResult.rows[0];

    const insertTransitionQuery = `
      INSERT INTO "TransitionRecord" (id, "candidateId", date, stage, notes, "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), $3, $4, NOW(), NOW());
    `;
    await client.query(insertTransitionQuery, [
      uuidv4(),
      newCandidate.id,
      'Applied' as CandidateStatus,
      'Candidate created via n8n webhook from resume processing.',
    ]);

    await client.query('COMMIT');
    await logAudit('AUDIT', `N8N Webhook: Candidate '${newCandidate.name}' (ID: ${newCandidate.id}) created successfully.`, 'API:N8N:CreateCandidate', null, { candidateId: newCandidate.id, name: newCandidate.name });
    return NextResponse.json({ message: "Candidate created successfully from n8n webhook", candidate: newCandidate }, { status: 201 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("N8N Webhook: Error creating candidate:", error);
    await logAudit('ERROR', `N8N Webhook: Error creating candidate '${name}'. Error: ${error.message}`, 'API:N8N:CreateCandidate', null, { name, email, error: error.message });
    return NextResponse.json({ message: "Error creating candidate from n8n webhook", error: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
