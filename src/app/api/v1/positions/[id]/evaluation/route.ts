import { auth } from '@/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const positionId = (await params).id;

    let isAuthorized = false;
    if (session?.user) {
      isAuthorized = true;
    } else if (token) {
      // Validate token for a Applicant assigned to this position
      const link = await prisma.applicantEvaluationLink.findFirst({
        where: {
          token: token,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          applicant: {
            positionId: positionId
          }
        }
      });
      if (link) isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all evaluation assignments for the position
    // console.log(`[Evaluation API] Fetching evaluation criteria for position: ${positionId}`);

    const [expertiseGroups, expertiseSkills, personalityGroups, personalityTraits] = await Promise.all([
      prisma.positionExpertiseGroup.findMany({
        where: { positionId },
        include: {
          group: {
            include: {
              skills: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  maxScore: true,
                  skillType: true,
                  isActive: true
                }
              }
            }
          }
        }
      }),
      prisma.positionExpertiseSkill.findMany({
        where: { positionId },
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
      }),
      prisma.positionPersonalityGroup.findMany({
        where: {
          positionId,
          group: {
            isActive: true
          }
        },
        include: {
          group: {
            include: {
              traits: {
                where: {
                  isActive: true
                },
                select: {
                  id: true,
                  name: true,
                  description: true,
                  shortDescription: true,
                  isActive: true
                }
              }
            }
          }
        }
      }),
      prisma.positionPersonalityTrait.findMany({
        where: {
          positionId,
          trait: {
            isActive: true
          }
        },
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
      })
    ]);

    return NextResponse.json({
      expertiseGroups,
      expertiseSkills,
      personalityGroups,
      personalityTraits
    });
  } catch (error) {
    console.error('Error fetching position evaluation assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch position evaluation assignments' },
      { status: 500 }
    );
  }
}
