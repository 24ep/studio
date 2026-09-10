import { v4 as uuidv4 } from 'uuid';
import { getPool, type DbClient } from '@/lib/db';
import { enqueueAutomaticApplicantScreening } from '@/lib/screening/service';
import type { ApplicantImportInput, ApplicantImportResults } from './applicants-import-schema';
import { parseDate, parseFitScore, parseJsonField } from './applicants-import-schema';
import { logAuditEvent } from '@/lib/auditLog';

interface ApplicantImportAuditContext {
  actingUserId: string;
  jobId?: string;
}

interface ApplicantImportChange {
  applicantId: string;
  action: 'created' | 'updated';
  changedAttributes: Record<string, { from: unknown; to: unknown }>;
}

function buildParsedData(applicant: ApplicantImportInput) {
  return {
    personal_info: {
      location: applicant.location || null,
      introduction_aboutme: applicant.introductionAboutMe || null,
    },
    education: parseJsonField(applicant.education),
    experience: parseJsonField(applicant.experience),
    skills: parseJsonField(applicant.skills),
    job_suitable: parseJsonField(applicant.jobSuitable),
  };
}

async function resolveRecruitmentStageId(client: DbClient, applicant: ApplicantImportInput): Promise<string | null> {
  if (applicant.statusId) {
    const result = await client.query('SELECT id FROM "RecruitmentStage" WHERE id = $1 LIMIT 1', [applicant.statusId]);
    if (result.rows[0]?.id) {
      return result.rows[0].id;
    }
    throw new Error(`Recruitment stage ID ${applicant.statusId} was not found`);
  }

  const statusName = applicant.status?.trim() || 'Applied';
  const result = await client.query('SELECT id FROM "RecruitmentStage" WHERE LOWER(name) = LOWER($1) LIMIT 1', [statusName]);
  if (result.rows[0]?.id) {
    return result.rows[0].id;
  }

  throw new Error(`Recruitment stage "${statusName}" was not found`);
}

async function updateApplicant(client: DbClient, applicant: ApplicantImportInput) {
  const fitScore = parseFitScore(applicant.fitScore);
  const applicationDate = parseDate(applicant.applicationDate);
  const parsedData = buildParsedData(applicant);
  const customAttributes = parseJsonField(applicant.customAttributes) || {};
  const statusId = await resolveRecruitmentStageId(client, applicant);

  const beforeResult = await client.query(
    `SELECT name, email, phone, "positionId", "recruiterId", "fitScore", "statusId", "applicationDate", "parsedData", "customAttributes" FROM "Applicant" WHERE id = $1`,
    [applicant.id]
  );
  const before = beforeResult.rows[0];
  if (!before) return { rowCount: 0, change: null };

  const values: Record<string, unknown> = {
    name: applicant.name,
    email: applicant.email,
    phone: applicant.phone || null,
    positionId: applicant.positionId || null,
    recruiterId: applicant.recruiterId || null,
    fitScore,
    statusId,
    applicationDate: applicationDate || new Date(),
    parsedData,
    customAttributes,
  };
  const updateResult = await client.query(
    `
      UPDATE "Applicant"
      SET
        name = $1,
        email = $2,
        phone = $3,
        "positionId" = $4,
        "recruiterId" = $5,
        "fitScore" = $6,
        "statusId" = $7,
        "applicationDate" = $8,
        "parsedData" = $9,
        "customAttributes" = $10,
        "updatedAt" = NOW()
      WHERE id = $11
    `,
    [
      applicant.name,
      applicant.email,
      applicant.phone || null,
      applicant.positionId || null,
      applicant.recruiterId || null,
      fitScore,
      statusId,
      applicationDate || new Date(),
      parsedData,
      customAttributes,
      applicant.id,
    ]
  );
  const changedAttributes = Object.fromEntries(Object.entries(values).filter(([key, value]) => {
    const previous = before[key];
    return JSON.stringify(previous instanceof Date ? previous.toISOString() : previous) !== JSON.stringify(value instanceof Date ? value.toISOString() : value);
  }).map(([key, value]) => [key, { from: before[key], to: value }]));

  return { rowCount: updateResult.rowCount, change: { applicantId: applicant.id!, action: 'updated' as const, changedAttributes } };
}

async function createApplicant(client: DbClient, applicant: ApplicantImportInput) {
  const fitScore = parseFitScore(applicant.fitScore);
  const applicationDate = parseDate(applicant.applicationDate);
  const parsedData = buildParsedData(applicant);
  const customAttributes = parseJsonField(applicant.customAttributes) || {};
  const statusId = await resolveRecruitmentStageId(client, applicant);

  const applicantId = uuidv4();
  await client.query(
    `
      INSERT INTO "Applicant" (
        id, name, email, phone, "positionId", "recruiterId",
        "fitScore", "statusId", "applicationDate", "parsedData",
        "customAttributes", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    `,
    [
      applicantId,
      applicant.name,
      applicant.email,
      applicant.phone || null,
      applicant.positionId || null,
      applicant.recruiterId || null,
      fitScore,
      statusId,
      applicationDate || new Date(),
      parsedData,
      customAttributes,
    ]
  );
  return {
    applicantId,
    action: 'created' as const,
    changedAttributes: {
      name: { from: null, to: applicant.name },
      email: { from: null, to: applicant.email },
      positionId: { from: null, to: applicant.positionId || null },
      statusId: { from: null, to: statusId },
    },
  };
}

export async function importApplicantsToDatabase(applicants: ApplicantImportInput[], auditContext?: ApplicantImportAuditContext): Promise<ApplicantImportResults> {
  const client = await getPool().connect();
  const changes: ApplicantImportChange[] = [];

  try {
    await client.query('BEGIN');

    const results: ApplicantImportResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    for (const applicant of applicants) {
      try {
        if (applicant.id) {
          const updateResult = await updateApplicant(client, applicant);
          if (updateResult.rowCount && updateResult.rowCount > 0) {
            results.updated += 1;
            if (updateResult.change) changes.push(updateResult.change);
          } else {
            results.errors.push(`Applicant with ID ${applicant.id} not found`);
          }
        } else {
          changes.push(await createApplicant(client, applicant));
          results.created += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Failed to process ${applicant.email}: ${message}`);
      }
    }

    await client.query('COMMIT');
    await Promise.all(changes.filter(change => change.action === 'created').map(change =>
      enqueueAutomaticApplicantScreening(change.applicantId, 'import').catch(error => console.error('[Applicant Import] Automatic screening enqueue failed:', error))
    ));
    if (auditContext) {
      await Promise.all(changes.map((change) => logAuditEvent(
        auditContext.actingUserId,
        change.action === 'created' ? 'IMPORTED_CREATE' : 'IMPORTED_UPDATE',
        'Applicant',
        change.applicantId,
        { jobId: auditContext.jobId, changedAttributes: change.changedAttributes }
      )));
    }
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
