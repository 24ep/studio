import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { notifyV1BulkActionAssignedRecruiter } from './applicants-v1-bulk-action-notifications';
import { resolveV1BulkActionAppliedStageId } from './applicants-v1-bulk-action-stage';
import type { V1ApplicantsBulkActionInput, V1BulkActionUser } from './applicants-v1-bulk-action-types';

export async function syncPositionRecruiterForV1BulkAction(
  input: V1ApplicantsBulkActionInput,
  applicantIds: string[],
  user: V1BulkActionUser
) {
  if (input.action !== 'assign_position' || !input.data?.positionId) {
    return;
  }

  try {
    const position = await prisma.position.findUnique({
      where: { id: input.data.positionId },
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

    if (!position?.recruiterId || !position.recruiter) {
      return;
    }

    const positionWithRecruiter = {
      title: position.title,
      recruiterId: position.recruiterId,
      recruiter: position.recruiter,
    };

    for (const applicantId of applicantIds) {
      await syncPositionRecruiterForApplicant(applicantId, input.data.positionId, positionWithRecruiter, user);
    }
  } catch (error) {
    console.error('Failed to get position for recruiter assignment:', error);
  }
}

async function syncPositionRecruiterForApplicant(
  applicantId: string,
  positionId: string,
  position: { title: string; recruiterId: string; recruiter: { name: string | null } },
  user: V1BulkActionUser
) {
  try {
    await prisma.applicant.update({
      where: { id: applicantId },
      data: {
        recruiter: { connect: { id: position.recruiterId } },
        updatedAt: new Date(),
      },
    });

    const appliedStageId = await resolveV1BulkActionAppliedStageId();
    await prisma.transitionRecord.create({
      data: {
        id: uuidv4(),
        applicant: { connect: { id: applicantId } },
        position: { connect: { id: positionId } },
        stage: appliedStageId || 'Applied',
        notes: `Recruiter auto-assigned from position: ${position.recruiter.name}`,
        actingUser: { connect: { id: user.id } },
        date: new Date(),
      },
    });

    await notifyV1BulkActionAssignedRecruiter(applicantId, positionId, position, user.id);
  } catch (syncError) {
    console.error(`Failed to auto-assign recruiter for Applicant ${applicantId}:`, syncError);
  }
}
