
// src/app/api/n8n/create-candidate-with-matches/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { z } from 'zod';
import type { N8NCandidateWebhookEntry, CandidateDetails, Position, CandidateStatus, N8NJobMatch, PersonalInfo, ContactInfo, EducationEntry, ExperienceEntry, SkillEntry, JobSuitableEntry, PositionLevel } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { v4 as uuidv4 } from 'uuid';

const positionLevelEnumValues: [PositionLevel, ...PositionLevel[]] = [
    'entry level', 'mid level', 'senior level', 'lead', 'manager', 'executive', 'officer', 'leader'
];

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
  is_current_position: z.preprocess(
    (val) => {
      if (val === "") return false;
      if (val === null || val === undefined) return false;
      if (typeof val === 'string' && val.toLowerCase() === 'true') return true;
      if (typeof val === 'string' && val.toLowerCase() === 'false') return false;
      return val;
    },
    z.boolean().optional().default(false)
  ),
  postition_level: z.enum(positionLevelEnumValues).optional(),
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
  job_id: z.string().optional(), // Made optional as per example
  job_title: z.string(),
  fit_score: z.number(),
  match_reasons: z.array(z.string()),
});

// This schema represents one item in the array that n8n sends
const n8nCandidateWebhookEntrySchema = z.object({
  candidate_info: candidateDetailsSchemaForN8N,
  jobs: z.array(n8nJobMatchSchema).optional().default([]), // Assuming 'jobs' is the correct key from n8n for job matches
});

// The overall payload from n8n is an array of these entries
const n8nWebhookPayloadSchema = z.array(n8nCandidateWebhookEntrySchema);


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

  const payloadArray = validationResult.data; // This is an array of N8NCandidateWebhookEntry
  const results = [];
  let client; // Declare client here so it can be used in finally

  try {
    client = await pool.connect(); // Connect once for the entire batch

    for (const entry of payloadArray) {
      const { candidate_info, jobs: job_matches } = entry; // 'jobs' is the key from n8n for matches
      const { personal_info, contact_info } = candidate_info;

      const name = `${personal_info.firstname} ${personal_info.lastname}`.trim();
      const email = contact_info.email;
      const phone = contact_info.phone || null;

      if (!name) {
        results.push({ status: 'error', email, message: "Candidate name (derived from firstname and lastname) cannot be empty."});
        await logAudit('WARN', `N8N Webhook: Skipped candidate due to missing name. Email: ${email}`, 'API:N8N:CreateCandidate', null, { email });
        continue; // Skip to the next candidate in the batch
      }
      if (!email) {
        results.push({ status: 'error', name, message: "Candidate email cannot be empty."});
        await logAudit('WARN', `N8N Webhook: Skipped candidate due to missing email. Name: ${name}`, 'API:N8N:CreateCandidate', null, { name });
        continue; // Skip to the next candidate in the batch
      }

      let positionId: string | null = null;
      let fitScore: number = 0;
      let finalParsedData: CandidateDetails = {
        ...candidate_info, // This includes cv_language, personal_info, contact_info, education etc.
        // associatedMatchDetails will be added below if a match is found
      };

      try { // Inner try for each candidate's database transaction
        await client.query('BEGIN');

        const existingCandidateQuery = 'SELECT id FROM "Candidate" WHERE email = $1';
        const existingCandidateResult = await client.query(existingCandidateQuery, [email]);
        if (existingCandidateResult.rows.length > 0) {
          await client.query('ROLLBACK'); // Rollback the current transaction
          const existingId = existingCandidateResult.rows[0].id;
          await logAudit('WARN', `N8N Webhook: Candidate with email '${email}' already exists (ID: ${existingId}). Creation skipped.`, 'API:N8N:CreateCandidate', null, { email });
          results.push({ status: 'skipped', email, message: `Candidate with email ${email} already exists.`, candidateId: existingId });
          continue; // Skip to the next candidate
        }

        if (job_matches && job_matches.length > 0) {
          const topMatch = job_matches[0];

          // Try to find a matching position (case-insensitive title match for open positions)
          const positionQuery = 'SELECT id FROM "Position" WHERE title ILIKE $1 AND "isOpen" = TRUE LIMIT 1';
          const positionResult = await client.query(positionQuery, [topMatch.job_title]);

          if (positionResult.rows.length > 0) {
            positionId = positionResult.rows[0].id;
            fitScore = topMatch.fit_score;
            // Add match details to the parsedData that will be stored
            finalParsedData.associatedMatchDetails = {
              jobTitle: topMatch.job_title,
              fitScore: topMatch.fit_score,
              reasons: topMatch.match_reasons,
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
          finalParsedData, // This now includes all info from candidate_info + associatedMatchDetails
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

        await client.query('COMMIT'); // Commit the transaction for this candidate

        // Fetch the created candidate with position details for the response
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
        } : null;

        results.push({ status: 'success', candidate: createdCandidateWithDetails, message: `Candidate ${name} created.` });
        await logAudit('AUDIT', `N8N Webhook: Candidate '${newCandidate.name}' (ID: ${newCandidate.id}) created successfully.`, 'API:N8N:CreateCandidate', null, { candidateId: newCandidate.id, name: newCandidate.name });

      } catch (error: any) { // Catch for individual candidate processing
        await client.query('ROLLBACK'); // Rollback the transaction for this candidate
        console.error("N8N Webhook: Error creating individual candidate:", error);
        const candidateNameForLog = `${candidate_info.personal_info.firstname} ${candidate_info.personal_info.lastname}`.trim() || 'Unknown Candidate';
        const candidateEmailForLog = candidate_info.contact_info.email || 'unknown_email@example.com';

        await logAudit('ERROR', `N8N Webhook: Error processing candidate entry for '${candidateNameForLog}'. Error: ${error.message}`, 'API:N8N:CreateCandidate', null, { name: candidateNameForLog, email: candidateEmailForLog, error: error.message });
        results.push({ status: 'error', email: candidateEmailForLog, message: error.message });
      }
    } // End of for...of loop

    // After processing all entries, return the overall results
    return NextResponse.json({ message: "Batch candidate creation process completed.", results }, { status: 200 });

  } catch (batchProcessingError: any) { // Catch for errors like client connection or unexpected issues in loop setup
    console.error("N8N Webhook: Error processing candidate batch:", batchProcessingError);
    await logAudit('ERROR', `N8N Webhook: Error processing candidate batch. Error: ${batchProcessingError.message}`, 'API:N8N:CreateCandidate', null, { error: batchProcessingError.message });
    // results array might be partially populated or empty here.
    return NextResponse.json({ message: "Error processing candidate batch.", error: batchProcessingError.message, results }, { status: 500 });
  } finally {
    if (client) {
      client.release(); // Release the client connection if it was established
    }
  }
}
    