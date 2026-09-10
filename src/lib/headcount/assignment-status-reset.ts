import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { getRecruitmentStageByName } from '../recruitmentStageUtils';
import type { UnassignmentResult } from './types';
import { shouldResetApplicantStatusAfterUnassign } from './assignment-utils';

type HeadcountUnassignStatusUpdateResult = UnassignmentResult['statusUpdateResult'];

interface ResetApplicantStatusAfterHeadcountUnassignInput {
  applicantId: string;
  positionId: string;
  actingUserId: string;
  wasHired: boolean;
  remainingHeadcountCount: number;
}

export async function resetApplicantStatusAfterHeadcountUnassign({
  applicantId,
  positionId,
  actingUserId,
  wasHired,
  remainingHeadcountCount,
}: ResetApplicantStatusAfterHeadcountUnassignInput): Promise<HeadcountUnassignStatusUpdateResult> {
  if (!shouldResetApplicantStatusAfterUnassign(wasHired, remainingHeadcountCount)) {
    return null;
  }

  const appliedStageId = await getRecruitmentStageByName('Applied');
  if (!appliedStageId) {
    console.error('Could not find Applied stage for status update');
    return null;
  }

  await prisma.applicant.update({
    where: { id: applicantId },
    data: { recruitmentStage: { connect: { id: appliedStageId } } },
  });

  const newTransitionId = uuidv4();
  await prisma.transitionRecord.create({
    data: {
      id: newTransitionId,
      applicant: { connect: { id: applicantId } },
      position: { connect: { id: positionId } },
      stage: appliedStageId,
      notes: 'Status automatically changed from "Hired" to "Applied" due to headcount unassignment',
      actingUser: { connect: { id: actingUserId } },
      date: new Date(),
    },
  });

  return {
    statusChanged: true,
    oldStatus: 'Hired',
    newStatus: 'Applied',
    transitionId: newTransitionId,
  };
}
