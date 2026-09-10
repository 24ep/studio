import prisma from '@/lib/prisma';
import type { CreateEvaluationInput, ExpertiseScoreInput, PersonalityScoreInput } from './applicant-evaluation-schema';

const APPLICANT_EVALUATION_INCLUDE = {
  evaluator: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  personalityScores: {
    include: {
      trait: {
        include: {
          group: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
  },
  expertiseScores: {
    include: {
      skill: {
        include: {
          group: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
    },
  },
} as const;

function dedupeScores<TScore, TKey extends string>(
  scores: TScore[] | undefined,
  getKey: (score: TScore) => TKey
) {
  return scores ? Array.from(new Map(scores.map(score => [getKey(score), score])).values()) : undefined;
}

function mapPersonalityScores(scores: PersonalityScoreInput[], defaultNotes = '') {
  return scores.map(score => ({
    traitId: score.traitId,
    score: score.score,
    notes: score.notes || defaultNotes,
  }));
}

function mapExpertiseScores(scores: ExpertiseScoreInput[], defaultNotes = '') {
  return scores.map(score => ({
    skillId: score.skillId,
    score: score.score,
    notes: score.notes || defaultNotes,
  }));
}

export function dedupeEvaluationScores(input: CreateEvaluationInput) {
  return {
    personalityScores: dedupeScores(input.personalityScores, score => score.traitId) || [],
    expertiseScores: dedupeScores(input.expertiseScores, score => score.skillId),
  };
}

export async function fetchLatestApplicantEvaluation(applicantId: string) {
  return prisma.applicantEvaluation.findFirst({
    where: { applicantId },
    include: APPLICANT_EVALUATION_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}

async function validateEvaluationReferences(applicantId: string, input: CreateEvaluationInput, evaluatorId: string) {
  const applicant = await prisma.applicant.findUnique({ where: { id: applicantId } });
  if (!applicant) {
    return 'applicant-not-found' as const;
  }

  if (input.positionId) {
    const position = await prisma.position.findUnique({ where: { id: input.positionId } });
    if (!position) {
      return 'position-not-found' as const;
    }
  }

  if (input.evaluatorId) {
    const evaluator = await prisma.user.findUnique({ where: { id: evaluatorId } });
    if (!evaluator) {
      return 'evaluator-not-found' as const;
    }
  }

  return null;
}

async function updateSiblingEvaluationExpertiseScores(
  applicantId: string,
  currentEvaluationId: string,
  expertiseScores: ExpertiseScoreInput[] | undefined
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
          create: mapExpertiseScores(expertiseScores),
        },
      },
    });
  }
}

export async function saveApplicantEvaluation(applicantId: string, input: CreateEvaluationInput, fallbackEvaluatorId: string) {
  const evaluatorId = input.evaluatorId || fallbackEvaluatorId;
  const referenceError = await validateEvaluationReferences(applicantId, input, evaluatorId);
  if (referenceError) {
    return { status: referenceError };
  }

  const existingEvaluation = await prisma.applicantEvaluation.findFirst({
    where: { applicantId, evaluatorId },
  });
  const uniqueScores = dedupeEvaluationScores(input);

  const evaluation = existingEvaluation
    ? await prisma.applicantEvaluation.update({
      where: { id: existingEvaluation.id },
      data: {
        positionId: input.positionId,
        status: input.status,
        overallScore: input.overallScore,
        comments: input.comments,
        completedAt: input.status === 'completed' ? new Date() : existingEvaluation.completedAt,
        personalityScores: {
          deleteMany: {},
          create: mapPersonalityScores(uniqueScores.personalityScores),
        },
        expertiseScores: uniqueScores.expertiseScores ? {
          deleteMany: {},
          create: mapExpertiseScores(uniqueScores.expertiseScores),
        } : undefined,
      },
      include: APPLICANT_EVALUATION_INCLUDE,
    })
    : await prisma.applicantEvaluation.create({
      data: {
        applicantId,
        positionId: input.positionId,
        evaluatorId,
        status: input.status,
        overallScore: input.overallScore,
        comments: input.comments,
        completedAt: input.status === 'completed' ? new Date() : null,
        personalityScores: {
          create: uniqueScores.personalityScores.map(score => ({
            traitId: score.traitId,
            score: score.score,
            notes: score.notes,
          })),
        },
        expertiseScores: uniqueScores.expertiseScores ? {
          create: uniqueScores.expertiseScores.map(score => ({
            skillId: score.skillId,
            score: score.score,
            notes: score.notes,
          })),
        } : undefined,
      },
      include: APPLICANT_EVALUATION_INCLUDE,
    });

  await updateSiblingEvaluationExpertiseScores(applicantId, evaluation.id, uniqueScores.expertiseScores);
  return { status: 'saved' as const, evaluation };
}
