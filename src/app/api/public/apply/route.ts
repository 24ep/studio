import { randomUUID } from 'crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { getPool, type DbClient } from '@/lib/db';
import { generateUniqueFilename } from '@/lib/fileUtils';
import { ensureBucketExists, minioClient, MINIO_BUCKET } from '@/lib/minio';
import { getSystemSetting } from '@/lib/systemSettings';
import { processSingleUploadQueueJob } from '@/lib/uploadQueueProcessor';
import { enqueueAutomaticApplicantScreening, recordScreeningConsent } from '@/lib/screening/service';
import { createPublicApplyCaptcha, verifyPublicApplyCaptcha } from './public-apply-captcha';
import { sendPublicApplicationNotifications } from './public-apply-notifications';
import { findPositionByPublicApplySlug, getPositionPublicApplyPath } from './public-apply-slugs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_PUBLIC_RESUME_SIZE = 25 * 1024 * 1024;
const PUBLIC_RESUME_TYPES = new Map([
  ['application/pdf', 'PDF'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'DOCX'],
]);

type PublicPositionRow = {
  id: string;
  title: string;
  department: string;
  description: string | null;
  positionLevel: string | null;
  customAttributes?: unknown;
  recruiterEmail?: string | null;
  recruiterName?: string | null;
};

type PublicApplicationMode = 'ai' | 'manual' | 'choice';

function getPublicApplicationMode(value: string | null): PublicApplicationMode {
  return value === 'ai' || value === 'manual' || value === 'choice' ? value : 'choice';
}

function getString(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isAllowedResume(file: File) {
  return PUBLIC_RESUME_TYPES.has(file.type)
    || /\.(pdf|docx)$/i.test(file.name);
}

async function getPublicBranding() {
  const [appName, organizationName, appLogoDataUrl] = await Promise.all([
    getSystemSetting('appName'),
    getSystemSetting('organizationName'),
    getSystemSetting('appLogoDataUrl'),
  ]);

  return {
    appName: appName || 'hrive',
    organizationName: organizationName || appName || 'Hiring Team',
    appLogoDataUrl: appLogoDataUrl || null,
  };
}

async function getOpenPositions(client: DbClient) {
  const result = await client.query<PublicPositionRow>(
    `SELECT p.id, p.title, p.department, p.description, p."positionLevel", p."customAttributes",
            u.email as "recruiterEmail", u.name as "recruiterName"
     FROM "Position" p
     LEFT JOIN "User" u ON p."recruiterId" = u.id
     WHERE p."isOpen" = true
     ORDER BY p."createdAt" DESC`
  );
  return result.rows;
}

function isPublicApplyEnabled(value: string | null) {
  return value === null || value === 'true';
}

function mapPublicPosition(position: PublicPositionRow) {
  return {
    id: position.id,
    title: position.title,
    department: position.department,
    description: position.description,
    positionLevel: position.positionLevel,
    publicApplyPath: getPositionPublicApplyPath(position),
  };
}

function getRequestApplicationUrl(request: NextRequest) {
  return new URL('/upload-queue', request.url).toString();
}

export async function GET(request: NextRequest) {
  const client = await getPool().connect();

  try {
    const [branding, positions, publicApplicationsEnabled, captchaEnabled, applicationModeSetting, screeningEnabled] = await Promise.all([
      getPublicBranding(),
      getOpenPositions(client),
      getSystemSetting('publicApplicationsEnabled'),
      getSystemSetting('publicApplicationsRequireCaptcha'),
      getSystemSetting('publicApplicationMode'),
      getSystemSetting('screeningEnabled'),
    ]);

    if (!isPublicApplyEnabled(publicApplicationsEnabled)) {
      return NextResponse.json({
        branding,
        positions: [],
        enabled: false,
        message: 'Public applications are currently closed',
      });
    }

    const slug = request.nextUrl.searchParams.get('slug');
    const positionId = request.nextUrl.searchParams.get('positionId') || request.nextUrl.searchParams.get('position');
    const slugPosition = findPositionByPublicApplySlug(positions, slug);
    const selectedPosition = slugPosition || positions.find(position => position.id === positionId) || null;

    return NextResponse.json({
      branding,
      positions: positions.map(mapPublicPosition),
      enabled: true,
      applicationMode: getPublicApplicationMode(applicationModeSetting),
      selectedPositionId: selectedPosition?.id || null,
      captcha: captchaEnabled === 'true' ? createPublicApplyCaptcha() : null,
      screeningConsentRequired: screeningEnabled === 'true',
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Failed to load public application page',
      error: getErrorMessage(error),
    }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const name = getString(formData.get('name'));
  const email = getString(formData.get('email'));
  const phone = getString(formData.get('phone'));
  const positionId = getString(formData.get('positionId'));
  const source = getString(formData.get('source')) || 'public_apply';
  const note = getString(formData.get('note'));
  const honeypot = getString(formData.get('website'));
  const captchaToken = getString(formData.get('captchaToken'));
  const captchaAnswer = getString(formData.get('captchaAnswer'));
  const fileValue = formData.get('resume');
  const requestedEntryMethod = getString(formData.get('entryMethod'));
  const screeningConsent = formData.get('screeningConsent') === 'true' || formData.get('screeningConsent') === 'on';

  if (honeypot) {
    return NextResponse.json({ message: 'Application received' }, { status: 201 });
  }

  const [publicApplicationsEnabled, captchaEnabled, applicationModeSetting, screeningEnabled] = await Promise.all([
    getSystemSetting('publicApplicationsEnabled'),
    getSystemSetting('publicApplicationsRequireCaptcha'),
    getSystemSetting('publicApplicationMode'),
    getSystemSetting('screeningEnabled'),
  ]);
  const applicationMode = getPublicApplicationMode(applicationModeSetting);
  const entryMethod = applicationMode === 'choice'
    ? (requestedEntryMethod === 'manual' ? 'manual' : 'ai')
    : applicationMode;

  if (!isPublicApplyEnabled(publicApplicationsEnabled)) {
    return NextResponse.json({ message: 'Public applications are currently closed' }, { status: 403 });
  }

  if (captchaEnabled === 'true' && !verifyPublicApplyCaptcha(captchaToken, captchaAnswer)) {
    return NextResponse.json({ message: 'Please complete the verification challenge' }, { status: 400 });
  }

  if (!name || !email || !positionId) {
    return NextResponse.json({ message: 'Name, email, and position are required' }, { status: 400 });
  }
  if (screeningEnabled === 'true' && !screeningConsent) {
    return NextResponse.json({ message: 'Screening consent is required for this application' }, { status: 400 });
  }

  if (!fileValue || typeof fileValue === 'string') {
    return NextResponse.json({ message: 'Resume file is required' }, { status: 400 });
  }

  const resume = fileValue as File;
  if (!isAllowedResume(resume)) {
    return NextResponse.json({ message: 'Resume must be a PDF or DOCX file' }, { status: 400 });
  }

  if (resume.size > MAX_PUBLIC_RESUME_SIZE) {
    return NextResponse.json({ message: 'Resume file must be 25MB or smaller' }, { status: 400 });
  }

  const client = await getPool().connect();

  try {
    const positionCheck = await client.query<PublicPositionRow>(
      `SELECT p.id, p.title, p.department, p.description, p."positionLevel", p."customAttributes",
              u.email as "recruiterEmail", u.name as "recruiterName"
       FROM "Position" p
       LEFT JOIN "User" u ON p."recruiterId" = u.id
       WHERE p.id = $1 AND p."isOpen" = true
       LIMIT 1`,
      [positionId]
    );
    const position = positionCheck.rows[0];
    if (!position) {
      return NextResponse.json({ message: 'Selected position is not available' }, { status: 404 });
    }

    await ensureBucketExists();

    const jobId = randomUUID();
    const objectName = `public-applications/${generateUniqueFilename(resume.name, jobId)}`;
    const buffer = Buffer.from(await resume.arrayBuffer());
    const contentType = resume.type || 'application/octet-stream';
    await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(resume.name)}"`,
    });

    if (entryMethod === 'manual') {
      const applicantId = randomUUID();
      const firstName = getString(formData.get('firstName')) || name.split(/\s+/)[0] || name;
      const lastName = getString(formData.get('lastName')) || name.split(/\s+/).slice(1).join(' ');
      const parsedData = {
        personal_info: {
          firstname: firstName,
          lastname: lastName,
          location: getString(formData.get('location')),
        },
        contact_info: { email, phone },
        current_title: getString(formData.get('currentTitle')),
        years_of_experience: getString(formData.get('yearsExperience')),
        skills: (getString(formData.get('skills')) || '').split(',').map(skill => skill.trim()).filter(Boolean),
        linkedin_url: getString(formData.get('linkedInUrl')),
        application_note: note,
        entry_method: 'manual',
      };

      await client.query('BEGIN');
      const statusResult = await client.query<{ id: string }>(
        `SELECT id FROM "RecruitmentStage" WHERE LOWER(name) = 'applied' LIMIT 1`
      );
      await client.query(
        `INSERT INTO "Applicant" (id, name, email, phone, "positionId", "statusId", "parsedData", "resumePath", "subSource", "applicationDate", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [applicantId, name, email, phone, positionId, statusResult.rows[0]?.id || null, JSON.stringify(parsedData), objectName, note]
      );
      const uploaderResult = await client.query<{ id: string }>(
        `SELECT id FROM "User" ORDER BY "createdAt" ASC LIMIT 1`
      );
      if (uploaderResult.rows[0]?.id) {
        await client.query(
          `INSERT INTO "Attachment" (id, "applicantId", "uploadedById", "filePath", "fileName", label, "isPrimary", "uploadedAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, 'Resume', true, NOW(), NOW())`,
          [randomUUID(), applicantId, uploaderResult.rows[0].id, objectName, resume.name]
        );
      }
      await client.query('COMMIT');
      if (screeningConsent) {
        await recordScreeningConsent({ subjectType: 'applicant', subjectId: applicantId, noticeVersion: '2026-08-v1', captureSource: 'public_application' });
      }
      await enqueueAutomaticApplicantScreening(applicantId, 'public_apply').catch(error => console.error('[Public Apply] Automatic screening enqueue failed:', error));
      await sendPublicApplicationNotifications({ applicant: { name, email, phone, note }, position, applicationUrl: getRequestApplicationUrl(request) });
      return NextResponse.json({
        message: 'Application received',
        applicantId,
        entryMethod: 'manual',
        position: { id: position.id, title: position.title },
      }, { status: 201 });
    }

    const webhookPayload = {
      source: 'public_apply',
      targetPositionId: positionId,
      publicApplicant: { name, email, phone, note },
      landingPageSource: source,
      submittedAt: new Date().toISOString(),
      screeningConsent,
    };

    const insertResult = await client.query(
      `INSERT INTO upload_queue (
        id, file_name, file_size, status, source, upload_id, created_by,
        file_path, webhook_payload, position_id, source_id, sub_source
      ) VALUES ($1, $2, $3, 'inprocess', $4, $5, NULL, $6, $7, $8, NULL, $9)
      RETURNING *`,
      [
        jobId,
        resume.name,
        resume.size,
        source,
        `public-${jobId}`,
        objectName,
        JSON.stringify(webhookPayload),
        positionId,
        note,
      ]
    );
    const job = insertResult.rows[0] as Record<string, unknown> & { id: string };
    const processingResult = await processSingleUploadQueueJob(job, client);
    await sendPublicApplicationNotifications({
      applicant: { name, email, phone, note },
      position,
      applicationUrl: getRequestApplicationUrl(request),
    });

    return NextResponse.json({
      message: 'Application received',
      queueId: jobId,
      position: { id: position.id, title: position.title },
      processingResult,
      entryMethod: 'ai',
    }, { status: 201 });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { /* No active transaction or rollback failed. */ }
    return NextResponse.json({
      message: 'Failed to submit application',
      error: getErrorMessage(error),
    }, { status: 500 });
  } finally {
    client.release();
  }
}
