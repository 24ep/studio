/**
 * Headcount Status Functions
 * Functions for checking headcount status
 */

import prisma from '@/lib/prisma';
import type { HeadcountStatus } from './types';

/**
 * Check if all headcounts for a position are filled
 * @param positionId - The position ID to check
 * @returns Object with isFilled boolean and headcount details
 */
export async function checkPositionHeadcountStatus(positionId: string): Promise<HeadcountStatus> {
  try {
    // Get all headcounts for the position
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
        isFilled: false,
        totalHeadcounts: 0,
        filledHeadcounts: 0,
        vacantHeadcounts: 0,
        hasHeadcounts: false,
      };
    }

    // A headcount is only considered filled if it has status 'filled' AND has a Applicant assigned
    const filledHeadcounts = headcounts.filter(headcount => headcount.status === 'filled' && headcount.applicantId !== null).length;
    const vacantHeadcounts = headcounts.filter(headcount => headcount.status === 'vacant' || headcount.applicantId === null).length;
    const isFilled = vacantHeadcounts === 0 && filledHeadcounts > 0;

    return {
      isFilled,
      totalHeadcounts: headcounts.length,
      filledHeadcounts,
      vacantHeadcounts,
      hasHeadcounts: true,
    };
  } catch (error) {
    console.error('Error checking position headcount status:', error);
    throw error;
  }
}
