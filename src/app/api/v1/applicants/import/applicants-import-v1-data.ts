import { v4 as uuidv4 } from 'uuid';
import { getPool, type DbClient } from '@/lib/db';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notificationService';
import { resolveV1ApplicantImportStageId } from './applicants-import-v1-stage';
import type { V1ApplicantImportApplicant } from './applicants-import-v1-schema';
import type { V1ApplicantImportUser } from './applicants-import-v1-auth';

type ApplicantInfo = Record<string, unknown> & {
  status?: string;
  fitScore?: number;
  job_applied?: {
    fitScore?: number;
  };
};

type ImportableApplicant = V1ApplicantImportApplicant & {
  applicant_info?: ApplicantInfo;
  fitScore?: number;
  name?: string;
  email?: string;
  phone?: string | null;
  status?: string;
  positionId?: string | null;
  recruiterId?: string | null;
  parsedData?: unknown;
  resumePath?: string | null;
  custom_attributes?: Record<string, unknown>;
};

async function getClient() {
  return await getPool().connect();
}

function getApplicantFitScore(applicant: ImportableApplicant) {
  if (typeof applicant.fitScore === 'number') {
    return Math.max(0, Math.min(1, applicant.fitScore / 100));
  }

  if (applicant.applicant_info && typeof applicant.applicant_info.fitScore === 'number') {
    return Math.max(0, Math.min(1, applicant.applicant_info.fitScore / 100));
  }

  if (
    applicant.applicant_info
    && applicant.applicant_info.job_applied
    && typeof applicant.applicant_info.job_applied.fitScore === 'number'
  ) {
    return Math.max(0, Math.min(1, applicant.applicant_info.job_applied.fitScore / 100));
  }

  return null;
}

async function autoAssignRecruiterAfterImport(
  applicant: ImportableApplicant,
  applicantId: string,
  resolvedStatusId: string,
  user: V1ApplicantImportUser
) {
  if (!applicant.positionId || applicant.recruiterId) {
    return;
  }

  try {
    const position = await prisma.position.findUnique({
      where: { id: applicant.positionId },
      include: { recruiter: { select: { id: true, name: true, email: true } } },
    });

    if (!position || !position.recruiterId || !position.recruiter) {
      return;
    }

    await prisma.applicant.update({
      where: { id: applicantId },
      data: { recruiter: { connect: { id: position.recruiterId } }, updatedAt: new Date() },
    });

    await prisma.transitionRecord.create({
      data: {
        id: uuidv4(),
        applicant: { connect: { id: applicantId } },
        position: { connect: { id: applicant.positionId } },
        stage: resolvedStatusId,
        notes: `Recruiter auto-assigned from position: ${position.recruiter.name}`,
        actingUser: { connect: { id: user.id } },
        date: new Date(),
      },
    });

    try {
      await NotificationService.notifyApplicantAdded(
        applicantId,
        applicant.name || applicant.email || applicantId,
        applicant.positionId,
        position.title,
        position.recruiterId,
        user.id
      );
    } catch (notificationError) {
      console.error('Failed to send Applicant added notification:', notificationError);
    }
  } catch (syncError) {
    console.error('Failed to auto-assign recruiter after Applicant import:', syncError);
  }
}

async function insertApplicant(
  client: DbClient,
  applicant: ImportableApplicant,
  applicantId: string,
  resolvedStatusId: string
) {
  await client.query(`
    INSERT INTO "Applicant" (
      id, name, email, phone, "statusId", "positionId", "recruiterId", "fitScore",
      "customAttributes", "parsedData", "resumePath", "applicationDate", "createdAt", "updatedAt"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW(), NOW())
  `, [
    applicantId,
    applicant.name,
    applicant.email,
    applicant.phone || null,
    resolvedStatusId,
    applicant.positionId || null,
    applicant.recruiterId || null,
    getApplicantFitScore(applicant),
    applicant.custom_attributes || {},
    applicant.parsedData || null,
    applicant.resumePath || null,
  ]);
}

export async function importV1ApplicantsToDatabase(
  applicants: V1ApplicantImportApplicant[],
  user: V1ApplicantImportUser
) {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const rawApplicant of applicants) {
      const applicant = rawApplicant as ImportableApplicant;
      const applicantId = uuidv4();
      const resolvedStatusId = await resolveV1ApplicantImportStageId(
        applicant.status || applicant?.applicant_info?.status || undefined
      );

      if (!resolvedStatusId) {
        await client.query('ROLLBACK');
        return { status: 'stage-not-found' as const };
      }

      try {
        await client.query('SAVEPOINT v1_applicant_import_row');
        await insertApplicant(client, applicant, applicantId, resolvedStatusId);
        await autoAssignRecruiterAfterImport(applicant, applicantId, resolvedStatusId, user);
        await client.query('RELEASE SAVEPOINT v1_applicant_import_row');
        results.imported++;
      } catch (error) {
        await client.query('ROLLBACK TO SAVEPOINT v1_applicant_import_row');
        results.errors.push(`Failed to import ${applicant.email}: ${(error as Error).message}`);
      }
    }

    await client.query('COMMIT');
    return { status: 'completed' as const, results };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
