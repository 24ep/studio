/**
 * Headcount Assignment Functions
 * Functions for assigning/unassigning Applicants to headcounts
 */

import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/auditLog';
import { getRecruitmentStageByName } from '../recruitmentStageUtils';
import { autoClosePositionIfHeadcountFilled } from './position-automation';
import { broadcastPositionUpdates } from './broadcast';
import type { AssignmentResult, UnassignmentResult } from './types';
import { hasAssignedApplicant } from './assignment-utils';
import { resetApplicantStatusAfterHeadcountUnassign } from './assignment-status-reset';

/**
 * Automatically assign Applicant to headcount when status changes to "Hired"
 * @param applicantId - The Applicant ID
 * @param positionId - The position ID
 * @param actingUserId - The user ID performing the action
 * @param actingUserName - The user name performing the action
 * @returns Object with assignment result
 */
export async function assignApplicantToHeadcount(
  applicantId: string,
  positionId: string,
  actingUserId: string,
  actingUserName: string
): Promise<AssignmentResult> {
  try {
    // Find vacant headcount for this position (status is vacant OR no Applicant assigned)
    const vacantHeadcount = await prisma.headcount.findFirst({
      where: {
        positionId,
        OR: [
          { status: 'vacant' },
          { applicantId: null }
        ],
      },
      orderBy: {
        createdAt: 'asc', // Get the oldest vacant headcount
      },
    });

    if (!vacantHeadcount) {
      return {
        success: false,
        message: 'No vacant headcount available for this position',
      };
    }

    // Update the headcount to assign this Applicant
    await prisma.headcount.update({
      where: { id: vacantHeadcount.id },
      data: {
        status: 'filled',
        applicantId: applicantId,
      },
    });

    // Log the assignment
    await logAudit(
      'AUDIT', 
      `Applicant assigned to headcount automatically when status changed to "Hired" by ${actingUserName}.`, 
      'Headcount:AutoAssign', 
      actingUserId, 
      {
        applicantId: applicantId,
        headcountId: vacantHeadcount.id,
        positionId,
      }
    );

    // Check if all headcounts are now filled and auto-close position if needed
    let autoCloseResult = null;
    try {
      autoCloseResult = await autoClosePositionIfHeadcountFilled(
        positionId,
        actingUserId,
        actingUserName
      );
    } catch (autoCloseError) {
      console.error('Error auto-closing position:', autoCloseError);
      // Don't fail the headcount assignment if auto-close fails
    }

    // Broadcast real-time updates for headcount changes
    await broadcastPositionUpdates();

    return {
      success: true,
      message: 'Applicant automatically assigned to headcount',
      headcountId: vacantHeadcount.id,
      autoCloseResult,
    };
  } catch (error) {
    console.error('Error assigning Applicant to headcount:', error);
    throw error;
  }
}

/**
 * Unassign Applicant from headcount and update their status if needed
 * @param headcountId - The headcount ID
 * @param actingUserId - The user ID performing the action
 * @param actingUserName - The user name performing the action
 * @returns Object with unassign result
 */
export async function unassignApplicantFromHeadcount(
  headcountId: string,
  actingUserId: string,
  actingUserName: string
): Promise<UnassignmentResult> {
  try {
    const headcount = await prisma.headcount.findUnique({
      where: { id: headcountId },
      include: {
        applicant: {
          select: {
            id: true,
            name: true,
            email: true,
            statusId: true,
          },
        },
        position: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!hasAssignedApplicant(headcount)) {
      return {
        success: false,
        message: 'Headcount not found or no Applicant assigned',
      };
    }

    const applicant = headcount.applicant;
    const applicantId = applicant.id;
    const hiredStageId = await getRecruitmentStageByName('Hired');
    const wasHired = Boolean(hiredStageId && applicant.statusId === hiredStageId);

    // Update the headcount to remove Applicant assignment
    await prisma.headcount.update({
      where: { id: headcountId },
      data: {
        status: 'vacant',
        applicantId: null,
      },
    });

    // Check if Applicant has additional headcount assignments
    const remainingHeadcounts = await prisma.headcount.findMany({
      where: {
        applicantId: applicantId,
        status: 'filled',
      },
    });

    const statusUpdateResult = await resetApplicantStatusAfterHeadcountUnassign({
      applicantId,
      positionId: headcount.position.id,
      actingUserId,
      wasHired,
      remainingHeadcountCount: remainingHeadcounts.length,
    });

    // Log the unassignment
    await logAudit(
      'AUDIT', 
      `Applicant unassigned from headcount by ${actingUserName}.`, 
      'Headcount:Unassign', 
      actingUserId, 
      {
        applicantId: applicantId,
        headcountId,
        positionId: headcount.position.id,
        statusUpdateResult,
      }
    );

    // Broadcast real-time updates for headcount changes
    await broadcastPositionUpdates();

    return {
      success: true,
      message: 'Applicant unassigned from headcount successfully',
      statusUpdateResult,
    };
  } catch (error) {
    console.error('Error unassigning Applicant from headcount:', error);
    throw error;
  }
}
