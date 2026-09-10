import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import path from 'path';
import { pathToFileURL } from 'url';
import mammoth from 'mammoth';
import type { QueryResultRow } from 'pg';
import { executeWithApiKeyFallback } from '../aiApiKeyManager';
import { generateTextWithProvider, generateTextWithProviderFiles, getProviderLabel, type AiInlineFilePart } from '../aiProvider';
import type { DbClient } from '../db';
import { minioClient } from '../minio';
import { MINIO_BUCKET } from '../minio-constants';
import {
  getString,
  isRecord,
  normalizeBuiltInApplicant,
  normalizeBuiltInJobMatches,
  parseBuiltInResumeProcessorJson,
  type BuiltInApplicant,
  type BuiltInJobMatch,
} from './built-in-resume-processor-utils';
import type { ResumeProcessingWebhookSettings } from './resume-processing-webhook-settings';
import { enqueueAutomaticApplicantScreening, recordScreeningConsent } from '../screening/service';

const requireFromHere = createRequire(import.meta.url);
const { PDFParse } = requireFromHere('pdf-parse') as typeof import('pdf-parse');
PDFParse.setWorker(pathToFileURL(path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href);

type BuiltInProcessorJob = Record<string, unknown> & {
  id: string;
  file_name?: string | null;
  file_path: string;
  webhook_payload?: unknown;
  position_id?: string | null;
  source_id?: string | null;
  sub_source?: string | null;
  created_by?: string | null;
  email_date?: string | Date | null;
  email_subject?: string | null;
  email_id?: string | null;
  email_metadata?: unknown;
};

type BuiltInProcessorPayload = Record<string, unknown> & {
  processor_mode: 'built-in';
  processed_by_external_webhook: false;
  built_in_processor_node: string;
  status: 'success';
  applicant_id: string;
};

type ApplicantRow = QueryResultRow & {
  id: string;
  name: string;
  email: string;
};

type PositionContext = {
  id: string;
  title: string | null;
  department: string | null;
  description: string | null;
  matchCriteria: string | null;
  positionLevel: string | null;
  positionAttribute: string | null;
  expertiseSkills: string[];
  personalityTraits: string[];
};

type ResumeContent = {
  text: string;
  files: AiInlineFilePart[];
  sourceType: 'text' | 'image';
};

function getPayloadRecord(job: BuiltInProcessorJob) {
  return isRecord(job.webhook_payload) ? job.webhook_payload : {};
}

function getTargetPositionId(job: BuiltInProcessorJob) {
  const payload = getPayloadRecord(job);
  return getString(payload.targetPositionId) || getString(payload.positionId) || getString(job.position_id);
}

function getSourceId(job: BuiltInProcessorJob) {
  const payload = getPayloadRecord(job);
  return getString(payload.sourceId) || getString(job.source_id);
}

function getSubSource(job: BuiltInProcessorJob) {
  const payload = getPayloadRecord(job);
  return getString(payload.subSource) || getString(payload.sub_source) || getString(job.sub_source);
}

function getExistingApplicantId(job: BuiltInProcessorJob) {
  const payload = getPayloadRecord(job);
  return getString(payload.Applicant_id) || getString(payload.applicantId) || getString(payload.applicant_id);
}

function getPublicApplicantForm(job: BuiltInProcessorJob) {
  const payload = getPayloadRecord(job);
  const publicApplicant = isRecord(payload.publicApplicant) ? payload.publicApplicant : {};
  return {
    name: getString(publicApplicant.name) || getString(payload.candidateName),
    email: getString(publicApplicant.email) || getString(payload.candidateEmail),
    phone: getString(publicApplicant.phone) || getString(payload.candidatePhone),
  };
}

export async function processBuiltInResumeUploadQueueJob({
  client,
  job,
  settings,
}: {
  client: DbClient;
  job: BuiltInProcessorJob;
  settings: ResumeProcessingWebhookSettings;
}) {
  const resumeContent = await extractResumeContent(job);
  const targetPositionId = getTargetPositionId(job);
  const targetPosition = await fetchTargetPositionContext(client, targetPositionId);
  const aiResponse = await runBuiltInResumeAi({ job, resumeContent, settings, targetPosition });
  const parsed = parseBuiltInResumeProcessorJson(aiResponse);
  const applicant = normalizeBuiltInApplicant({
    ...parsed,
    applicant: {
      ...getPublicApplicantForm(job),
      ...(isRecord(parsed.applicant) ? parsed.applicant : {}),
    },
  }, job.file_name);
  const jobMatches = normalizeBuiltInJobMatches(parsed, targetPositionId);
  const applicantId = await upsertBuiltInApplicant({
    applicant,
    client,
    job,
    jobMatches,
    targetPositionId,
  });
  const payload = getPayloadRecord(job);
  if (payload.screeningConsent === true) {
    await recordScreeningConsent({ subjectType: 'applicant', subjectId: applicantId, noticeVersion: '2026-08-v1', captureSource: 'public_application' });
  }
  await enqueueAutomaticApplicantScreening(applicantId, payload.source === 'public_apply' ? 'public_apply' : 'applicant_created').catch(error => console.error('[Resume Processor] Automatic screening enqueue failed:', error));

  return buildBuiltInPayload({
    aiResponse,
    applicant,
    applicantId,
    job,
    jobMatches,
    parsed,
    resumeText: resumeContent.text,
    settings,
  });
}

async function extractResumeContent(job: BuiltInProcessorJob): Promise<ResumeContent> {
  const buffer = await downloadUploadQueueObject(job.file_path);
  const extension = (job.file_name || job.file_path).split('.').pop()?.toLowerCase();
  const mimeType = getResumeMimeType(extension);

  if (mimeType?.startsWith('image/')) {
    return {
      text: `Image resume file: ${job.file_name || job.file_path}`,
      files: [{ mimeType, dataBase64: buffer.toString('base64') }],
      sourceType: 'image',
    };
  }

  if (extension === 'docx') {
    return {
      text: await extractDocxText(buffer),
      files: [],
      sourceType: 'text',
    };
  }

  if (extension === 'doc') {
    return {
      text: extractLegacyDocTextBestEffort(buffer),
      files: [],
      sourceType: 'text',
    };
  }

  if (extension === 'txt' || extension === 'md' || extension === 'csv') {
    return {
      text: normalizeExtractedText(buffer.toString('utf8')),
      files: [],
      sourceType: 'text',
    };
  }

  if (extension === 'pdf') {
    return {
      text: await extractPdfText(buffer),
      files: [],
      sourceType: 'text',
    };
  }

  return {
    text: normalizeExtractedText(buffer.toString('utf8')),
    files: [],
    sourceType: 'text',
  };
}

async function downloadUploadQueueObject(filePath: string) {
  const fileStream = await minioClient.getObject(MINIO_BUCKET, filePath);
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    fileStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    fileStream.on('end', resolve);
    fileStream.on('error', reject);
  });

  return Buffer.concat(chunks);
}

async function extractDocxText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const text = normalizeExtractedText(result.value);

  if (!text) {
    throw new Error('DOCX document text could not be read');
  }

  return text;
}

async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText().finally(() => parser.destroy());
  const text = normalizeExtractedText(parsed.text);

  if (!text) {
    throw new Error('PDF text could not be extracted. Scanned image PDFs are not readable by the built-in text parser yet; upload the resume as an image or use OCR before upload.');
  }

  return text;
}

function extractLegacyDocTextBestEffort(buffer: Buffer) {
  const text = buffer.toString('latin1')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, ' ')
    .replace(/\b[A-Za-z0-9+/=]{32,}\b/g, ' ');
  const normalized = normalizeExtractedText(text);

  if (!normalized) {
    throw new Error('DOC document text could not be read');
  }

  return normalized;
}

function normalizeExtractedText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function getResumeMimeType(extension: string | undefined) {
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return null;
  }
}

async function runBuiltInResumeAi({
  job,
  resumeContent,
  settings,
  targetPosition,
}: {
  job: BuiltInProcessorJob;
  resumeContent: ResumeContent;
  settings: ResumeProcessingWebhookSettings;
  targetPosition: PositionContext | null;
}) {
  if (!resumeContent.text && resumeContent.files.length === 0) {
    throw new Error('Resume text is empty after extraction');
  }

  const prompt = buildBuiltInResumePrompt({
    job,
    resumeText: resumeContent.text,
    settings,
    sourceType: resumeContent.sourceType,
    targetPosition,
  });
  const result = await executeWithApiKeyFallback(
    (apiKey, model, provider) => (
      resumeContent.files.length
        ? generateTextWithProviderFiles(provider, apiKey, model, prompt, resumeContent.files, {
            temperature: 0.2,
            topP: 0.9,
            maxOutputTokens: 8192,
          })
        : generateTextWithProvider(provider, apiKey, model, prompt, {
            temperature: 0.2,
            topP: 0.9,
            maxOutputTokens: 8192,
          })
    ),
    'Built-in Resume Processing'
  );

  if (!result.success || !result.data) {
    throw new Error(
      `Built-in resume processing AI failed for ${getProviderLabel(result.provider)}: ${result.error || 'No response'}`
    );
  }

  return result.data;
}

function buildBuiltInResumePrompt({
  job,
  resumeText,
  settings,
  sourceType,
  targetPosition,
}: {
  job: BuiltInProcessorJob;
  resumeText: string;
  settings: ResumeProcessingWebhookSettings;
  sourceType: ResumeContent['sourceType'];
  targetPosition: PositionContext | null;
}) {
  const payload = getPayloadRecord(job);

  return [
    settings.builtInResumeExtractionPrompt || 'Extract structured candidate information from the resume.',
    settings.builtInApplicantMappingPrompt || 'Map the extracted data to the applicant fields used by an ATS.',
    settings.builtInJobMatchingPrompt || 'Score the candidate against the target job when job context is available.',
    '',
    'Return only valid JSON with this shape:',
    '{"applicant":{"name":"","email":"","phone":"","fitScore":null,"parsedData":{"cv_language":"","personal_info":{"title_honorific":"","firstname":"","lastname":"","nickname":"","location":"","introduction_aboutme":""},"contact_info":{"email":"","phone":""},"education":[{"university":"","major":"","field":"","campus":"","startMonth":null,"startYear":null,"endMonth":null,"endYear":null,"isCurrent":false,"GPA":""}],"experience":[{"company":"","position":"","description":"","startMonth":null,"startYear":null,"endMonth":null,"endYear":null,"isCurrent":false,"positionLevel":""}],"skills":[{"segment_skill":"","skill":[]}]}},"job_matches":[{"jobId":"","jobTitle":"","fitScore":null,"matchReasons":[],"job_description_summary":""}]}',
    'Populate applicant.parsedData with all candidate details supported by evidence in the resume. Use empty strings or empty arrays only when details are unavailable.',
    '',
    `Queue job id: ${job.id}`,
    `Target position id: ${getTargetPositionId(job) || ''}`,
    targetPosition
      ? `Target position context: ${JSON.stringify(targetPosition)}`
      : 'Target position context: none found. If no job context is available, keep fitScore null and matchReasons empty.',
    'When target position context is provided, score the applicant against that position on a 0-100 scale and return 3-5 concise, evidence-based matchReasons. Also set applicant.fitScore to the same score for the applied job.',
    `Source id: ${getSourceId(job) || ''}`,
    `Sub source: ${getSubSource(job) || ''}`,
    `Original payload: ${JSON.stringify(payload)}`,
    '',
    sourceType === 'image'
      ? 'Resume source: image file attached to this message. Read the visible resume content from the image.'
      : 'Resume text:',
    sourceType === 'image' ? resumeText : resumeText.slice(0, 60000),
  ].join('\n');
}

async function fetchTargetPositionContext(client: DbClient, targetPositionId: string | null): Promise<PositionContext | null> {
  if (!targetPositionId) {
    return null;
  }

  const result = await client.query<PositionContext>(
    `SELECT
       p.id,
       p.title,
       p.department,
       p.description,
       p."matchCriteria",
       p."positionLevel",
       p."positionAttribute",
       COALESCE(
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT es.name), NULL),
         ARRAY[]::text[]
       ) as "expertiseSkills",
       COALESCE(
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT pt.name), NULL),
         ARRAY[]::text[]
       ) as "personalityTraits"
     FROM "Position" p
     LEFT JOIN "PositionExpertiseSkill" pes ON pes."positionId" = p.id
     LEFT JOIN "ExpertiseSkill" es ON es.id = pes."skillId"
     LEFT JOIN "PositionPersonalityTrait" ppt ON ppt."positionId" = p.id
     LEFT JOIN "PersonalityTrait" pt ON pt.id = ppt."traitId"
     WHERE p.id = $1::uuid
     GROUP BY p.id, p.title, p.department, p.description, p."matchCriteria", p."positionLevel", p."positionAttribute"
     LIMIT 1`,
    [targetPositionId]
  );

  return result.rows[0] ?? null;
}

async function upsertBuiltInApplicant({
  applicant,
  client,
  job,
  jobMatches,
  targetPositionId,
}: {
  applicant: BuiltInApplicant;
  client: DbClient;
  job: BuiltInProcessorJob;
  jobMatches: BuiltInJobMatch[];
  targetPositionId: string | null;
}) {
  await client.query('BEGIN');

  try {
    const existingApplicantId = getExistingApplicantId(job);
    const existing = existingApplicantId
      ? await findApplicantById(client, existingApplicantId)
      : await findApplicantByEmail(client, applicant.email);

    const applicantId = existing?.id || randomUUID();
    const statusId = await resolveAppliedStatusId(client);
    const appliedMatch = getAppliedJobMatch(jobMatches, targetPositionId);
    const appliedFitScore = applicant.fitScore ?? appliedMatch?.fitScore ?? null;
    const assignmentJustification = appliedMatch?.matchReasons.length
      ? appliedMatch.matchReasons.join('\n')
      : null;

    if (existing) {
      await updateExistingApplicant({ applicant, applicantId, appliedFitScore, assignmentJustification, client, job, targetPositionId });
    } else {
      await insertBuiltInApplicant({ applicant, applicantId, appliedFitScore, assignmentJustification, client, job, statusId, targetPositionId });
    }

    await replaceResumeAttachment({ applicantId, client, job });
    await replaceJobMatches({ applicantId, client, jobMatches });
    await client.query('COMMIT');
    return applicantId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

function getAppliedJobMatch(jobMatches: BuiltInJobMatch[], targetPositionId: string | null) {
  return jobMatches.find((match) => targetPositionId && match.jobId === targetPositionId) ?? jobMatches[0] ?? null;
}

async function findApplicantById(client: DbClient, applicantId: string) {
  const result = await client.query<ApplicantRow>('SELECT id, name, email FROM "Applicant" WHERE id = $1 LIMIT 1', [applicantId]);
  return result.rows[0] ?? null;
}

async function findApplicantByEmail(client: DbClient, email: string) {
  const result = await client.query<ApplicantRow>('SELECT id, name, email FROM "Applicant" WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
  return result.rows[0] ?? null;
}

async function resolveAppliedStatusId(client: DbClient) {
  const result = await client.query<{ id: string }>(
    'SELECT id FROM "RecruitmentStage" WHERE LOWER(name) = $1 LIMIT 1',
    ['applied']
  );

  return result.rows[0]?.id || null;
}

async function insertBuiltInApplicant({
  applicant,
  applicantId,
  appliedFitScore,
  assignmentJustification,
  client,
  job,
  statusId,
  targetPositionId,
}: {
  applicant: BuiltInApplicant;
  applicantId: string;
  appliedFitScore: number | null;
  assignmentJustification: string | null;
  client: DbClient;
  job: BuiltInProcessorJob;
  statusId: string | null;
  targetPositionId: string | null;
}) {
  await client.query(
    `INSERT INTO "Applicant" (
      id, name, email, phone, "positionId", "fitScore", "assignmentJustification", "statusId", "parsedData", "customAttributes",
      "applicationDate", "sourceId", "subSource", "resumePath", "emailDate", "emailSubject", "emailId",
      "emailMetadata", "updatedAt"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '{}', NOW(), $10, $11, $12, $13, $14, $15, $16, NOW())`,
    [
      applicantId,
      applicant.name,
      applicant.email,
      applicant.phone,
      targetPositionId,
      appliedFitScore,
      assignmentJustification,
      statusId,
      applicant.parsedData,
      getSourceId(job),
      getSubSource(job),
      job.file_path,
      job.email_date ? new Date(job.email_date) : null,
      job.email_subject || null,
      job.email_id || null,
      isRecord(job.email_metadata) ? job.email_metadata : null,
    ]
  );
}

async function updateExistingApplicant({
  applicant,
  applicantId,
  appliedFitScore,
  assignmentJustification,
  client,
  job,
  targetPositionId,
}: {
  applicant: BuiltInApplicant;
  applicantId: string;
  appliedFitScore: number | null;
  assignmentJustification: string | null;
  client: DbClient;
  job: BuiltInProcessorJob;
  targetPositionId: string | null;
}) {
  await client.query(
    `UPDATE "Applicant"
     SET name = COALESCE(NULLIF($2, ''), name),
         email = COALESCE(NULLIF($3, ''), email),
         phone = COALESCE($4, phone),
         "positionId" = COALESCE($5, "positionId"),
         "fitScore" = COALESCE($6, "fitScore"),
         "assignmentJustification" = COALESCE($7, "assignmentJustification"),
         "parsedData" = COALESCE("parsedData", '{}'::jsonb) || $8::jsonb,
         "sourceId" = COALESCE($9, "sourceId"),
         "subSource" = COALESCE($10, "subSource"),
         "resumePath" = $11,
         "emailDate" = COALESCE($12, "emailDate"),
         "emailSubject" = COALESCE($13, "emailSubject"),
         "emailId" = COALESCE($14, "emailId"),
         "emailMetadata" = COALESCE($15, "emailMetadata"),
         "updatedAt" = NOW()
     WHERE id = $1`,
    [
      applicantId,
      applicant.name,
      applicant.email,
      applicant.phone,
      targetPositionId,
      appliedFitScore,
      assignmentJustification,
      JSON.stringify(applicant.parsedData),
      getSourceId(job),
      getSubSource(job),
      job.file_path,
      job.email_date ? new Date(job.email_date) : null,
      job.email_subject || null,
      job.email_id || null,
      isRecord(job.email_metadata) ? job.email_metadata : null,
    ]
  );
}

async function replaceResumeAttachment({
  applicantId,
  client,
  job,
}: {
  applicantId: string;
  client: DbClient;
  job: BuiltInProcessorJob;
}) {
  const uploadedById = getString(job.created_by);
  if (!uploadedById) {
    return;
  }

  await client.query(
    `UPDATE "Attachment" SET "isPrimary" = false, "updatedAt" = NOW()
     WHERE "applicantId" = $1 AND label = 'Resume'`,
    [applicantId]
  );
  await client.query(
    `INSERT INTO "Attachment" (id, "applicantId", "uploadedById", "filePath", "fileName", label, "isPrimary", "uploadedAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 'Resume', true, NOW(), NOW())`,
    [randomUUID(), applicantId, uploadedById, job.file_path, job.file_name || job.file_path]
  );
}

async function replaceJobMatches({
  applicantId,
  client,
  jobMatches,
}: {
  applicantId: string;
  client: DbClient;
  jobMatches: BuiltInJobMatch[];
}) {
  if (jobMatches.length === 0) {
    return;
  }

  await client.query('DELETE FROM "JobMatch" WHERE "applicant_id" = $1', [applicantId]);

  for (const match of jobMatches) {
    await client.query(
      `INSERT INTO "JobMatch" (id, "applicant_id", "jobId", "jobTitle", "fitScore", "matchReasons", "job_description_summary", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [
        randomUUID(),
        applicantId,
        match.jobId,
        match.jobTitle,
        match.fitScore,
        match.matchReasons,
        match.job_description_summary,
      ]
    );
  }
}

function buildBuiltInPayload({
  aiResponse,
  applicant,
  applicantId,
  job,
  jobMatches,
  parsed,
  resumeText,
  settings,
}: {
  aiResponse: string;
  applicant: BuiltInApplicant;
  applicantId: string;
  job: BuiltInProcessorJob;
  jobMatches: BuiltInJobMatch[];
  parsed: Record<string, unknown>;
  resumeText: string;
  settings: ResumeProcessingWebhookSettings;
}): BuiltInProcessorPayload {
  const appliedFitScore = applicant.fitScore ?? getAppliedJobMatch(jobMatches, getTargetPositionId(job))?.fitScore ?? null;

  return {
    ...getPayloadRecord(job),
    processor_mode: 'built-in',
    processed_by_external_webhook: false,
    built_in_processor_node: settings.builtInProcessorNodeName,
    status: 'success',
    applicant_id: applicantId,
    applicant: {
      id: applicantId,
      name: applicant.name,
      email: applicant.email,
      phone: applicant.phone,
      fitScore: appliedFitScore,
    },
    job_matches: jobMatches,
    parsed_result: parsed,
    ai_response: aiResponse,
    extracted_text_preview: resumeText.slice(0, 2000),
  };
}
