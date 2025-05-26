
// src/app/api/n8n/create-candidate-with-matches/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { z } from 'zod';
import type { CandidateDetails, Position, CandidateStatus, N8NJobMatch, PersonalInfo, ContactInfo, EducationEntry, ExperienceEntry, SkillEntry, JobSuitableEntry, PositionLevel } from '@/lib/types'; // Ensure PositionLevel is imported if still used conceptually
import { logAudit } from '@/lib/auditLog';
import { v4 as uuidv4 } from 'uuid';

// Keep the enum for reference or potential future use in other contexts,
// but it won't be directly used for 'postition_level' in this specific n8n schema.
const positionLevelEnumValues: [PositionLevel, ...PositionLevel[]] = [
    'entry level', 'mid level', 'senior level', 'lead', 'manager', 'executive', 'officer', 'leader'
];

const personalInfoSchema = z.object({
  title_honorific: z.string().optional().default(''),
  firstname: z.string().min(1, "First name is required"),
  lastname: z.string().min(1, "Last name is required"),
  nickname: z.string().optional().default(''),
  location: z.string().optional().default(''),
  introduction_aboutme: z.string().optional().default(''),
}).passthrough();

const contactInfoSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().default(''),
}).passthrough();

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
  is_current_position: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const lowerVal = val.toLowerCase();
        if (lowerVal === 'true') return true;
        if (lowerVal === 'false' || lowerVal === 'none' || lowerVal === '') return false;
      }
      if (val === null || val === undefined) return false;
      return val; 
    },
    z.boolean().optional().default(false)
  ),
  postition_level: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const lowerVal = val.toLowerCase();
        if (lowerVal === 'none' || lowerVal === '') return undefined; // Treat "None" or empty string as optional
        return lowerVal; // Convert to lowercase
      }
      return val;
    },
    z.string().optional() // Changed from z.enum to z.string().optional()
  ),
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
}).passthrough();

const n8nJobMatchSchema = z.object({
  job_id: z.string().optional(),
  job_title: z.string().min(1, "Job title is required"),
  fit_score: z.number().min(0).max(100, "Fit score must be between 0 and 100"),
  match_reasons: z.array(z.string()).optional().default([]),
}).passthrough();

const n8nCandidateWebhookEntrySchema = z.object({
  candidate_info: candidateDetailsSchemaForN8N,
  jobs: z.array(n8nJobMatchSchema).optional().default([]), // Changed from job_matches
});

const n8nWebhookPayloadSchema = n8nCandidateWebhookEntrySchema; // Now expects a single object


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
    console.error("N8N Webhook: Invalid input:", JSON.stringify(validationResult.error.flatten(), null, 2));
    await logAudit('ERROR', 'N8N Webhook: Invalid input received from n8n.', 'API:N8N:CreateCandidate', null, { errors: validationResult.error.flatten() });
    return NextResponse.json(
      { message: "Invalid input for n8n candidate creation", errors: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const payload = validationResult.data; 
  let client; 

  try {
    client = await pool.connect(); 

    const { candidate_info, jobs: job_matches } = payload; // 'jobs' from payload becomes 'job_matches' internally
    const { personal_info, contact_info } = candidate_info;

    const name = `${personal_info.firstname} ${personal_info.lastname}`.trim();
    const email = contact_info.email;
    const phone = contact_info.phone || null;

    if (!name) {
      await logAudit('WARN', `N8N Webhook: Skipped candidate due to missing name. Email: ${email}`, 'API:N8N:CreateCandidate', null, { email });
      return NextResponse.json({ status: 'error', email, message: "Candidate name (derived from firstname and lastname) cannot be empty."}, { status: 400});
    }
    if (!email) {
      await logAudit('WARN', `N8N Webhook: Skipped candidate due to missing email. Name: ${name}`, 'API:N8N:CreateCandidate', null, { name });
      return NextResponse.json({ status: 'error', name, message: "Candidate email cannot be empty."}, { status: 400});
    }

    let positionId: string | null = null;
    let fitScore: number = 0;
    
    // Construct the full parsedData object to be stored in the database
    // This includes all fields from candidate_info
    const fullParsedDataFromN8N: CandidateDetails = {
      cv_language: candidate_info.cv_language || '',
      personal_info: candidate_info.personal_info,
      contact_info: candidate_info.contact_info,
      education: candidate_info.education || [],
      experience: candidate_info.experience || [],
      skills: candidate_info.skills || [],
      job_suitable: candidate_info.job_suitable || [],
      // associatedMatchDetails will be added below if a match is found
    };

    try { 
      await client.query('BEGIN');

      const existingCandidateQuery = 'SELECT id FROM "Candidate" WHERE email = $1';
      const existingCandidateResult = await client.query(existingCandidateQuery, [email]);
      if (existingCandidateResult.rows.length > 0) {
        await client.query('ROLLBACK'); 
        const existingId = existingCandidateResult.rows[0].id;
        await logAudit('WARN', `N8N Webhook: Candidate with email '${email}' already exists (ID: ${existingId}). Creation skipped.`, 'API:N8N:CreateCandidate', null, { email });
        return NextResponse.json({ status: 'skipped', email, message: `Candidate with email ${email} already exists.`, candidateId: existingId }, { status: 409 });
      }

      if (job_matches && job_matches.length > 0) {
        const topMatch = job_matches[0];

        const positionQuery = 'SELECT id FROM "Position" WHERE title ILIKE $1 AND "isOpen" = TRUE LIMIT 1';
        const positionResult = await client.query(positionQuery, [topMatch.job_title]);

        if (positionResult.rows.length > 0) {
          positionId = positionResult.rows[0].id;
          fitScore = topMatch.fit_score;
          fullParsedDataFromN8N.associatedMatchDetails = { // Add match details to parsedData
            jobTitle: topMatch.job_title,
            fitScore: topMatch.fit_score,
            reasons: topMatch.match_reasons || [],
            n8nJobId: topMatch.job_id,
          };
          await logAudit('INFO', `N8N Webhook: Matched candidate '${name}' to position '${topMatch.job_title}' (ID: ${positionId}) with fit score ${fitScore}.`, 'API:N8N:CreateCandidate', null, { candidateName: name, positionTitle: topMatch.job_title, positionId, fitScore});
        } else {
          await logAudit('INFO', `N8N Webhook: No open position found matching title '${topMatch.job_title}' for candidate '${name}'. Candidate will be created without position assignment.`, 'API:N8N:CreateCandidate', null, { candidateName: name, searchedPositionTitle: topMatch.job_title });
        }
      }

      const newCandidateId = uuidv4();
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
        fullParsedDataFromN8N, // Store the complete parsed data
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

      const finalCandidateQuery = `
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
      const finalResult = await client.query(finalCandidateQuery, [newCandidate.id]);
      const createdCandidateWithDetails = finalResult.rows.length > 0 ? {
          ...finalResult.rows[0],
          parsedData: finalResult.rows[0].parsedData || { personal_info: {}, contact_info: {} }, // Ensure parsedData defaults
          position: finalResult.rows[0].positionId ? {
              id: finalResult.rows[0].positionId,
              title: finalResult.rows[0].positionTitle,
              department: finalResult.rows[0].positionDepartment,
          } : null,
          transitionHistory: finalResult.rows[0].transitionHistory || [],
      } : null;

      await logAudit('AUDIT', `N8N Webhook: Candidate '${newCandidate.name}' (ID: ${newCandidate.id}) created successfully.`, 'API:N8N:CreateCandidate', null, { candidateId: newCandidate.id, name: newCandidate.name });
      return NextResponse.json({ status: 'success', candidate: createdCandidateWithDetails, message: `Candidate ${name} created.` }, { status: 201 });

    } catch (error: any) { 
      if (client) await client.query('ROLLBACK'); 
      console.error("N8N Webhook: Error creating candidate:", error);
      const candidateNameForLog = `${candidate_info.personal_info.firstname} ${candidate_info.personal_info.lastname}`.trim() || 'Unknown Candidate';
      const candidateEmailForLog = candidate_info.contact_info.email || 'unknown_email@example.com';

      await logAudit('ERROR', `N8N Webhook: Error processing candidate for '${candidateNameForLog}'. Error: ${error.message}`, 'API:N8N:CreateCandidate', null, { name: candidateNameForLog, email: candidateEmailForLog, error: error.message });
      return NextResponse.json({ status: 'error', email: candidateEmailForLog, message: error.message }, { status: 500 });
    }
  } catch (batchProcessingError: any) { 
    // This outer catch is for errors before client connection or if the payload wasn't an array (though now it's a single object)
    console.error("N8N Webhook: Error processing webhook request:", batchProcessingError);
    await logAudit('ERROR', `N8N Webhook: Error processing webhook request. Error: ${batchProcessingError.message}`, 'API:N8N:CreateCandidate', null, { error: batchProcessingError.message });
    return NextResponse.json({ message: "Error processing webhook request.", error: batchProcessingError.message }, { status: 500 });
  } finally {
    if (client) {
      client.release(); 
    }
  }
}
