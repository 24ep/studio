// src/app/api/n8n/create-candidate-with-matches/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '../../../../lib/prisma';
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
    const mappings = await prisma.webhookFieldMapping.findMany({
      where: {
        sourcePath: {
          not: null,
          not: '',
        },
      },
      select: {
        targetPath: true,
        sourcePath: true,
      },
    });
    // The select returns an array of objects with { targetPath: string, sourcePath: string | null }
    // We need to map this to the WebhookFieldMapping type from lib/types.ts
    return mappings.map((m: { targetPath: string, sourcePath: string | null }) => {
      return {
        id: '', // Not fetched and not needed by transformPayload
        targetPath: m.targetPath,
        sourcePath: m.sourcePath!, // We selected for not null, so we can assert it's a string
        notes: null, // Not fetched
        createdAt: new Date().toISOString(), // Not fetched
        updatedAt: new Date().toISOString(), // Not fetched
      };
    });
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
});

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
        if (lowerVal === 'true' || lowerVal === 'yes') return true;
        if (lowerVal === 'false' || lowerVal === 'no' || lowerVal === 'none' || lowerVal === '') return false;
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
});

const skillEntrySchema = z.object({
  segment_skill: z.string().optional().default(''),
  skill: z.array(z.string()).optional().default([]),
});

const jobSuitableEntrySchema = z.object({
  suitable_career: z.string().optional().default(''),
  suitable_job_position: z.string().optional().default(''),
  suitable_job_level: z.string().optional().default(''),
  suitable_salary_bath_month: z.string().optional().nullable(),
});

const candidateDetailsSchemaForN8N = z.object({
  cv_language: z.string().optional().default(''),
  personal_info: personalInfoSchema,
  contact_info: contactInfoSchema,
  education: z.array(educationEntrySchema).optional().default([]),
  experience: z.array(experienceEntrySchema).optional().default([]),
  skills: z.array(skillEntrySchema).optional().default([]),
  job_suitable: z.array(jobSuitableEntrySchema).optional().default([]),
});

const n8nJobMatchSchema = z.object({
  job_id: z.string().uuid().optional().nullable(),
  job_title: z.string().min(1, "Job title is required").optional(), // Made optional
  fit_score: z.number().min(0).max(100, "Fit score must be between 0 and 100"),
  match_reasons: z.array(z.string()).optional().default([]),
});

const appliedJobSchema = z.object({
  job_id: z.string().uuid("Invalid Job ID in job_applied").optional().nullable(),
  job_title: z.string().optional().nullable(), 
  fit_score: z.number().min(0).max(100).optional().nullable(),
  justification: z.array(z.string()).optional().default([]),
}).optional().nullable();

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

  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const { candidate_info, jobs, targetPositionId, targetPositionTitle, targetPositionDescription, targetPositionLevel, job_applied } = payload;
      let finalPositionId: string | null = targetPositionId || null;
      let finalPositionTitle: string | null = targetPositionTitle || null;

      if (!finalPositionId && targetPositionTitle) {
        const existingPosition = await tx.position.findFirst({
          where: { title: targetPositionTitle },
        });

        if (existingPosition) {
          finalPositionId = existingPosition.id;
        } else {
          const newPosition = await tx.position.create({
            data: {
              id: uuidv4(),
              title: targetPositionTitle,
              description: targetPositionDescription || 'Auto-created from n8n webhook.',
              department: 'Uncategorized',
              isOpen: true,
              position_level: targetPositionLevel?.toLowerCase() || 'entry level',
            },
          });
          finalPositionId = newPosition.id;
        }
      }

      const candidateName = `${candidate_info.personal_info.firstname} ${candidate_info.personal_info.lastname}`.trim();
      const newCandidateId = uuidv4();

      const createdCandidate = await tx.candidate.create({
        data: {
          id: newCandidateId,
          name: candidateName,
          email: candidate_info.contact_info.email,
          phone: candidate_info.contact_info.phone,
          positionId: finalPositionId,
          applicationDate: new Date(),
          status: 'Applied',
          parsedData: candidate_info as any, // Cast to any to avoid deep type issues
          fitScore: job_applied?.fit_score || null,
          custom_attributes: {},
        },
      });

      if (job_applied && finalPositionId) {
        await tx.transitionRecord.create({
          data: {
            id: uuidv4(),
            candidateId: newCandidateId,
            positionId: finalPositionId,
            stage: 'Applied',
            notes: `Candidate applied for position "${finalPositionTitle || 'N/A'}". Justification: ${job_applied.justification?.join(', ') || 'N/A'}`,
            date: new Date(),
          },
        });
      }

      if (jobs && jobs.length > 0) {
        await tx.candidateJobMatch.createMany({
          data: jobs.map(job => ({
            id: uuidv4(),
            candidateId: newCandidateId,
            positionId: job.job_id,
            positionTitle: job.job_title,
            fitScore: job.fit_score,
            matchReasons: job.match_reasons || [],
          })),
        });
      }
      
      return createdCandidate;
    });

    const createdCandidateWithDetails = await prisma.candidate.findUnique({
      where: { id: result.id },
      include: {
        position: true,
        recruiter: true,
        transitionHistory: true,
      }
    });

    await logAudit('AUDIT', `N8N Webhook: Candidate '${createdCandidateWithDetails?.name}' (ID: ${createdCandidateWithDetails?.id}) created successfully.`, 'API:N8N:CreateCandidateWithMatches', null, { candidateId: createdCandidateWithDetails?.id });

    return NextResponse.json({ status: 'success', candidate: createdCandidateWithDetails, message: `Candidate ${result.name} created.` }, { status: 201 });

  } catch (error: any) {
    console.error("N8N Webhook: Error processing webhook request:", error);
    await logAudit('ERROR', `N8N Webhook: Error processing webhook request. Error: ${error.message}`, 'API:N8N:CreateCandidateWithMatches', null, { error: error.message });
    return NextResponse.json({ message: "Error processing webhook request.", error: error.message }, { status: 500 });
  }
}
