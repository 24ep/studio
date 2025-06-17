
// src/app/api/n8n/create-candidate-with-matches/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import pool from '../../../../lib/db';
import { z } from 'zod';
import type { CandidateDetails, Position, CandidateStatus, N8NJobMatch, PersonalInfo, ContactInfo, EducationEntry, ExperienceEntry, SkillEntry, JobSuitableEntry, PositionLevel, N8NCandidateWebhookEntry, WebhookFieldMapping } from '@/lib/types';
import { logAudit } from '@/lib/auditLog';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get a value from a nested object using a dot-separated path
function getValueFromPath(obj: any, path: string | null | undefined): any {
  if (!path || !obj) return undefined;
  return path.split('.').reduce((current, key) => (current && typeof current === 'object' && key in current) ? current[key] : undefined, obj);
}

// Helper function to set a value in a nested object using a dot-separated path
function setValueByPath(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}


async function getWebhookMappings(): Promise<WebhookFieldMapping[]> {
  try {
    const result = await pool.query('SELECT target_path as "targetPath", source_path as "sourcePath" FROM "WebhookFieldMapping" WHERE source_path IS NOT NULL AND source_path != \'\'');
    return result.rows;
  } catch (error) {
    console.error("Error fetching webhook mappings:", error);
    await logAudit('ERROR', `Failed to fetch webhook mappings for n8n processing. Error: ${(error as Error).message}`, 'API:N8N:CreateCandidateWithMatches:MappingFetch');
    return []; // Return empty array on error, processing will use raw payload
  }
}

function transformPayload(rawPayload: any, mappings: WebhookFieldMapping[]): any {
  if (!mappings || mappings.length === 0) {
    console.log("N8N Webhook: No mappings found or provided. Returning raw payload for validation.");
    return rawPayload;
  }

  const transformedPayload: any = {};
  // console.log("N8N Webhook: Starting transformation with mappings:", JSON.stringify(mappings, null, 2)); // Already added in previous step
  for (const mapping of mappings) {
    if (mapping.sourcePath) { 
      const value = getValueFromPath(rawPayload, mapping.sourcePath);
      // console.log(`N8N Webhook: Mapping: Target='${mapping.targetPath}', Source='${mapping.sourcePath}', Value Found='${value !== undefined}'`);
      if (value !== undefined) { 
        setValueByPath(transformedPayload, mapping.targetPath, value);
      }
    }
  }
  // Defensive check: if job_applied.justification exists, ensure match_reasons (old key) is removed
  if (transformedPayload.job_applied && transformedPayload.job_applied.justification && transformedPayload.job_applied.match_reasons) {
    delete transformedPayload.job_applied.match_reasons;
    console.log("N8N Webhook: Ensured 'job_applied.justification' is used, removed 'job_applied.match_reasons' if both were present after transformation.");
  }
  
  // Defensive check: if transformedPayload.jobs exists but an item has match_reasons and not justification, convert it
  if (transformedPayload.jobs && Array.isArray(transformedPayload.jobs)) {
    transformedPayload.jobs = transformedPayload.jobs.map((job: any) => {
      if (job && job.match_reasons && !job.justification) {
        // This is not correct, the schema for N8NJobMatch expects match_reasons
        // The issue is about what the schema *defines* vs what might come in.
        // The n8nJobMatchSchema currently defines 'match_reasons'.
        // If the incoming data for a job match has 'justification' from n8n, it should be mapped to 'match_reasons' by the user's Webhook Payload Mapping config.
      }
      return job;
    });
  }


  // console.log("N8N Webhook: Payload after transformation:", JSON.stringify(transformedPayload, null, 2)); // Already added
  return transformedPayload;
}


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
  avatar_url: z.string().url().optional().nullable(),
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
    (val: unknown) => {
      if (typeof val === 'string') {
        const lowerVal = val.toLowerCase();
        if (lowerVal === 'none' || lowerVal === '') {
          return null;
        }
        return lowerVal;
      }
      if (val === null || val === undefined) {
        return null;
      }
      return val;
    },
    z.string().optional().nullable()
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
  job_id: z.string().uuid().optional().nullable(),
  job_title: z.string().min(1, "Job title is required").optional(), // Made optional
  fit_score: z.number().min(0).max(100, "Fit score must be between 0 and 100"),
  match_reasons: z.array(z.string()).optional().default([]),
}).passthrough();

const appliedJobSchema = z.object({
  job_id: z.string().uuid("Invalid Job ID in job_applied").optional().nullable(),
  job_title: z.string().optional().nullable(), 
  fit_score: z.number().min(0).max(100).optional().nullable(),
  justification: z.array(z.string()).optional().default([]),
}).passthrough().optional().nullable();

const n8nWebhookPayloadSchema = z.object({
  candidate_info: candidateDetailsSchemaForN8N,
  jobs: z.array(n8nJobMatchSchema).optional().default([]),
  targetPositionId: z.string().uuid().optional().nullable(),
  targetPositionTitle: z.string().optional().nullable(),
  targetPositionDescription: z.string().optional().nullable(),
  targetPositionLevel: z.string().optional().nullable(),
  job_applied: appliedJobSchema,
});


export async function POST(request: NextRequest) {
  let rawRequestBody;
  let payloadToProcess;

  try {
    rawRequestBody = await request.json();
    // console.log("N8N Webhook: Raw request body received:", JSON.stringify(rawRequestBody, null, 2).substring(0, 2000));
    
    if (rawRequestBody && typeof rawRequestBody === 'object') {
      if ('body' in rawRequestBody && rawRequestBody.body && typeof rawRequestBody.body === 'object') {
        payloadToProcess = rawRequestBody.body;
      } else if (Array.isArray(rawRequestBody) && rawRequestBody.length > 0 && 
                 rawRequestBody[0].result_json && Array.isArray(rawRequestBody[0].result_json) && rawRequestBody[0].result_json.length > 0 &&
                 rawRequestBody[0].result_json[0].json && typeof rawRequestBody[0].result_json[0].json === 'object') {
        payloadToProcess = rawRequestBody[0].result_json[0].json;
      } else {
        payloadToProcess = rawRequestBody;
      }
    } else {
      throw new Error("Request body is not a valid JSON object or expected structure.");
    }
    // console.log("N8N Webhook: Payload before transformation (payloadToProcess):", JSON.stringify(payloadToProcess, null, 2).substring(0, 2000));

  } catch (error) {
    console.error("N8N Webhook: Error parsing request body or unexpected initial structure:", error);
    await logAudit('ERROR', 'N8N Webhook: Error parsing request body or unexpected structure.', 'API:N8N:CreateCandidateWithMatches', null, { error: (error as Error).message, rawRequestBody: JSON.stringify(rawRequestBody).substring(0, 500) });
    return NextResponse.json({ message: "Error parsing request body or unexpected structure", error: (error as Error).message }, { status: 400 });
  }

  const mappings = await getWebhookMappings();
  console.log("N8N Webhook: Using mappings from DB for transformation:", JSON.stringify(mappings, null, 2));
  const transformedPayload = transformPayload(payloadToProcess, mappings);
  console.log("N8N Webhook: Payload after transformation (transformedPayload):", JSON.stringify(transformedPayload, null, 2).substring(0, 2000));

  // Ensure 'jobs' is an array if it's missing or null after transformation, before Zod validation
  if (transformedPayload.jobs === undefined || transformedPayload.jobs === null) {
    transformedPayload.jobs = [];
  }
  // Defensive check: if transformedPayload.job_applied exists and both justification and match_reasons are present, remove match_reasons
  if (transformedPayload.job_applied && transformedPayload.job_applied.justification && transformedPayload.job_applied.match_reasons) {
    delete transformedPayload.job_applied.match_reasons;
  }


  const validationResult = n8nWebhookPayloadSchema.safeParse(transformedPayload);
  if (!validationResult.success) {
    await logAudit('ERROR', 'N8N Webhook: Invalid input received from n8n (after transformation).', 'API:N8N:CreateCandidateWithMatches', null, { 
        errors: validationResult.error.flatten(), 
        originalPayloadSnippet: JSON.stringify(payloadToProcess, null, 2).substring(0, 1000), 
        transformedPayloadForDebug: transformedPayload,
        fetchedMappingsForDebug: mappings,
    });
    return NextResponse.json(
      { 
        message: "Invalid input for n8n candidate creation (after transformation)", 
        errors: validationResult.error.flatten().fieldErrors, 
        transformedPayloadForDebug: transformedPayload,
        hint: "Ensure 'candidate_info' and its required sub-fields (like personal_info.firstname, personal_info.lastname, contact_info.email) are correctly mapped in Settings > Webhook Payload Mapping, and that your n8n workflow provides data for these mapped source paths. Also check server logs for the exact payload received and mappings used."
      },
      { status: 400 }
    );
  }

  const payload = validationResult.data;
  let client;

  try {
    client = await pool.connect();

    const { candidate_info, jobs, targetPositionId, targetPositionTitle, targetPositionDescription, targetPositionLevel, job_applied } = payload;
    const { personal_info, contact_info } = candidate_info;

    const candidateName = `${personal_info.firstname} ${personal_info.lastname}`.trim();
    const email = contact_info.email;
    const phone = contact_info.phone || null;

    if (!candidateName) {
      await logAudit('WARN', `N8N Webhook: Skipped candidate due to missing name. Email: ${email}`, 'API:N8N:CreateCandidateWithMatches', null, { email });
      return NextResponse.json({ status: 'error', email, message: "Candidate name (derived from firstname and lastname) cannot be empty."}, { status: 400});
    }
    if (!email) {
      await logAudit('WARN', `N8N Webhook: Skipped candidate due to missing email. Name: ${candidateName}`, 'API:N8N:CreateCandidateWithMatches', null, { name: candidateName });
      return NextResponse.json({ status: 'error', name: candidateName, message: "Candidate email cannot be empty."}, { status: 400});
    }

    let finalPositionId: string | null = null;
    let finalFitScore: number = 0;
    let associatedMatchDetails = null;

    const fullParsedDataForDB: CandidateDetails = {
      cv_language: candidate_info.cv_language || '',
      personal_info: candidate_info.personal_info,
      contact_info: candidate_info.contact_info,
      education: candidate_info.education || [],
      experience: candidate_info.experience || [],
      skills: candidate_info.skills || [],
      job_suitable: candidate_info.job_suitable || [],
      job_matches: jobs || [], 
    };

    await client.query('BEGIN');

    const existingCandidateQuery = 'SELECT id FROM "Candidate" WHERE email = $1';
    const existingCandidateResult = await client.query(existingCandidateQuery, [email]);
    if (existingCandidateResult.rows.length > 0) {
      await client.query('ROLLBACK');
      const existingId = existingCandidateResult.rows[0].id;
      await logAudit('WARN', `N8N Webhook: Candidate with email '${email}' already exists (ID: ${existingId}). Creation skipped.`, 'API:N8N:CreateCandidateWithMatches', null, { email });
      return NextResponse.json({ status: 'skipped', email, message: `Candidate with email ${email} already exists.`, candidateId: existingId }, { status: 409 });
    }

    // Priority 1: Use job_applied if present
    if (job_applied?.job_id) {
        const positionCheck = await client.query('SELECT title, description, position_level FROM "Position" WHERE id = $1 AND "isOpen" = TRUE', [job_applied.job_id]);
        if (positionCheck.rows.length > 0) {
            finalPositionId = job_applied.job_id;
            finalFitScore = job_applied.fit_score || 0;
            associatedMatchDetails = {
                jobTitle: job_applied.job_title || positionCheck.rows[0].title,
                fitScore: finalFitScore,
                reasons: job_applied.justification || [],
                n8nJobId: job_applied.job_id,
            };
            fullParsedDataForDB.associatedMatchDetails = associatedMatchDetails;
            await logAudit('INFO', `N8N Webhook: Candidate '${candidateName}' associated with position from 'job_applied': '${associatedMatchDetails.jobTitle}' (ID: ${finalPositionId}). Fit score: ${finalFitScore}.`, 'API:N8N:CreateCandidateWithMatches', null);
        } else {
            await logAudit('WARN', `N8N Webhook: 'job_applied.job_id' ('${job_applied.job_id}') for candidate '${candidateName}' is invalid or not open. Proceeding without this direct assignment.`, 'API:N8N:CreateCandidateWithMatches', null);
        }
    }
    
    if (!finalPositionId && targetPositionId) {
      const positionCheck = await client.query('SELECT title, description, position_level FROM "Position" WHERE id = $1 AND "isOpen" = TRUE', [targetPositionId]);
      if (positionCheck.rows.length > 0) {
        finalPositionId = targetPositionId;
        const matchedJobTitle = positionCheck.rows[0].title;
        const n8nMatchForTarget = jobs?.find(j => 
          j.job_id === targetPositionId || 
          (j.job_title && matchedJobTitle && j.job_title.toLowerCase() === matchedJobTitle.toLowerCase())
        );

        if (n8nMatchForTarget) {
          finalFitScore = n8nMatchForTarget.fit_score;
          associatedMatchDetails = {
            jobTitle: n8nMatchForTarget.job_title || matchedJobTitle,
            fitScore: n8nMatchForTarget.fit_score,
            reasons: n8nMatchForTarget.match_reasons || [],
            n8nJobId: n8nMatchForTarget.job_id,
          };
        } else {
          finalFitScore = 0; 
          associatedMatchDetails = {
             jobTitle: targetPositionTitle || matchedJobTitle,
             fitScore: 0, 
             reasons: ["User-selected position during upload or system-assigned target"], 
             n8nJobId: targetPositionId 
          };
        }
         fullParsedDataForDB.associatedMatchDetails = associatedMatchDetails;
        await logAudit('INFO', `N8N Webhook: Candidate '${candidateName}' will be associated with pre-selected position (targetPositionId) '${targetPositionTitle || matchedJobTitle}' (ID: ${finalPositionId}). Fit score: ${finalFitScore}.`, 'API:N8N:CreateCandidateWithMatches', null);
      } else {
        await logAudit('WARN', `N8N Webhook: Pre-selected targetPositionId '${targetPositionId}' for candidate '${candidateName}' is invalid or not open. Candidate will be created without position assignment if no other match found.`, 'API:N8N:CreateCandidateWithMatches', null);
      }
    }
    
    if (!finalPositionId && jobs && jobs.length > 0) {
      const topMatch = jobs.sort((a,b) => b.fit_score - a.fit_score)[0]; 
      if (topMatch.job_id) {
        const positionCheck = await client.query('SELECT title FROM "Position" WHERE id = $1 AND "isOpen" = TRUE', [topMatch.job_id]);
        if (positionCheck.rows.length > 0) {
            finalPositionId = topMatch.job_id;
            finalFitScore = topMatch.fit_score;
            associatedMatchDetails = {
                jobTitle: topMatch.job_title || positionCheck.rows[0].title,
                fitScore: topMatch.fit_score,
                reasons: topMatch.match_reasons || [],
                n8nJobId: topMatch.job_id,
            };
        }
      }
      if (!finalPositionId && topMatch.job_title) { // Check if job_title exists before querying with it
        const positionQuery = 'SELECT id, title FROM "Position" WHERE title ILIKE $1 AND "isOpen" = TRUE LIMIT 1';
        const positionResult = await client.query(positionQuery, [topMatch.job_title]);
        if (positionResult.rows.length > 0) {
            finalPositionId = positionResult.rows[0].id;
            finalFitScore = topMatch.fit_score;
            associatedMatchDetails = {
                jobTitle: topMatch.job_title, 
                fitScore: topMatch.fit_score,
                reasons: topMatch.match_reasons || [],
                n8nJobId: topMatch.job_id || positionResult.rows[0].id,
            };
        }
      }

      if (finalPositionId && associatedMatchDetails) {
        fullParsedDataForDB.associatedMatchDetails = associatedMatchDetails;
        await logAudit('INFO', `N8N Webhook: Matched candidate '${candidateName}' to position '${associatedMatchDetails.jobTitle}' (ID: ${finalPositionId}) with fit score ${finalFitScore} based on n8n 'jobs' array.`, 'API:N8N:CreateCandidateWithMatches', null);
      } else {
        await logAudit('INFO', `N8N Webhook: No open position found matching n8n's top job suggestions for candidate '${candidateName}'. Candidate will be created without position assignment.`, 'API:N8N:CreateCandidateWithMatches', null);
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
      candidateName,
      email,
      phone,
      finalPositionId,
      finalFitScore,
      'Applied' as CandidateStatus,
      new Date().toISOString(),
      fullParsedDataForDB,
    ];
    const candidateResult = await client.query(insertCandidateQuery, candidateValues);
    const newCandidateDb = candidateResult.rows[0];

    const insertTransitionQuery = `
      INSERT INTO "TransitionRecord" (id, "candidateId", date, stage, notes, "actingUserId", "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), $3, $4, $5, NOW(), NOW());
    `;
    await client.query(insertTransitionQuery, [
      uuidv4(),
      newCandidateDb.id,
      'Applied' as CandidateStatus,
      'Candidate created via automated workflow.',
      null, 
    ]);

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
    const finalResult = await client.query(finalQuery, [newCandidateDb.id]);
    const createdCandidateWithDetails = finalResult.rows.length > 0 ? {
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
    } : null;


    await logAudit('AUDIT', `N8N Webhook: Candidate '${newCandidateDb.name}' (ID: ${newCandidateDb.id}) created successfully. Associated Position ID: ${finalPositionId || 'N/A'}.`, 'API:N8N:CreateCandidateWithMatches', null, { candidateId: newCandidateDb.id, name: newCandidateDb.name, associatedPositionId: finalPositionId, originalPayload: JSON.stringify(payloadToProcess).substring(0,1000), transformedPayload: JSON.stringify(transformedPayload).substring(0,1000) });
    return NextResponse.json({ status: 'success', candidate: createdCandidateWithDetails, message: `Candidate ${candidateName} created.` }, { status: 201 });

  } catch (error: any) {
    if (client) await client.query('ROLLBACK').catch(rbError => console.error("N8N Webhook: Rollback error:", rbError));
    console.error("N8N Webhook: Error processing webhook request:", error);
    await logAudit('ERROR', `N8N Webhook: Error processing webhook request. Error: ${error.message}`, 'API:N8N:CreateCandidateWithMatches', null, { error: error.message, originalPayload: JSON.stringify(payloadToProcess).substring(0,1000), transformedPayload: JSON.stringify(transformedPayload).substring(0,1000) });
    return NextResponse.json({ message: "Error processing webhook request.", error: error.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
