import prisma from '@/lib/prisma';
import { readRequestJsonResult } from '@/lib/request-json';
import { APPLICANT_EVALUATION_DETAIL_INCLUDE } from './applicant-evaluation-detail-include';
import { updateEvaluationSchema, type UpdateEvaluationInput } from './applicant-evaluation-detail-schema';
import {
  dedupeEvaluationDetailScores,
  mapDetailExpertiseScores,
  mapDetailPersonalityScores,
} from './applicant-evaluation-detail-scores';

export function fetchApplicantEvaluationById(evaluationId: string) {
  return prisma.applicantEvaluation.findUnique({
    where: { id: evaluationId },
    include: APPLICANT_EVALUATION_DETAIL_INCLUDE,
  });
}

export function fetchExistingApplicantEvaluation(evaluationId: string) {
  return prisma.applicantEvaluation.findUnique({
    where: { id: evaluationId },
  });
}

export async function parseEvaluationDetailUpdateBody(request: Request) {
  const bodyResult = await readRequestJsonResult(request);
  return updateEvaluationSchema.parse(bodyResult.ok ? bodyResult.value : undefined);
}

export async function updateApplicantEvaluationById(
  evaluationId: string,
  existingEvaluation: { completedAt: Date | null },
  input: UpdateEvaluationInput
) {
  const uniqueScores = dedupeEvaluationDetailScores(input);

  const evaluation = await prisma.applicantEvaluation.update({
    where: { id: evaluationId },
    data: {
      status: input.status,
      overallScore: input.overallScore,
      comments: input.comments,
      completedAt: input.status === 'completed' ? new Date() : existingEvaluation.completedAt,
      ...(uniqueScores.personalityScores && {
        personalityScores: {
          deleteMany: {},
          create: mapDetailPersonalityScores(uniqueScores.personalityScores),
        },
      }),
      ...(uniqueScores.expertiseScores && {
        expertiseScores: {
          deleteMany: {},
          create: mapDetailExpertiseScores(uniqueScores.expertiseScores),
        },
      }),
    },
    include: APPLICANT_EVALUATION_DETAIL_INCLUDE,
  });

  return { evaluation, uniqueScores };
}

export function deleteApplicantEvaluation(evaluationId: string) {
  return prisma.applicantEvaluation.delete({
    where: { id: evaluationId },
  });
}
