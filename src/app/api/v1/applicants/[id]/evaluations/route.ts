export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicantId = (await params).id;

    // Get all evaluations for the Applicant
    const evaluations = await prisma.applicantEvaluation.findMany({
      where: { applicantId: applicantId },
      include: {
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            image: true,
            positionTitle: true
          }
        },
        personalityScores: {
          include: {
            trait: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true,
                    color: true
                  }
                }
              }
            }
          }
        },
        expertiseScores: {
          include: {
            skill: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true,
                    color: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error('Error fetching Applicant evaluations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
}

