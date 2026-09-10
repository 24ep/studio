import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

const recruiterSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} as const satisfies Prisma.UserSelect;

const positionHeadcountSelect = {
  id: true,
  title: true,
  recruiterId: true,
  isOpen: true,
  headcounts: {
    select: {
      id: true,
      status: true,
      applicantId: true,
    },
  },
} as const satisfies Prisma.PositionSelect;

type RecruiterSummary = Prisma.UserGetPayload<{ select: typeof recruiterSelect }>;
type PositionHeadcountSummary = Prisma.PositionGetPayload<{ select: typeof positionHeadcountSelect }>;

function countVacantHeadcounts(positions: PositionHeadcountSummary[]) {
  return positions.reduce((total, position) => {
    const vacantHeadcounts = position.headcounts.filter((headcount) =>
      headcount.status === 'vacant' || !headcount.applicantId
    );
    return total + vacantHeadcounts.length;
  }, 0);
}

function buildRecruiterStats(recruiters: RecruiterSummary[], openPositions: PositionHeadcountSummary[]) {
  return recruiters.map((recruiter) => {
    const recruiterPositions = openPositions.filter((position) => position.recruiterId === recruiter.id);

    return {
      id: recruiter.id,
      name: recruiter.name,
      email: recruiter.email,
      avatarUrl: recruiter.avatarUrl,
      vacantHeadcount: countVacantHeadcounts(recruiterPositions),
      totalPositions: recruiterPositions.length,
    };
  });
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all recruiters
    const recruiters = await prisma.user.findMany({
      where: {
        role: 'Recruiter',
      },
      select: recruiterSelect,
      orderBy: {
        name: 'asc',
      },
    });

    // Get all positions with their headcount data (both open and closed)
    const allPositions = await prisma.position.findMany({
      select: positionHeadcountSelect,
    });

    // Filter for open positions for headcount calculations
    const openPositions = allPositions.filter((position) => position.isOpen);

    // Calculate vacant headcount for each recruiter
    const recruiterStats = buildRecruiterStats(recruiters, openPositions);

    // Add unassigned positions stats (include both open and closed positions)
    const unassignedPositions = allPositions.filter((position) => !position.recruiterId);
    const totalUnassignedVacant = countVacantHeadcounts(unassignedPositions);

    const result = {
      recruiters: recruiterStats,
      unassigned: {
        vacantHeadcount: totalUnassignedVacant,
        totalPositions: unassignedPositions.length,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching recruiter headcount stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
