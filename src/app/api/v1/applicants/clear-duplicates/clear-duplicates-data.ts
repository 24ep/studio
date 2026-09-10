import prisma from '@/lib/prisma';
import type { DuplicateApplicant } from './clear-duplicates-types';

export async function verifyClearDuplicatesDatabaseConnection() {
  await prisma.$queryRaw`SELECT 1`;
}

export async function fetchApplicantsForDuplicateScan(positionId: string | null | undefined): Promise<DuplicateApplicant[]> {
  const whereClause: { positionId?: string } = {};
  if (positionId) {
    whereClause.positionId = positionId;
  }

  return prisma.applicant.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      positionId: true,
      fitScore: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}

export async function deleteDuplicateApplicants(applicantIds: string[]) {
  if (applicantIds.length === 0) {
    return { count: 0 };
  }

  return prisma.applicant.deleteMany({
    where: {
      id: {
        in: applicantIds,
      },
    },
  });
}
