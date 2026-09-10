import prisma from '@/lib/prisma';
import { mapDetailExpertiseScores } from './applicant-evaluation-detail-scores';
import type { UpdateExpertiseScoreInput } from './applicant-evaluation-detail-schema';

export async function updateSiblingEvaluationExpertiseScores(
  applicantId: string,
  currentEvaluationId: string,
  expertiseScores: UpdateExpertiseScoreInput[] | undefined
) {
  if (!expertiseScores || expertiseScores.length === 0) {
    return;
  }

  const allEvaluations = await prisma.applicantEvaluation.findMany({
    where: {
      applicantId,
      id: { not: currentEvaluationId },
    },
  });

  for (const otherEvaluation of allEvaluations) {
    await prisma.applicantEvaluation.update({
      where: { id: otherEvaluation.id },
      data: {
        expertiseScores: {
          deleteMany: {},
          create: mapDetailExpertiseScores(expertiseScores),
        },
      },
    });
  }
}
