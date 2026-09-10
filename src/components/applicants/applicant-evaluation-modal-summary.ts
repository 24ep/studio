import type {
  ApplicantEvaluationData,
  ApplicantEvaluationLinkState,
  ApplicantEvaluationTrait,
  AveragedApplicantEvaluationData,
} from './applicant-evaluation-modal-types';
import {
  getString,
  isRecord,
  normalizeCreatedBy,
} from './applicant-evaluation-modal-normalizers';

export function formatPersonalityScore(score: number): string {
  return score % 1 === 0 ? score.toString() : score.toFixed(1);
}

export function getDaysUntil(expiresAt: string, now = Date.now()): number {
  const expiresTime = new Date(expiresAt).getTime();
  if (!Number.isFinite(expiresTime)) return 1;

  return Math.max(1, Math.ceil((expiresTime - now) / (24 * 60 * 60 * 1000)));
}

export function summarizeApplicantEvaluations(evaluations: ApplicantEvaluationData[]): {
  evaluationData: ApplicantEvaluationData | null;
  averagedEvaluationData: AveragedApplicantEvaluationData | null;
} {
  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    return { evaluationData: null, averagedEvaluationData: null };
  }

  const { overallScore, personalityScores } = summarizeEvaluationScores(evaluations);

  return {
    evaluationData: evaluations[0] || null,
    averagedEvaluationData: {
      overallScore,
      personalityScores,
      evaluatorCount: evaluations.length,
    },
  };
}

export function summarizeSingleApplicantEvaluation(evaluation: ApplicantEvaluationData | null): {
  evaluationData: ApplicantEvaluationData | null;
  averagedEvaluationData: AveragedApplicantEvaluationData | null;
} {
  if (!evaluation) {
    return { evaluationData: null, averagedEvaluationData: null };
  }

  return {
    evaluationData: evaluation,
    averagedEvaluationData: {
      overallScore: evaluation.overallScore || 0,
      personalityScores: (evaluation.personalityScores || []).map((personalityScore) => ({
        trait: personalityScore.trait,
        averageScore: personalityScore.score,
        evaluatorCount: 1,
      })),
      evaluatorCount: 1,
    },
  };
}

export function normalizeApplicantEvaluationLinkState(
  data: unknown,
  now = Date.now()
): ApplicantEvaluationLinkState {
  if (!isRecord(data)) {
    throw new Error('Invalid response from server');
  }

  const url = getString(data.url);
  const expiresAt = getString(data.expiresAt);
  if (!url || !expiresAt) {
    throw new Error('Invalid response from server');
  }

  return {
    linkInfo: { url, expiresAt, createdBy: normalizeCreatedBy(data.createdBy) },
    requireLogin: Boolean(data.requireLogin ?? true),
    expireDays: getDaysUntil(expiresAt, now),
    existing: Boolean(data.existing),
  };
}

function summarizeEvaluationScores(evaluations: ApplicantEvaluationData[]) {
  const traitScoreMap = new Map<string, { scores: number[]; trait: ApplicantEvaluationTrait }>();
  let totalOverallScore = 0;
  let overallScoreCount = 0;

  evaluations.forEach((evaluation) => {
    totalOverallScore += evaluation.overallScore;
    overallScoreCount++;

    evaluation.personalityScores.forEach((personalityScore) => {
      const { score, trait } = personalityScore;
      if (!trait || score === null || score === undefined) return;

      if (!traitScoreMap.has(trait.id)) {
        traitScoreMap.set(trait.id, { scores: [], trait });
      }
      traitScoreMap.get(trait.id)!.scores.push(score);
    });
  });

  return {
    overallScore: overallScoreCount > 0 ? totalOverallScore / overallScoreCount : 0,
    personalityScores: Array.from(traitScoreMap.values()).map(({ scores, trait }) => ({
      trait,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      evaluatorCount: scores.length,
    })),
  };
}
