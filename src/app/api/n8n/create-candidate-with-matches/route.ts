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
}).passthrough(); // Allow extra fields

const experienceEntrySchema = z.object({
  company: z.string().optional().default(''),
  position: z.string().optional().default(''),
  description: z.string().optional().default(''),
  period: z.string().optional().default(''),
  duration: z.string().optional().default(''),
  is_current_position: z.boolean().optional().default(false),
  postition_level: z.enum(['entry level', 'mid level', 'senior level', 'lead', 'manager', 'executive']).optional(),
}).passthrough(); // Allow extra fields

const skillEntrySchema = z.object({
  segment_skill: z.string().optional().default(''),
  skill: z.array(z.string()).optional().default([]),
}).passthrough(); // Allow extra fields

const jobSuitableEntrySchema = z.object({
  suitable_career: z.string().optional().default(''),
  suitable_job_position: z.string().optional().default(''),
  suitable_job_level: z.string().optional().default(''),
  suitable_salary_bath_month: z.string().optional().nullable(), // Allow null
}).passthrough(); // Allow extra fields

const associatedMatchDetailsSchema = z.object({
  jobTitle: z.string(),
  fitScore: z.number(),
  reasons: z.array(z.string()),
  n8nJobId: z.string().optional(),
}).optional();

const candidateDetailsSchema = z.object({
  cv_language: z.string().optional().default(''),
  personal_info: personalInfoSchema,
  contact_info: contactInfoSchema,
  education: z.array(educationEntrySchema).optional().default([]),
  experience: z.array(experienceEntrySchema).optional().default([]),
  skills: z.array(skillEntrySchema).optional().default([]),
  job_suitable: z.array(jobSuitableEntrySchema).optional().default([]),
  associatedMatchDetails: associatedMatchDetailsSchema,
}).passthrough(); // Allow extra fields

const n8nJobMatchSchema = z.object({
  job_id: z.string(),
  job_title: z.string(),
  fit_score: z.number(),
  match_reasons: z.array(z.string()),
});

const n8nWebhookPayloadSchema = z.object({
  name: z.string().min(1, "Candidate name is required"),
  email: z.string().email("Valid candidate email is required"),
  phone: z.string().nullable().optional(),
  parsedData: candidateDetailsSchema,
  top_matches: z.array(n8nJobMatchSchema).optional(),
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

  const { name, email, phone, parsedData, top_matches } = validationResult.data;
  let positionId: string | null = null;
  let fitScore: number = 0;
  let finalParsedData: CandidateDetails = { ...parsedData }; // Start with parsedData from n8n

  const client = await pool.connect();
  const newCandidateId = uuidv4();

  try {
    await client.query('BEGIN');

    // Check if candidate with this email already exists
    const existingCandidateQuery = 'SELECT id FROM "Candidate" WHERE email = $1';
    const existingCandidateResult = await client.query(existingCandidateQuery, [email]);
    if (existingCandidateResult.rows.length > 0) {
      await client.query('ROLLBACK');
      const existingId = existingCandidateResult.rows[0].id;
      await logAudit('WARN', `N8N Webhook: Candidate with email '${email}' already exists (ID: ${existingId}). Creation skipped.`, 'API:N8N:CreateCandidate', null, { email });
      return NextResponse.json({ message: `Candidate with email ${email} already exists.`, candidateId: existingId }, { status: 409 });
    }

    if (top_matches && top_matches.length > 0) {
      const topMatch = top_matches[0]; // Assuming the first match is the best one

      // Try to find the position in the database by title
      const positionQuery = 'SELECT id FROM "Position" WHERE title = $1 AND "isOpen" = TRUE LIMIT 1';
      const positionResult = await client.query(positionQuery, [topMatch.job_title]);

      if (positionResult.rows.length > 0) {
        positionId = positionResult.rows[0].id;
        fitScore = topMatch.fit_score;
        // Update finalParsedData with associated match details
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
      phone || null,
      positionId,
      fitScore,
      'Applied' as CandidateStatus, // Default status
      new Date().toISOString(),
      finalParsedData, // Store the potentially enriched parsedData
    ];
    const candidateResult = await client.query(insertCandidateQuery, candidateValues);
    const newCandidate = candidateResult.rows[0];

    // Add an initial transition record
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
