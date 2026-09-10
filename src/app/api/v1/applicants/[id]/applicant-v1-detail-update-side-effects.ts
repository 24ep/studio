import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import type { DbClient } from '@/lib/db';

async function resolveAppliedStageId() {
  try {
    const appliedStage = await prisma.recruitmentStage.findFirst({
      where: { name: { equals: 'Applied', mode: 'insensitive' } },
      select: { id: true },
    });
    if (appliedStage) {
      return appliedStage.id;
    }

    const firstStage = await prisma.recruitmentStage.findFirst({
      orderBy: { sortOrder: 'asc' },
      select: { id: true },
    });
    return firstStage?.id || null;
  } catch (error) {
    console.error('Failed to resolve stage for recruiter assignment transition', error);
    return null;
  }
}

export async function replaceApplicantJobMatches(client: DbClient, applicantId: string, jobMatches: Array<{ jobId: string; fitScore: number; matchReasons?: string[] }>) {
  await client.query('DELETE FROM "JobMatch" WHERE "applicant_id" = $1', [applicantId]);

  for (const match of jobMatches) {
    await client.query(
      `
        INSERT INTO "JobMatch" (id, "applicant_id", "jobId", "fitScore", "matchReasons", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `,
      [uuidv4(), applicantId, match.jobId, match.fitScore, match.matchReasons || []]
    );
  }
}

export async function recordApplicantStatusTransition(
  client: DbClient,
  applicantId: string,
  positionId: string | null,
  statusId: string,
  userId: string
) {
  await client.query(
    `
      INSERT INTO "TransitionRecord" (id, "applicant_id", "positionId", stage, notes, "actingUserId", date, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW());
    `,
    [uuidv4(), applicantId, positionId, statusId, 'Status changed via API', userId]
  );
}

export async function autoAssignRecruiterAfterPositionChange(
  applicantId: string,
  newPositionId: string | null,
  userId: string
) {
  if (!newPositionId) {
    return;
  }

  try {
    const position = await prisma.position.findUnique({
      where: { id: newPositionId },
      include: {
        recruiter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!position || !position.recruiterId || !position.recruiter) {
      return;
    }

    await prisma.applicant.update({
      where: { id: applicantId },
      data: {
        recruiter: { connect: { id: position.recruiterId } },
        updatedAt: new Date(),
      },
      include: {
        recruiter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await prisma.transitionRecord.create({
      data: {
        id: uuidv4(),
        applicant: { connect: { id: applicantId } },
        position: { connect: { id: newPositionId } },
        stage: await resolveAppliedStageId() || 'Applied',
        notes: `Recruiter auto-assigned from position: ${position.recruiter.name}`,
        actingUser: { connect: { id: userId } },
        date: new Date(),
      },
    });
  } catch (syncError) {
    console.error('Failed to auto-assign recruiter after position update:', syncError);
  }
}
