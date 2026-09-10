import { Prisma, type Applicant } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { createDateInTimezone } from '@/lib/dateUtils';
import { NotificationService } from '@/lib/notificationService';
import type { CreateApplicantInput } from './applicants-v1-schema';
import type { ApplicantCreatePayload } from './applicants-v1-payload';

interface BuildApplicantCreateDataArgs {
  applicantId: string;
  resolvedStageId: string;
  input: CreateApplicantInput;
  payload: ApplicantCreatePayload;
}

export async function resolveAppliedStageId(): Promise<string | null> {
  try {
    const appliedStage = await prisma.recruitmentStage.findFirst({
      where: {
        OR: [
          { name: { equals: 'Applied', mode: 'insensitive' } },
          { name: { equals: 'applied', mode: 'insensitive' } },
        ],
      },
      select: { id: true },
    });

    if (appliedStage?.id) {
      return appliedStage.id;
    }

    const firstStage = await prisma.recruitmentStage.findFirst({
      orderBy: { sortOrder: 'asc' },
      select: { id: true },
    });
    return firstStage?.id || null;
  } catch {
    return null;
  }
}

export function buildApplicantCreateData({
  applicantId,
  resolvedStageId,
  input,
  payload,
}: BuildApplicantCreateDataArgs): Prisma.ApplicantUncheckedCreateInput {
  const applicantData: Prisma.ApplicantUncheckedCreateInput = {
    id: applicantId,
    name: payload.name,
    email: payload.email.toLowerCase(),
    phone: payload.contactInfo.phone || null,
    statusId: resolvedStageId,
    fitScore: payload.fitScore,
    parsedData: payload.parsedData as Prisma.InputJsonValue,
    sourceId: input.sourceId,
    subSource: input.subSource || null,
    expectedSalary: payload.expectedSalary,
    applicationDate: createDateInTimezone(),
    emailDate: payload.applicantInfo.emailDate ? new Date(payload.applicantInfo.emailDate) : null,
    emailSubject: payload.applicantInfo.emailSubject || null,
    emailId: payload.applicantInfo.emailId || null,
    emailMetadata: payload.applicantInfo.emailMetadata
      ? payload.applicantInfo.emailMetadata as Prisma.InputJsonValue
      : Prisma.DbNull,
    createdAt: createDateInTimezone(),
    updatedAt: createDateInTimezone(),
  };

  if (payload.positionId) {
    applicantData.positionId = payload.positionId;
  }

  return applicantData;
}

export async function createInitialApplicantTransition(
  applicantId: string,
  resolvedStageId: string,
  userId: string
) {
  await prisma.transitionRecord.create({
    data: {
      id: uuidv4(),
      applicant: { connect: { id: applicantId } },
      stage: resolvedStageId,
      notes: 'Initial creation via API',
      actingUser: { connect: { id: userId } },
      date: createDateInTimezone(),
    },
  });
}

export async function autoAssignRecruiterToApplicant(
  applicant: Applicant,
  applicantId: string,
  positionId: string | null,
  resolvedStageId: string,
  name: string,
  userId: string
) {
  if (!positionId) {
    return applicant;
  }

  try {
    const position = await prisma.position.findUnique({
      where: { id: positionId },
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
      return applicant;
    }

    const updatedApplicant = await prisma.applicant.update({
      where: { id: applicantId },
      data: {
        recruiter: { connect: { id: position.recruiterId } },
        updatedAt: createDateInTimezone(),
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
        position: { connect: { id: positionId } },
        stage: resolvedStageId,
        notes: `Recruiter auto-assigned from position: ${position.recruiter.name}`,
        actingUser: { connect: { id: userId } },
        date: createDateInTimezone(),
      },
    });

    try {
      await NotificationService.notifyApplicantAdded(
        applicantId,
        name,
        positionId,
        position.title,
        position.recruiterId,
        userId
      );
    } catch (notificationError) {
      console.error('Failed to send Applicant added notification:', notificationError);
    }

    return updatedApplicant;
  } catch (syncError) {
    console.error('Failed to auto-assign recruiter after Applicant creation:', syncError);
    return applicant;
  }
}
