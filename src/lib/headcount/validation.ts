/**
 * Headcount Validation Functions
 * Functions for validating headcount operations
 */

import prisma from '@/lib/prisma';
import { getRecruitmentStageByName } from '../recruitmentStageUtils';
import type { ValidationResult, UnassignWarning } from './types';

/**
 * Validate if a Applicant can be set to "Hired" status based on headcount availability
 * @param applicantId - The Applicant ID to validate
 * @param positionId - The position ID to check headcounts for
 * @returns Object with validation result and details
 */
export async function validateApplicantHiringStatus(
  applicantId: string, 
  positionId: string
): Promise<ValidationResult> {
  try {
    // Check if position has defined headcounts
    const headcounts = await prisma.headcount.findMany({
      where: { positionId },
      select: {
        id: true,
        status: true,
        applicantId: true,
      },
    });

    if (headcounts.length === 0) {
      return {
        canHire: false,
        reason: 'NO_HEADCOUNT',
        message: 'This position has no headcount defined. Cannot hire Applicant without available headcount.',
        headcountStatus: {
          hasHeadcounts: false,
          totalHeadcounts: 0,
          vacantHeadcounts: 0,
          filledHeadcounts: 0,
        },
      };
    }

    // A headcount is only considered filled if it has status 'filled' AND has a Applicant assigned
    const vacantHeadcounts = headcounts.filter(headcount => headcount.status === 'vacant' || headcount.applicantId === null);
    const filledHeadcounts = headcounts.filter(headcount => headcount.status === 'filled' && headcount.applicantId !== null);

    if (vacantHeadcounts.length === 0) {
      return {
        canHire: false,
        reason: 'NO_VACANT_HEADCOUNT',
        message: 'All headcounts for this position are already filled. Cannot hire Applicant without available headcount.',
        headcountStatus: {
          hasHeadcounts: true,
          totalHeadcounts: headcounts.length,
          vacantHeadcounts: 0,
          filledHeadcounts: filledHeadcounts.length,
        },
      };
    }

    // Check if Applicant is already assigned to a headcount
    const existingAssignment = headcounts.find(headcount => headcount.applicantId === applicantId);
    if (existingAssignment) {
      return {
        canHire: true,
        reason: 'ALREADY_ASSIGNED',
        message: 'Applicant is already assigned to a headcount.',
        headcountId: existingAssignment.id,
        headcountStatus: {
          hasHeadcounts: true,
          totalHeadcounts: headcounts.length,
          vacantHeadcounts: vacantHeadcounts.length,
          filledHeadcounts: filledHeadcounts.length,
        },
      };
    }

    return {
      canHire: true,
      reason: 'VACANT_HEADCOUNT_AVAILABLE',
      message: 'Vacant headcount available for hiring.',
      availableHeadcountId: vacantHeadcounts[0].id,
      headcountStatus: {
        hasHeadcounts: true,
        totalHeadcounts: headcounts.length,
        vacantHeadcounts: vacantHeadcounts.length,
        filledHeadcounts: filledHeadcounts.length,
      },
    };
  } catch (error) {
    console.error('Error validating Applicant hiring status:', error);
    throw error;
  }
}

/**
 * Check if unassigning a Applicant from headcount would affect their status
 * @param headcountId - The headcount ID to check
 * @returns Object with warning details if applicable
 */
export async function checkHeadcountUnassignWarning(headcountId: string): Promise<UnassignWarning> {
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

    if (!headcount || !headcount.applicant) {
      return {
        hasWarning: false,
      };
    }

    // Check if Applicant status is "Hired" and this is their only headcount assignment
    const hiredStageId = await getRecruitmentStageByName('Hired');
    if (hiredStageId && headcount.applicant.statusId === hiredStageId) {
      const applicantId = headcount.applicant.id;
      const applicantHeadcounts = await prisma.headcount.findMany({
        where: {
          applicantId: applicantId,
          status: 'filled',
        },
      });

      if (applicantHeadcounts.length <= 1) {
        return {
          hasWarning: true,
          warningType: 'APPLICANT_STATUS_WILL_CHANGE',
          message: `Unassigning this applicant will change their status from "Hired" to "Applied" since they will no longer have an active headcount assignment.`,
          applicant: headcount.applicant,
          position: headcount.position,
        };
      }
    }

    return {
      hasWarning: false,
    };
  } catch (error) {
    console.error('Error checking headcount unassign warning:', error);
    throw error;
  }
}
